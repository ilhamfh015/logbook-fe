import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("logger duplicate suppression", () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-17T12:00:00.000Z"));
    fetchMock = vi.fn<typeof fetch>().mockResolvedValue({} as Response);
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function loadLogger() {
    vi.resetModules();
    return (await import("@/lib/logger")).logger;
  }

  function payloadAt(index: number) {
    return JSON.parse(fetchMock.mock.calls[index][1]?.body as string) as {
      context: Record<string, unknown>;
    };
  }

  it("sends once for a duplicate key and includes its suppressed count next time", async () => {
    const logger = await loadLogger();

    logger.info("Permintaan API gagal", {
      errorMessage: "Network error",
      path: "/api/auth/me?source=header",
      method: "GET",
      status: 500,
    });
    vi.advanceTimersByTime(1_000);
    logger.info("Permintaan API gagal", {
      errorMessage: "Network error",
      path: "/api/auth/me?source=menu",
      method: "GET",
      status: 500,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(4_000);
    logger.info("Permintaan API gagal", {
      errorMessage: "Network error",
      path: "/api/auth/me",
      method: "GET",
      status: 500,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(payloadAt(1).context.suppressed).toBe(1);
  });

  it("sends same-event errors for different paths", async () => {
    const logger = await loadLogger();

    logger.info("Permintaan API gagal", {
      errorMessage: "Network error",
      path: "/api/auth/me",
      method: "GET",
      status: 500,
    });
    logger.info("Permintaan API gagal", {
      errorMessage: "Network error",
      path: "/api/auth/login",
      method: "GET",
      status: 500,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("sends the same key again after five seconds", async () => {
    const logger = await loadLogger();
    const context = {
      errorMessage: "Network error",
      path: "/api/auth/me",
      method: "GET",
      status: 500,
    };

    logger.info("Permintaan API gagal", context);
    vi.advanceTimersByTime(5_000);
    logger.info("Permintaan API gagal", context);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("ignores fetch failures without throwing or logging again", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const logger = await loadLogger();

    expect(() => logger.info("Permintaan API gagal", { path: "/api/auth/me" })).not.toThrow();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});