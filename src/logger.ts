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
  debug: winstonLogger?.debug.bind(winstonLogger) ?? console.log,
  info: winstonLogger?.info.bind(winstonLogger) ?? console.log,
  warn: winstonLogger?.warn.bind(winstonLogger) ?? console.log,
  error: winstonLogger?.error.bind(winstonLogger) ?? console.error,
};
