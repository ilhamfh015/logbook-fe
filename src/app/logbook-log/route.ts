import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "fe.log");
const MAX_BODY_BYTES = 16 * 1024;
const MAX_FIELD_LENGTH = 500;

type LogLevel = "debug" | "info" | "warn" | "error";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return new Response(null, { status: 400 });
  }

  const body = payload as { event?: unknown; level?: unknown; context?: unknown };
  const event = typeof body.event === "string" ? body.event.slice(0, MAX_FIELD_LENGTH) : "";
  if (!event) {
    return new Response(null, { status: 400 });
  }

  const line = JSON.stringify({
    time: new Date().toISOString(),
    level: normalizeLevel(body.level),
    event,
    context: sanitizeContext(body.context),
  });

  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(LOG_FILE, `${line}\n`, "utf8");
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 500 });
  }
}

function normalizeLevel(value: unknown): LogLevel {
  if (value === "debug" || value === "warn" || value === "error") return value;
  return "info";
}

function sanitizeContext(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const context: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item === null || typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
      context[key.slice(0, 80)] = typeof item === "string" ? item.slice(0, MAX_FIELD_LENGTH) : item;
    }
  }
  return context;
}
