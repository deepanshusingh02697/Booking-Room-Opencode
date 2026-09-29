import { io, Socket } from 'socket.io-client';
import type { NotificationEventName, NotificationEventPayload } from './events';

let socket: Socket | null = null;
const statusListeners = new Set<(connected: boolean) => void>();

const emitStatus = (connected: boolean): void => {
  statusListeners.forEach((listener) => listener(connected));
};

/** The connection state changes outside React, so components subscribe to it. */
export const subscribeSocketStatus = (listener: (connected: boolean) => void): (() => void) => {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
};

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
    emitStatus(true);
  });

  socket.on('disconnect', (reason) => {
    console.debug('[socket] disconnected', reason);
    emitStatus(false);
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
  emitStatus(false);
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