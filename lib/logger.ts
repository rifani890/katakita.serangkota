/**
 * Conditional logger that only outputs in development.
 * In production, sensitive error details are suppressed.
 */

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  error(...args: unknown[]) {
    if (isDev) {
      console.error(...args);
    }
    // In production: silently swallow or send to external logging service
  },

  warn(...args: unknown[]) {
    if (isDev) {
      console.warn(...args);
    }
  },

  info(...args: unknown[]) {
    if (isDev) {
      console.info(...args);
    }
  },

  debug(...args: unknown[]) {
    if (isDev) {
      console.debug(...args);
    }
  },
};
