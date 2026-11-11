type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, string | number | boolean | null | undefined>;

const LOG_ENDPOINT = "/logbook-log";

/**
 * Mencatat kejadian ke console dan ke logs/fe.log (lewat route handler).
 * Pengiriman log tidak boleh mengganggu alur UI, jadi kegagalannya diabaikan.
 */
function emit(level: LogLevel, event: string, context: LogContext = {}) {
  const label = `[LogBook] ${event}`;
  if (level === "error") console.error(label, context);
  else if (level === "warn") console.warn(label, context);
  else console.info(label, context);

  if (typeof window === "undefined") return;

  try {
    void fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, event, context }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Abaikan kegagalan logging agar tidak memengaruhi UI.
  }
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
    context.fieldErrors = JSON.stringify(details.fieldErrors).slice(0, 1000);
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
