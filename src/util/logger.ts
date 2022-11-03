import winston from 'winston';
import { inspect } from 'util';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
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
})