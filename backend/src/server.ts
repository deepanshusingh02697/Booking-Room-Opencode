import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import type { GraphQLFormattedError } from 'graphql';
import { env } from './config/env';
import { AppDataSource } from './config/data-source';
import { createSchema } from './schema';
import { buildContext, AppContext } from './common/context';
import { logger } from './common/logger';
import { startJobs, stopJobs } from './jobs/registry';
import { closeSocketServer, initSocketServer } from './realtime/socket';

interface ValidationFailure {
  property: string;
  constraints?: Record<string, string>;
}

const formatError = (error: GraphQLFormattedError): GraphQLFormattedError => {
  const validationErrors = error.extensions?.validationErrors as
    | ValidationFailure[]
    | undefined;

  if (validationErrors) {
    const messages = validationErrors.flatMap((failure) =>
      Object.values(failure.constraints ?? {}),
    );
    return {
      ...error,
      message:
        messages.length > 0
          ? messages.join(' ')
          : 'One or more fields are invalid.',
      extensions: {
        ...error.extensions,
        validationErrors: validationErrors.map((failure) => ({
          property: failure.property,
          constraints: failure.constraints,
        })),
      },
    };
  }

  return error;
};

const startServer = async () => {
  await AppDataSource.initialize();
  logger.info('Database connected');

  const app = express();
  const schema = await createSchema();
  const apollo = new ApolloServer({ schema, formatError });

  await apollo.start();

  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(
    '/graphql',
    expressMiddleware(apollo, {
      context: async ({ req, res }): Promise<AppContext> => buildContext({ req, res }),
    }),
  );

  const server = http.createServer(app);
  initSocketServer(server);

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    stopJobs();
    await apollo.stop();
    await closeSocketServer();
    logger.info('Server closed');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  startJobs();

  server.listen(env.PORT, () => {
    logger.info(`API ready at http://localhost:${env.PORT}/graphql`);
    logger.info(`Health check at http://localhost:${env.PORT}/health`);
    logger.info(`Socket.IO endpoint at http://localhost:${env.PORT}/socket.io`);
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});