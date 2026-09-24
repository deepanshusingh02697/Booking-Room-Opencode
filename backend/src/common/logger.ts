import { env } from '../config/env';

type Level = 'debug' | 'info' | 'warn' | 'error';

const toTimestamp = () => new Date().toISOString();

const log = (level: Level, message: string, meta?: unknown) => {
  const line = meta
    ? `[${toTimestamp()}] ${level.toUpperCase()} ${message} ${JSON.stringify(meta)}`
    : `[${toTimestamp()}] ${level.toUpperCase()} ${message}`;

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else if (level === 'debug' && env.NODE_ENV !== 'production') {
    console.debug(line);
  } else {
    console.log(line);
  }
};

export const logger = {
  debug: (message: string, meta?: unknown) => log('debug', message, meta),
  info: (message: string, meta?: unknown) => log('info', message, meta),
  warn: (message: string, meta?: unknown) => log('warn', message, meta),
  error: (message: string, meta?: unknown) => log('error', message, meta),
};