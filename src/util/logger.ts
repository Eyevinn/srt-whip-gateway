import winston from 'winston';
import { inspect } from 'util';

// Support LOG_LEVEL environment variable, default to 'info' in production and 'debug' in development
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.printf((logData) => {
    const now = new Date();
    if (typeof logData.message === 'string') {
      return `[${now.toISOString()}]: ${logData.level.toUpperCase()} [srt-whip-gw] ${logData.message}`;
    } else {
      return `[${now.toISOString()}]: ${logData.level.toUpperCase()} [srt-whip-gw]: ` + inspect(logData.message);
    }
  }),
  transports: []
    .concat(!process.env.NO_CONSOLE_LOG ? new winston.transports.Console() : []),
});

logger.info(`Logger initialized with level: ${logLevel}`);