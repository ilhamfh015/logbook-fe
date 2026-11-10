type LogContext = Record<string, string | number | boolean | undefined>;

export const logger = {
  info(event: string, context?: LogContext) {
    console.info(`[LogBook] ${event}`, context ?? {});
  },

  error(scope: string, error: unknown, context?: LogContext) {
    console.error(`[LogBook] ${scope}`, { error, ...context });
  },
};
