import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";
import { ApiError, apiFetch } from "@/services/apiClient";

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const debugLog = vi.mocked(logger.debug);
const warnLog = vi.mocked(logger.warn);
const errorLog = vi.mocked(logger.error);
let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

function mockResponse(
  status: number,
  body?: unknown,
  headers: Record<string, string> = {},
): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function contextFor(level: "debug" | "warn" | "error") {
  const calls = level === "debug"
    ? debugLog.mock.calls
    : level === "warn"
      ? warnLog.mock.calls
      : errorLog.mock.calls;
  const call = calls.at(-1);
  return level === "error" ? call?.[2] : call?.[1];
}

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("apiFetch interceptor", () => {
  it("sends an eight-character request ID and uses the response ID", async () => {
    fetchMock.mockResolvedValue(mockResponse(400, {
      message: "Tidak valid",
      code: "INVALID_INPUT",
    }, { "X-Request-Id": "backend-123" }));

    let caught: unknown;
    try {
      await apiFetch("/api/tasks?date=today");
    } catch (error) {
      caught = error;
    }

    const requestHeaders = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(requestHeaders.get("X-Request-Id")).toMatch(/^[a-f0-9]{8}$/);
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).requestId).toBe("backend-123");
    expect(contextFor("warn")).toMatchObject({
      requestId: "backend-123",
      path: "/api/tasks",
    });
  });

  it("maps backend validation metadata without changing legacy fields", async () => {
    fetchMock.mockResolvedValue(mockResponse(422, {
      code: "VALIDATION_ERROR",
      field: "summary",
      message: "Ringkasan perlu diperiksa.",
      fieldErrors: { summary: "Teks belum sesuai.", invalid: 3 },
    }));

    await expect(apiFetch("/api/tasks")).rejects.toMatchObject({
      status: 422,
      kind: "http",
      code: "VALIDATION_ERROR",
      field: "summary",
      message: "Ringkasan perlu diperiksa.",
      fieldErrors: { summary: "Teks belum sesuai." },
    });
    expect(contextFor("warn")).toMatchObject({ fieldErrorCount: 1, code: "VALIDATION_ERROR" });
  });

  it.each([
    [400, "Permintaan tidak valid."],
    [401, "Sesi berakhir. Silakan masuk kembali."],
    [403, "Kamu tidak memiliki akses untuk tindakan ini."],
    [404, "Data tidak ditemukan."],
    [409, "Data berubah atau bentrok. Muat ulang lalu coba lagi."],
    [500, "Terjadi kesalahan pada server. Silakan coba lagi nanti."],
    [418, "Terjadi kesalahan. Silakan coba lagi."],
  ])("uses the Indonesian default for status %i", async (status, message) => {
    fetchMock.mockResolvedValue(mockResponse(status));
    await expect(apiFetch("/api/data")).rejects.toMatchObject({ status, message });
  });

  it("turns fetch failures into a network ApiError and logs without request data", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    await expect(apiFetch("/api/tasks?secret=query", {
      method: "POST",
      body: JSON.stringify({ password: "private-value" }),
    })).rejects.toMatchObject({
      status: 0,
      kind: "network",
      message: "Tidak dapat terhubung ke server. Periksa koneksi internet, lalu coba lagi.",
    });

    expect(contextFor("error")).toMatchObject({
      method: "POST",
      path: "/api/tasks",
      status: 0,
      kind: "network",
      fieldErrorCount: 0,
    });
    expect(JSON.stringify({ debugLog: debugLog.mock.calls, warnLog: warnLog.mock.calls, errorLog: errorLog.mock.calls }))
      .not.toContain("private-value");
  });

  it("turns its own 30-second abort into a timeout ApiError", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));

    const pending = apiFetch("/api/slow");
    const timeoutAssertion = expect(pending).rejects.toMatchObject({
      status: 0,
      kind: "timeout",
      message: "Server terlalu lama merespons. Silakan coba lagi.",
    });
    await vi.advanceTimersByTimeAsync(30_000);
    await timeoutAssertion;
    expect(errorLog).toHaveBeenCalledTimes(1);
  });

  it("keeps the timeout active while reading the response body", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation((_input, init) => Promise.resolve({
      status: 200,
      ok: true,
      headers: new Headers({ "X-Request-Id": "body-request-id" }),
      json: () => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }),
    } as Response));

    const pending = apiFetch("/api/slow-body");
    const timeoutAssertion = expect(pending).rejects.toMatchObject({
      status: 0,
      kind: "timeout",
      requestId: "body-request-id",
    });
    await vi.advanceTimersByTimeAsync(30_000);
    await timeoutAssertion;
    expect(errorLog).toHaveBeenCalledTimes(1);
  });

  it("preserves a caller-provided abort error without adding a timeout", async () => {
    const controller = new AbortController();
    const abortError = new DOMException("Canceled", "AbortError");
    fetchMock.mockRejectedValue(abortError);

    await expect(apiFetch("/api/data", { signal: controller.signal })).rejects.toBe(abortError);
    expect(errorLog).not.toHaveBeenCalled();
  });

  it("reports a successful non-JSON response as a parse error", async () => {
    const invalidJson = mockResponse(200);
    vi.mocked(invalidJson.json).mockRejectedValue(new SyntaxError("invalid json"));
    fetchMock.mockResolvedValue(invalidJson);

    await expect(apiFetch("/api/data")).rejects.toMatchObject({
      status: 200,
      kind: "parse",
      message: "Respons dari server tidak dapat dibaca. Silakan coba lagi.",
    });
    expect(errorLog).toHaveBeenCalledTimes(1);
  });

  it("returns undefined for 204 and records success at debug level", async () => {
    fetchMock.mockResolvedValue(mockResponse(204));

    await expect(apiFetch<void>("/api/data")).resolves.toBeUndefined();
    expect(debugLog).toHaveBeenCalledTimes(1);
    expect(warnLog).not.toHaveBeenCalled();
    expect(errorLog).not.toHaveBeenCalled();
  });

  it("dispatches unauthorized except for the login endpoint", async () => {
    const unauthorized = vi.fn();
    window.addEventListener("logbook:unauthorized", unauthorized);
    fetchMock.mockResolvedValueOnce(mockResponse(401)).mockResolvedValueOnce(mockResponse(401));

    await expect(apiFetch("/api/auth/me")).rejects.toBeInstanceOf(ApiError);
    await expect(apiFetch("/api/auth/login", { method: "POST" })).rejects.toBeInstanceOf(ApiError);

    expect(unauthorized).toHaveBeenCalledTimes(1);
    window.removeEventListener("logbook:unauthorized", unauthorized);
  });

  it("logs 401 for auth/me at debug and login at warn", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(401)).mockResolvedValueOnce(mockResponse(401));

    await expect(apiFetch("/api/auth/me?from=header")).rejects.toBeInstanceOf(ApiError);
    await expect(apiFetch("/api/auth/login")).rejects.toBeInstanceOf(ApiError);

    expect(debugLog).toHaveBeenCalledTimes(1);
    expect(warnLog).toHaveBeenCalledTimes(1);
    expect(contextFor("debug")).toMatchObject({ path: "/api/auth/me", status: 401 });
    expect(contextFor("warn")).toMatchObject({ path: "/api/auth/login", status: 401 });
  });

  it("logs 404 at debug, other 4xx at warn, and 5xx at error", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(404));
    fetchMock.mockResolvedValueOnce(mockResponse(403));
    fetchMock.mockResolvedValueOnce(mockResponse(503));

    await expect(apiFetch("/api/missing")).rejects.toBeInstanceOf(ApiError);
    await expect(apiFetch("/api/denied")).rejects.toBeInstanceOf(ApiError);
    await expect(apiFetch("/api/unavailable")).rejects.toBeInstanceOf(ApiError);

    expect(debugLog).toHaveBeenCalledTimes(1);
    expect(warnLog).toHaveBeenCalledTimes(1);
    expect(errorLog).toHaveBeenCalledTimes(1);
  });

  it("uses the default 5xx message when the backend message is empty", async () => {
    fetchMock.mockResolvedValue(mockResponse(503, { message: "   ", error: "" }));

    await expect(apiFetch("/api/unavailable")).rejects.toMatchObject({
      status: 503,
      kind: "http",
      message: "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
    });
    expect(errorLog).toHaveBeenCalledTimes(1);
  });

  it("never includes the response body in failure logs", async () => {
    fetchMock.mockResolvedValue(mockResponse(400, {
      message: "Permintaan tidak valid.",
      body: "private response payload",
      details: "backend-only response detail",
    }));

    await expect(apiFetch("/api/data")).rejects.toBeInstanceOf(ApiError);

    const allLogs = JSON.stringify({
      debug: debugLog.mock.calls,
      warn: warnLog.mock.calls,
      error: errorLog.mock.calls,
    });
    expect(allLogs).not.toContain("private response payload");
    expect(allLogs).not.toContain("backend-only response detail");
  });
});