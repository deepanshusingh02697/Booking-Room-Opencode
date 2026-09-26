import type { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { AuthUser, userFromCookieHeader } from '../common/context';
import { logger } from '../common/logger';
import { NotificationEventName, NotificationEventPayload } from './events';

type AuthenticatedSocket = Socket & { data: { user?: AuthUser } };

/**
 * Single Socket.io instance for the process.
 *
 * `NotificationService` is constructed as a property initializer deep inside the
 * bookings/checkin/waitlist services, so threading the server through constructors
 * would mean re-plumbing every resolver (and re-introducing the cross-service
 * construction cycle documented in doc/project-state.md §8.17). The instance is
 * therefore owned here and reached through `emitToUser`, which degrades to a
 * warning when the socket server has not been initialised.
 */
let io: Server | null = null;

const userRoom = (employeeId: number): string => `user:${employeeId}`;

export const initSocketServer = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const user = userFromCookieHeader(socket.handshake.headers.cookie);
    if (!user) {
      logger.warn(
        `Socket handshake rejected: no valid session cookie on ${socket.handshake.address}.`,
      );
      next(new Error('Unauthorized'));
      return;
    }

    (socket as AuthenticatedSocket).data.user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user = (socket as AuthenticatedSocket).data.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    void socket.join(userRoom(user.id));
    logger.info(
      `Socket connected: employee ${user.id} (${user.role}) joined room ${userRoom(user.id)}.`,
    );

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: employee ${user.id} (${reason}).`);
    });
  });

  logger.info(
    `Socket.io ready for origin ${env.FRONTEND_ORIGIN} on port ${env.PORT}`,
  );

  return io;
};

export const emitToUser = (
  employeeId: number,
  event: NotificationEventName,
  payload: NotificationEventPayload,
): void => {
  if (!io) {
    logger.warn(
      `Socket event ${event} for employee ${employeeId} dropped: socket server is not initialised.`,
    );
    return;
  }

  io.to(userRoom(employeeId)).emit(event, payload);
};

export const closeSocketServer = async (): Promise<void> => {
  if (!io) {
    return;
  }

  const server = io;
  io = null;
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
};
