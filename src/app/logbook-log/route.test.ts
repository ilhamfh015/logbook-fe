// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fsMocks = vi.hoisted(() => ({
  appendFile: vi.fn(),
  mkdir: vi.fn(),
}));

vi.mock("node:fs/promises", () => fsMocks);

import { appendFile, mkdir } from "node:fs/promises";

const appendFileMock = vi.mocked(appendFile);
const mkdirMock = vi.mocked(mkdir);

describe("logbook-log route", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-17T12:00:00.000Z"));
    vi.clearAllMocks();
    mkdirMock.mockResolvedValue(undefined);
    appendFileMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function loadPost() {
    vi.resetModules();
    return (await import("@/app/logbook-log/route")).POST;
  }

  function request(payload: unknown, headers: Record<string, string> = {}) {
    return new Request("https://example.test/logbook-log", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });
  }

  it("writes valid redacted payload as one JSON line and normalizes its level", async () => {
    const POST = await loadPost();
    const response = await POST(request({
      level: "trace",
      event: "task.failed",
      requestId: "request-123",
      context: {
        password: "secret-value",
        email: "rani@contoh.id",
      },
    }));

    expect(response.status).toBe(204);
    expect(appendFileMock).toHaveBeenCalledTimes(1);
    const line = appendFileMock.mock.calls[0][1] as string;
    expect(line.match(/\n/g)).toHaveLength(1);
    expect(JSON.parse(line)).toMatchObject({
      level: "info",
      event: "task.failed",
      requestId: "request-123",
      context: {
        password: "[disembunyikan]",
        email: "r***@contoh.id",
      },
    });
  });

  it("rejects request bodies larger than 16 KiB", async () => {
    const POST = await loadPost();
    const response = await POST(new Request("https://example.test/logbook-log", {
      method: "POST",
      body: "x".repeat(16 * 1024 + 1),
    }));

    expect(response.status).toBe(413);
    expect(appendFileMock).not.toHaveBeenCalled();
  });

  it("returns 429 after 60 requests per minute and resets at the next window", async () => {
    const POST = await loadPost();
    const send = () => POST(request(
      { level: "info", event: "rate-limit" },
      { "x-forwarded-for": "rate-client" },
    ));

    for (let index = 0; index < 60; index += 1) {
      expect((await send()).status).toBe(204);
    }
    expect((await send()).status).toBe(429);

    vi.advanceTimersByTime(60_000);
    expect((await send()).status).toBe(204);
  });

  it("rejects a foreign Origin and accepts an Origin with the request host", async () => {
    const POST = await loadPost();
    const foreign = await POST(request(
      { level: "info", event: "foreign-origin" },
      { origin: "https://attacker.test" },
    ));
    const sameHost = await POST(request(
      { level: "info", event: "same-origin" },
      { origin: "https://example.test" },
    ));

    expect(foreign.status).toBe(403);
    expect(sameHost.status).toBe(204);
  });

  it("returns a neutral Indonesian error when writing the log fails", async () => {
    appendFileMock.mockRejectedValueOnce(new Error("disk details"));
    const POST = await loadPost();

    const response = await POST(request({ level: "info", event: "write-failure" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: "Log tidak dapat disimpan." });
  });
});