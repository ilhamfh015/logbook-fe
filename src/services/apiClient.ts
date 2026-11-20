
import { logger } from "@/lib/logger";
import { stripQuery } from "@/lib/logRedaction";

type ApiErrorKind = "http" | "network" | "timeout" | "parse";

type ApiErrorDetails = {
  code?: string | number;
  field?: string;
  requestId?: string;
  kind?: ApiErrorKind;
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;
  readonly code?: string | number;
  readonly field?: string;
  readonly requestId?: string;
  readonly kind?: ApiErrorKind;

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string> = {},
    details: ApiErrorDetails = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.code = details.code;
    this.field = details.field;
    this.requestId = details.requestId;
    this.kind = details.kind;
  }
}

const REQUEST_TIMEOUT_MS = 30_000;

function createRequestId(): string {
  try {
    const uuid = globalThis.crypto?.randomUUID?.();
    if (uuid) return uuid.replace(/-/g, "").slice(0, 8).toLowerCase();
  } catch {
    // Use the random fallback when the browser crypto API is unavailable.
  }
  return Math.floor(Math.random() * 0x1_0000_0000)
    .toString(16)
    .padStart(8, "0");
}

function defaultErrorMessage(status: number): string {
  if (status === 400) return "Permintaan tidak valid.";
  if (status === 401) return "Sesi berakhir. Silakan masuk kembali.";
  if (status === 403) return "Kamu tidak memiliki akses untuk tindakan ini.";
  if (status === 404) return "Data tidak ditemukan.";
  if (status === 409) return "Data berubah atau bentrok. Muat ulang lalu coba lagi.";
  if (status >= 500 && status < 600) {
    return "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
  }
  return "Terjadi kesalahan. Silakan coba lagi.";
}

function failureLevel(status: number, kind: ApiErrorKind, path: string) {
  if (kind === "network" || kind === "timeout" || kind === "parse" || status >= 500) {
    return "error" as const;
  }
  if (status === 404 || (status === 401 && path === "/api/auth/me")) return "debug" as const;
  return "warn" as const;
}

function logFailure(
  method: string,
  path: string,
  status: number,
  kind: ApiErrorKind,
  code: string | number | undefined,
  durationMs: number,
  requestId: string,
  fieldErrorCount: number,
) {
  const context = {
    method,
    path: stripQuery(path),
    status,
    kind,
    code,
    durationMs,
    requestId,
    fieldErrorCount,
  };
  const level = failureLevel(status, kind, context.path);
  if (level === "error") {
    logger.error("Permintaan API gagal", new Error("Permintaan API gagal"), context);
  } else {
    logger[level]("Permintaan API gagal", context);
  }
}

function createTimeoutError(
  method: string,
  path: string,
  startedAt: number,
  requestId: string,
) {
  const apiError = new ApiError(
    0,
    "Server terlalu lama merespons. Silakan coba lagi.",
    {},
    { requestId, kind: "timeout" },
  );
  logFailure(method, path, 0, "timeout", undefined, Date.now() - startedAt, requestId, 0);
  return apiError;
}

function readErrorDetails(body: unknown) {
  let message: string | undefined;
  let field: string | undefined;
  let code: string | number | undefined;
  let fieldErrors: Record<string, string> = {};

  if (body && typeof body === "object" && !Array.isArray(body)) {
    const errorBody = body as {
      message?: unknown;
      error?: unknown;
      code?: unknown;
      field?: unknown;
      fieldErrors?: unknown;
    };
    if (typeof errorBody.message === "string" && errorBody.message.trim()) {
      message = errorBody.message;
    } else if (typeof errorBody.error === "string" && errorBody.error.trim()) {
      message = errorBody.error;
    }
    if (typeof errorBody.code === "string" || typeof errorBody.code === "number") {
      code = errorBody.code;
    }
    if (typeof errorBody.field === "string") field = errorBody.field;
    if (errorBody.fieldErrors && typeof errorBody.fieldErrors === "object") {
      fieldErrors = Object.fromEntries(
        Object.entries(errorBody.fieldErrors).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      );
    }
  }

  return { message, field, code, fieldErrors };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET";
  const startedAt = Date.now();
  const requestId = createRequestId();
  const headers = new Headers(init?.headers);

  // FormData harus membiarkan browser menentukan Content-Type dan boundary.
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (isFormData) {
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // LBK-AUT-04: every state-changing request must carry the CSRF shield header.
  if (method.toUpperCase() !== "GET") {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }

  headers.set("X-Request-Id", requestId);

  const callerSignal = init?.signal;
  const controller = callerSignal == null ? new AbortController() : undefined;
  let timedOut = false;
  const timeout = controller
    ? setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, REQUEST_TIMEOUT_MS)
    : undefined;

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      headers,
      ...(controller ? { signal: controller.signal } : {}),
    });
  } catch (error) {
    if (timeout !== undefined) clearTimeout(timeout);
    if (callerSignal != null) throw error;

    if (timedOut) throw createTimeoutError(method, path, startedAt, requestId);
    const apiError = new ApiError(
      0,
      "Tidak dapat terhubung ke server. Periksa koneksi internet, lalu coba lagi.",
      {},
      { requestId, kind: "network" },
    );
    logFailure(method, path, 0, "network", undefined, Date.now() - startedAt, requestId, 0);
    throw apiError;
  }

  try {
    const responseRequestId = response.headers.get("X-Request-Id") || requestId;

    if (!response.ok) {
      if (
        response.status === 401 &&
        path !== "/api/auth/login" &&
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(new Event("logbook:unauthorized"));
      }

      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch (error) {
        if (timedOut) throw createTimeoutError(method, path, startedAt, responseRequestId);
        if (callerSignal != null && error instanceof Error && error.name === "AbortError") {
          throw error;
        }
        // Use the status-specific message when the error body is not JSON.
      }

      const details = readErrorDetails(errorBody);
      if (
        details.code === "PASSWORD_CHANGE_REQUIRED" &&
        path !== "/api/auth/change-password" &&
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(new Event("logbook:password-change-required"));
      }

      const kind = "http";
      logFailure(
        method,
        path,
        response.status,
        kind,
        details.code,
        Date.now() - startedAt,
        responseRequestId,
        Object.keys(details.fieldErrors).length,
      );

      throw new ApiError(
        response.status,
        details.message || defaultErrorMessage(response.status),
        details.fieldErrors,
        {
          code: details.code,
          field: details.field,
          requestId: responseRequestId,
          kind,
        },
      );
    }

    if (response.status === 204) {
      logger.debug("Permintaan API berhasil", {
        method,
        path: stripQuery(path),
        status: response.status,
        kind: "http",
        code: undefined,
        durationMs: Date.now() - startedAt,
        requestId: responseRequestId,
        fieldErrorCount: 0,
      });
      return undefined as T;
    }

    try {
      const result = (await response.json()) as T;
      logger.debug("Permintaan API berhasil", {
        method,
        path: stripQuery(path),
        status: response.status,
        kind: "http",
        code: undefined,
        durationMs: Date.now() - startedAt,
        requestId: responseRequestId,
        fieldErrorCount: 0,
      });
      return result;
    } catch (error) {
      if (timedOut) throw createTimeoutError(method, path, startedAt, responseRequestId);
      if (callerSignal != null && error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      const apiError = new ApiError(
        response.status,
        "Respons dari server tidak dapat dibaca. Silakan coba lagi.",
        {},
        { requestId: responseRequestId, kind: "parse" },
      );
      logFailure(
        method,
        path,
        response.status,
        "parse",
        undefined,
        Date.now() - startedAt,
        responseRequestId,
        0,
      );
      throw apiError;
    }
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
