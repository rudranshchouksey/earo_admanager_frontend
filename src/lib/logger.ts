import * as Sentry from "@sentry/react";

type LogContext = Record<string, unknown>;

/**
 * App logger backed by Sentry Logs (linked to active traces).
 * Prefer this over console.* for operational diagnostics.
 */
export const logger = {
  debug(message: string, context?: LogContext) {
    Sentry.logger.debug(message, context);
  },
  info(message: string, context?: LogContext) {
    Sentry.logger.info(message, context);
  },
  warn(message: string, context?: LogContext) {
    Sentry.logger.warn(message, context);
  },
  error(message: string, context?: LogContext) {
    Sentry.logger.error(message, context);
  },
  captureException(error: unknown, context?: LogContext) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
    Sentry.logger.error(
      error instanceof Error ? error.message : String(error),
      context,
    );
  },
};
