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

describe("logger thresholds and payload safety", () => {
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
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  async function loadLogger() {
    vi.resetModules();
    return (await import("@/lib/logger")).logger;
  }

  function payloadAt(index: number) {
    return JSON.parse(fetchMock.mock.calls[index][1]?.body as string) as {
      context: Record<string, unknown>;
      requestId?: string;
    };
  }

  it("applies NEXT_PUBLIC_LOG_LEVEL to transport and console thresholds", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOG_LEVEL", "warn");
    const consoleDebug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const logger = await loadLogger();

    logger.debug("below-debug");
    logger.info("below-info");
    logger.warn("at-warn");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(consoleDebug).not.toHaveBeenCalled();
    expect(consoleInfo).not.toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalledTimes(1);
  });

  it("uses default thresholds when NEXT_PUBLIC_LOG_LEVEL is invalid", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOG_LEVEL", "verbose");
    const consoleDebug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
    const logger = await loadLogger();

    logger.debug("default-debug");
    logger.info("default-info");

    expect(consoleDebug).toHaveBeenCalledTimes(1);
    expect(consoleInfo).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips the 31st send in a minute and recovers after the window", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOG_LEVEL", "info");
    const logger = await loadLogger();

    for (let index = 0; index < 31; index += 1) {
      expect(() => logger.info(`rate-${index}`)).not.toThrow();
    }
    expect(fetchMock).toHaveBeenCalledTimes(30);

    vi.advanceTimersByTime(60_000);
    logger.info("after-window");
    expect(fetchMock).toHaveBeenCalledTimes(31);
  });

  it("redacts context before writing to console and transport", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOG_LEVEL", "info");
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
    const logger = await loadLogger();

    logger.info("redaction-check", {
      password: "secret-value",
      contact: "rani@contoh.id",
    });

    const context = payloadAt(0).context;
    expect(context).toEqual({
      password: "[disembunyikan]",
      contact: "r***@contoh.id",
    });
    expect(consoleInfo.mock.calls[0][1]).toEqual(context);
  });

  it("copies context.requestId to the top-level payload field", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOG_LEVEL", "info");
    const logger = await loadLogger();

    logger.info("request-id", { requestId: "request-123" });

    expect(payloadAt(0)).toMatchObject({
      requestId: "request-123",
      context: { requestId: "request-123" },
    });
  });

  it("truncates error stacks to 1,000 characters and includes the error name and message", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOG_LEVEL", "error");
    const logger = await loadLogger();
    const error = new Error("failure message");
    error.stack = "s".repeat(1_500);

    logger.error("failure-scope", error);

    expect(payloadAt(0).context).toMatchObject({
      errorName: "Error",
      errorMessage: "failure message",
      errorStack: "s".repeat(1_000),
    });
  });

  it("writes debug events through console.debug", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOG_LEVEL", "debug");
    const consoleDebug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const logger = await loadLogger();

    logger.debug("debug-event");

    expect(consoleDebug).toHaveBeenCalledWith("[LogBook] debug-event", {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});