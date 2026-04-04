export interface CerulErrorOptions {
  status: number;
  code: string;
  message: string;
  requestId?: string | null;
  cause?: unknown;
}

export class CerulError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;

  constructor(options: CerulErrorOptions) {
    super(options.message);
    this.name = "CerulError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId ?? null;
    if (options.cause !== undefined) {
      Object.defineProperty(this, "cause", {
        configurable: true,
        enumerable: false,
        value: options.cause,
        writable: true
      });
    }
  }
}
