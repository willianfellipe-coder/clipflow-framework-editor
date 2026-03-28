import pino from 'pino';

// PERF-007: Only use pretty-printing in development
const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino(
  isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : { level: 'info' },
);
