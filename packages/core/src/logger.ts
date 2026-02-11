import pino from "pino";

// Simple logger without transport for Next.js compatibility
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // No transport - use default JSON output which works with webpack
});

export default logger;
