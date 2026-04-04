import test from "node:test";
import assert from "node:assert/strict";

import { CerulError, cerul } from "../src/index.js";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {})
    }
  });
}

test("search sends the expected request payload", async () => {
  let capturedRequest: Request | undefined;

  const client = cerul({
    apiKey: "cerul_sk_test",
    fetch: async (input, init) => {
      capturedRequest = new Request(input, init);
      return jsonResponse({
        results: [],
        credits_used: 1,
        credits_remaining: 99,
        request_id: "req_test_123"
      });
    }
  });

  const response = await client.search({
    query: "Sam Altman",
    max_results: 5,
    include_answer: true,
    filters: {
      speaker: "Sam Altman"
    }
  });

  assert.equal(response.credits_used, 1);
  assert.ok(capturedRequest);
  assert.equal(capturedRequest?.url, "https://api.cerul.ai/v1/search");
  assert.equal(capturedRequest?.headers.get("authorization"), "Bearer cerul_sk_test");

  const payload = await capturedRequest?.json();
  assert.deepEqual(payload, {
    query: "Sam Altman",
    max_results: 5,
    ranking_mode: "embedding",
    include_answer: true,
    filters: {
      speaker: "Sam Altman"
    }
  });
});

test("usage retries on 500 when retry is enabled", async () => {
  let attempts = 0;

  const client = cerul({
    apiKey: "cerul_sk_test",
    retry: true,
    fetch: async () => {
      attempts += 1;
      if (attempts < 2) {
        return jsonResponse(
          {
            error: {
              code: "api_error",
              message: "temporary failure"
            }
          },
          { status: 500 }
        );
      }

      return jsonResponse({
        tier: "free",
        period_start: "2026-04-01",
        period_end: "2026-04-30",
        credits_limit: 0,
        credits_used: 3,
        credits_remaining: 7,
        rate_limit_per_sec: 1,
        api_keys_active: 1
      });
    }
  });

  const response = await client.usage();

  assert.equal(attempts, 2);
  assert.equal(response.credits_remaining, 7);
});

test("search throws CerulError on timeout", async () => {
  const client = cerul({
    apiKey: "cerul_sk_test",
    timeout: 5,
    fetch: async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      })
  });

  await assert.rejects(
    () =>
      client.search({
        query: "timeout"
      }),
    (error: unknown) => {
      assert.ok(error instanceof CerulError);
      assert.equal(error.code, "timeout");
      return true;
    }
  );
});
