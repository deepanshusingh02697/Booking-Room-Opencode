import { io, Socket } from 'socket.io-client';
import type { NotificationEventName, NotificationEventPayload } from './events';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const initSocket = (): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io('/', {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.debug('[socket] connected', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.debug('[socket] disconnected', reason);
  });

  socket.on('connect_error', (error) => {
    console.warn('[socket] connect_error', error.message);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

type NotificationHandler = (payload: NotificationEventPayload) => void;

export const onNotification = (
  event: NotificationEventName,
  handler: NotificationHandler,
): (() => void) => {
  const s = getSocket();
  if (!s) {
    return () => {};
  }
  s.on(event, handler);
  return () => s.off(event, handler);
};

export const offNotification = (
  event: NotificationEventName,
  handler?: NotificationHandler,
): void => {
  const s = getSocket();
  if (!s) {
    return;
  }
  if (handler) {
    s.off(event, handler);
  } else {
    s.off(event);
  }
};