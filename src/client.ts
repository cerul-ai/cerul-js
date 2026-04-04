import { CerulError } from "./errors.js";
import type { CerulClient, CerulOptions, SearchRequest, SearchResponse, UsageResponse } from "./types.js";
import { SDK_VERSION } from "./version.js";

const DEFAULT_BASE_URL = "https://api.cerul.ai";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRY_ATTEMPTS = 3;

function getEnvApiKey(): string | undefined {
  const maybeProcess = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };
  if (maybeProcess.process?.env?.CERUL_API_KEY) {
    return maybeProcess.process.env.CERUL_API_KEY;
  }
  return undefined;
}

function normalizeBaseUrl(baseUrl: string | undefined): string {
  return (baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function normalizeTimeout(timeout: number | undefined): number {
  if (timeout == null) {
    return DEFAULT_TIMEOUT_MS;
  }
  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new TypeError("timeout must be a positive number");
  }
  return timeout;
}

function requireFetch(customFetch?: typeof fetch): typeof fetch {
  const resolvedFetch = customFetch ?? globalThis.fetch;
  if (typeof resolvedFetch !== "function") {
    throw new Error("A global fetch implementation is required.");
  }
  return resolvedFetch;
}

function requireApiKey(apiKey: string | undefined): string {
  const resolvedApiKey = apiKey ?? getEnvApiKey();
  if (!resolvedApiKey) {
    throw new CerulError({
      status: 0,
      code: "missing_api_key",
      message: "Cerul API key is required. Pass apiKey or set CERUL_API_KEY."
    });
  }
  return resolvedApiKey;
}

function validateSearchRequest(request: SearchRequest): void {
  if (typeof request.query !== "string" || request.query.trim().length === 0) {
    throw new TypeError("search request query must be a non-empty string");
  }
  if (request.query.length > 400) {
    throw new TypeError("search request query must be 400 characters or fewer");
  }
  if (request.max_results != null && (!Number.isInteger(request.max_results) || request.max_results < 1 || request.max_results > 50)) {
    throw new TypeError("max_results must be an integer between 1 and 50");
  }
  if (request.ranking_mode != null && request.ranking_mode !== "embedding" && request.ranking_mode !== "rerank") {
    throw new TypeError("ranking_mode must be 'embedding' or 'rerank'");
  }
  if (request.filters?.published_after && !/^\d{4}-\d{2}-\d{2}$/.test(request.filters.published_after)) {
    throw new TypeError("filters.published_after must be in YYYY-MM-DD format");
  }
}

function parseRequestId(response: Response, body: unknown): string | null {
  const headerRequestId =
    response.headers.get("x-request-id") ??
    response.headers.get("request-id");
  if (headerRequestId) {
    return headerRequestId;
  }
  if (body && typeof body === "object" && "request_id" in body && typeof body.request_id === "string") {
    return body.request_id;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_RETRY_DELAY_MS = 60_000;

function parseRetryAfter(headerValue: string | null): number | null {
  if (!headerValue) {
    return null;
  }
  let ms: number | null = null;
  const numeric = Number(headerValue);
  if (Number.isFinite(numeric) && numeric >= 0) {
    ms = numeric * 1_000;
  } else {
    const dateValue = Date.parse(headerValue);
    if (Number.isFinite(dateValue)) {
      ms = Math.max(dateValue - Date.now(), 0);
    }
  }
  return ms != null ? Math.min(ms, MAX_RETRY_DELAY_MS) : null;
}

function defaultBackoffDelay(attempt: number): number {
  return 250 * 2 ** (attempt - 1);
}

function toCerulError(error: unknown): CerulError {
  if (error instanceof CerulError) {
    return error;
  }
  if (error instanceof Error && error.name === "AbortError") {
    return new CerulError({
      status: 0,
      code: "timeout",
      message: "The request timed out.",
      cause: error
    });
  }
  return new CerulError({
    status: 0,
    code: "network_error",
    message: error instanceof Error ? error.message : "Unknown network error",
    cause: error
  });
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function shouldRetryResponse(response: Response, retryEnabled: boolean): boolean {
  if (!retryEnabled) {
    return false;
  }
  return response.status === 429 || response.status >= 500;
}

async function requestJson<T>(
  resolvedFetch: typeof fetch,
  options: Required<Pick<CerulOptions, "retry">> & { apiKey: string; baseUrl: string; timeout: number },
  path: string,
  init: RequestInit
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);
    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");
    headers.set("authorization", `Bearer ${options.apiKey}`);
    headers.set("x-cerul-client-source", "sdk-js");
    if (init.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    headers.set("user-agent", `cerul-js/${SDK_VERSION}`);

    try {
      const response = await resolvedFetch(`${options.baseUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal
      });
      const body = await parseJsonSafely(response);
      if (response.ok) {
        return body as T;
      }

      const requestId = parseRequestId(response, body);
      const message =
        body && typeof body === "object" && "error" in body && body.error && typeof body.error === "object" && "message" in body.error
          ? String(body.error.message)
          : `Cerul API request failed with status ${response.status}`;
      const code =
        body && typeof body === "object" && "error" in body && body.error && typeof body.error === "object" && "code" in body.error
          ? String(body.error.code)
          : response.status === 429
            ? "rate_limited"
            : response.status >= 500
              ? "api_error"
              : "invalid_request";

      if (attempt < MAX_RETRY_ATTEMPTS && shouldRetryResponse(response, options.retry)) {
        const waitTime = parseRetryAfter(response.headers.get("retry-after")) ?? defaultBackoffDelay(attempt);
        await sleep(waitTime);
        continue;
      }

      throw new CerulError({
        status: response.status,
        code,
        message,
        requestId
      });
    } catch (error) {
      const cerulError = toCerulError(error);
      if (attempt < MAX_RETRY_ATTEMPTS && options.retry && (cerulError.status === 0 || cerulError.status >= 500)) {
        await sleep(defaultBackoffDelay(attempt));
        continue;
      }
      throw cerulError;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new CerulError({
    status: 0,
    code: "api_error",
    message: "Request failed after exhausting retries."
  });
}

export function cerul(options: CerulOptions = {}): CerulClient {
  const resolvedFetch = requireFetch(options.fetch);
  const apiKey = requireApiKey(options.apiKey);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const timeout = normalizeTimeout(options.timeout);
  const retry = options.retry ?? false;

  return {
    async search(request: SearchRequest): Promise<SearchResponse> {
      validateSearchRequest(request);
      return requestJson<SearchResponse>(
        resolvedFetch,
        { apiKey, baseUrl, timeout, retry },
        "/v1/search",
        {
          method: "POST",
          body: JSON.stringify({
            query: request.query,
            max_results: request.max_results ?? 10,
            ranking_mode: request.ranking_mode ?? "embedding",
            include_answer: request.include_answer ?? false,
            ...(request.filters ? { filters: request.filters } : {})
          })
        }
      );
    },

    async usage(): Promise<UsageResponse> {
      return requestJson<UsageResponse>(
        resolvedFetch,
        { apiKey, baseUrl, timeout, retry },
        "/v1/usage",
        {
          method: "GET"
        }
      );
    }
  };
}
