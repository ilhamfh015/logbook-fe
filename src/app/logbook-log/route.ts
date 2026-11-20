import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { redactValue } from "@/lib/logRedaction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "fe.log");
const MAX_BODY_BYTES = 16 * 1024;
const MAX_FIELD_LENGTH = 500;
const CSRF_HEADER = "x-requested-with";
const CSRF_HEADER_VALUE = "XMLHttpRequest";
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const clientRequests = new Map<string, { windowStartedAt: number; count: number }>();

type LogLevel = "debug" | "info" | "warn" | "error";

function normalizeLevel(value: unknown): LogLevel {
  if (value === "debug" || value === "warn" || value === "error") return value;
  return "info";
}

export async function POST(request: Request) {
  // LBK-AUT-04: this is a non-GET endpoint, so require the CSRF shield header.
  const requestedWith = request.headers.get(CSRF_HEADER)?.trim();
  if (!requestedWith || requestedWith.toLowerCase() !== CSRF_HEADER_VALUE.toLowerCase()) {
    return errorResponse(403, "Permintaan tidak dapat diproses.");
  }

  const origin = request.headers.get("origin");
  if (origin && !isSameHost(origin, request.url)) {
    return errorResponse(403, "Permintaan tidak dapat diproses.");
  }

  if (!isWithinRateLimit(request)) {
    return errorResponse(429, "Terlalu banyak permintaan. Silakan coba lagi nanti.");
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse(413, "Ukuran data log melebihi batas.");
  }

  let payload: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return errorResponse(413, "Ukuran data log melebihi batas.");
    }
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return errorResponse(400, "Permintaan log tidak valid.");
  }

  if (!payload || typeof payload !== "object") {
    return errorResponse(400, "Permintaan log tidak valid.");
  }

  const body = payload as { event?: unknown; level?: unknown; context?: unknown; requestId?: unknown };
  const event = typeof body.event === "string" ? body.event.slice(0, MAX_FIELD_LENGTH) : "";
  if (!event) {
    return errorResponse(400, "Permintaan log tidak valid.");
  }

  const redactedContext = redactValue(body.context);
  const context = redactedContext && typeof redactedContext === "object" && !Array.isArray(redactedContext)
    ? redactedContext
    : {};
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level: normalizeLevel(body.level),
    event,
    ...(typeof body.requestId === "string" ? { requestId: body.requestId } : {}),
    context,
  });

  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(LOG_FILE, `${line}\n`, "utf8");
    return new Response(null, { status: 204 });
  } catch {
    return errorResponse(500, "Log tidak dapat disimpan.");
  }
}

function isSameHost(origin: string, requestUrl: string) {
  try {
    return new URL(origin).host.toLowerCase() === new URL(requestUrl).host.toLowerCase();
  } catch {
    return false;
  }
}

function isWithinRateLimit(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientKey = forwardedFor?.split(",", 1)[0]?.trim() || "lokal";
  const now = Date.now();
  const current = clientRequests.get(clientKey);

  if (!current || now - current.windowStartedAt >= RATE_WINDOW_MS) {
    clientRequests.set(clientKey, { windowStartedAt: now, count: 1 });
    return true;
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

function errorResponse(status: number, message: string) {
  return Response.json({ message }, { status });
}
