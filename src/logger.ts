import { createLogger, format, transports } from "winston";

const winstonLogger = createLogger?.({
  level: process.env.FLAYER_LOG_LEVEL ?? "info",
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});

/**
 * Explicit logger object for maintaining browser compatibility.
 * Uses Winston if found, otherwise uses console.
 */
export const logger = {
  debug: winstonLogger?.debug ?? console.log,
  info: winstonLogger?.info ?? console.log,
  warn: winstonLogger?.warn ?? console.log,
  error: winstonLogger?.error ?? console.error,
};
