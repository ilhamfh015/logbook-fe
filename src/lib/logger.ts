import { redactValue, stripQuery } from "@/lib/logRedaction";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, string | number | boolean | null | undefined>;

const LOG_ENDPOINT = "/logbook-log";
const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const DUPLICATE_WINDOW_MS = 5_000;
const RATE_WINDOW_MS = 60_000;
const DUPLICATE_STATE_TTL_MS = 60_000;
const MAX_SENDS_PER_WINDOW = 30;
const duplicateStates = new Map<string, { lastSentAt: number; suppressed: number }>();
const sendTimes: number[] = [];

type LogPayload = {
  level: LogLevel;
  event: string;
  context: Record<string, unknown>;
  requestId?: string;
};

function configuredLevel(): LogLevel | undefined {
  const value = process.env.NEXT_PUBLIC_LOG_LEVEL;
  return value === "debug" || value === "info" || value === "warn" || value === "error"
    ? value
    : undefined;
}

function consoleThreshold(): LogLevel {
  return configuredLevel() ?? (process.env.NODE_ENV === "production" ? "info" : "debug");
}

function transportThreshold(): LogLevel {
  return configuredLevel() ?? "info";
}

function formatLog(level: LogLevel, event: string, context: LogContext): LogPayload {
  const requestId = typeof context.requestId === "string" ? context.requestId : undefined;
  const contextToRedact: Record<string, unknown> = { ...context };
  if (typeof contextToRedact.path === "string") {
    contextToRedact.path = stripQuery(contextToRedact.path);
  }

  const redacted = redactValue(contextToRedact);
  const safeContext = redacted && typeof redacted === "object" && !Array.isArray(redacted)
    ? redacted as Record<string, unknown>
    : {};

  return {
    level,
    event,
    context: safeContext,
    ...(requestId === undefined ? {} : { requestId }),
  };
}

function transport(payload: LogPayload) {
  try {
    void fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Kegagalan transport tidak boleh memengaruhi alur aplikasi.
  }
}

function isDuplicate(payload: LogPayload, now: number) {
  for (const [key, state] of duplicateStates) {
    if (now - state.lastSentAt > DUPLICATE_STATE_TTL_MS) duplicateStates.delete(key);
  }

  const errorMessage = typeof payload.context.errorMessage === "string"
    ? payload.context.errorMessage
    : "";
  const path = typeof payload.context.path === "string" ? stripQuery(payload.context.path) : "";
  const method = payload.context.method ?? "";
  const status = payload.context.status ?? "";
  const key = JSON.stringify([payload.level, payload.event, errorMessage, path, method, status]);
  const state = duplicateStates.get(key);
  if (state && now - state.lastSentAt < DUPLICATE_WINDOW_MS) {
    state.suppressed += 1;
    return { key, suppressed: 0, duplicate: true };
  }
  return { key, suppressed: state?.suppressed ?? 0, duplicate: false };
}

function canSend(now: number) {
  while (sendTimes.length > 0 && now - sendTimes[0] >= RATE_WINDOW_MS) sendTimes.shift();
  return sendTimes.length < MAX_SENDS_PER_WINDOW;
}

/**
 * Mencatat kejadian ke console dan ke logs/fe.log (lewat route handler).
 * Pengiriman log tidak boleh mengganggu alur UI, jadi kegagalannya diabaikan.
 */
function emit(level: LogLevel, event: string, context: LogContext = {}) {
  const payload = formatLog(level, event, context);
  const label = `[LogBook] ${event}`;
  if (LEVEL_ORDER[level] >= LEVEL_ORDER[consoleThreshold()]) {
    if (level === "debug") console.debug(label, payload.context);
    else if (level === "error") console.error(label, payload.context);
    else if (level === "warn") console.warn(label, payload.context);
    else console.info(label, payload.context);
  }

  if (typeof window === "undefined" || LEVEL_ORDER[level] < LEVEL_ORDER[transportThreshold()]) return;

  const now = Date.now();
  const duplicate = isDuplicate(payload, now);
  if (duplicate.duplicate || !canSend(now)) return;

  const contextWithSuppression = { ...payload.context };
  if (duplicate.suppressed > 0) contextWithSuppression.suppressed = duplicate.suppressed;
  transport({ ...payload, context: contextWithSuppression });
  sendTimes.push(now);
  duplicateStates.set(duplicate.key, { lastSentAt: now, suppressed: 0 });
}

function serializeError(error: unknown): LogContext {
  if (!(error instanceof Error)) {
    return { errorMessage: String(error) };
  }

  const context: LogContext = {
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack?.slice(0, 1000),
  };

  const details = error as { status?: unknown; fieldErrors?: unknown };
  if (typeof details.status === "number") context.status = details.status;
  if (details.fieldErrors && typeof details.fieldErrors === "object") {
    try {
      context.fieldErrors = JSON.stringify(redactValue(details.fieldErrors)).slice(0, 1000);
    } catch {
      context.fieldErrors = "[tidak dapat dibaca]";
    }
  }
  return context;
}

export const logger = {
  debug(event: string, context?: LogContext) {
    emit("debug", event, context);
  },

  info(event: string, context?: LogContext) {
    emit("info", event, context);
  },

  warn(event: string, context?: LogContext) {
    emit("warn", event, context);
  },

  error(scope: string, error: unknown, context?: LogContext) {
    emit("error", scope, { ...context, ...serializeError(error) });
  },
};
