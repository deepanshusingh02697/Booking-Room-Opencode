import { useState, useEffect, useCallback, useRef } from 'react';
import { useApolloClient } from '@apollo/client';
import { MY_MEETINGS_QUERY } from '../graphql/queries/bookings';
import { MY_BOOKINGS_QUERY } from '../graphql/queries/bookings';
import { MY_WAITLIST_QUERY } from '../graphql/queries/waitlist';
import { BOOKING_DETAILS_QUERY } from '../graphql/queries/bookings';
import { onNotification, offNotification, getSocket } from './socket';
import type { NotificationEventPayload, NotificationEventName } from './events';

const STORAGE_KEY = 'mri:notifications';
const MAX_NOTIFICATIONS = 50;

export interface Notification {
  id: string;
  type: NotificationEventName;
  bookingId: number;
  title: string;
  roomName: string;
  startTime: string;
  endTime: string;
  organizerName: string;
  message: string;
  timestamp: number;
  read: boolean;
  waitlistStartTime?: string;
  waitlistEndTime?: string;
  checkedInByName?: string;
}

const composeMessage = (payload: NotificationEventPayload): string => {
  const { type, title, roomName, organizerName, checkedInByName, waitlistStartTime, waitlistEndTime } = payload;
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  switch (type) {
    case 'notification:BOOKING_CREATED':
      return `You were invited to "${title}" in ${roomName} by ${organizerName} on ${formatTime(payload.startTime)}`;
    case 'notification:PARTICIPANT_ADDED':
      return `You were added to "${title}" in ${roomName} by ${organizerName} on ${formatTime(payload.startTime)}`;
    case 'notification:PARTICIPANT_REMOVED':
      return `You were removed from "${title}" in ${roomName} by ${organizerName}`;
    case 'notification:CHECK_IN':
      return `${checkedInByName} checked in to "${title}" in ${roomName}`;
    case 'notification:WAITLIST_CONVERTED': {
      const waitlistStart = waitlistStartTime ? formatTime(waitlistStartTime) : 'the waitlisted time';
      const waitlistEnd = waitlistEndTime ? formatTime(waitlistEndTime) : '';
      const waitlistRange = waitlistEnd ? `${waitlistStart} – ${waitlistEnd}` : waitlistStart;
      return `Your waitlist entry for ${waitlistRange} was converted to a booking: "${title}" in ${roomName} on ${formatTime(payload.startTime)}`;
    }
    default:
      return `Notification about "${title}" in ${roomName}`;
  }
};

const loadFromStorage = (): Notification[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as Notification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveToStorage = (notifications: Notification[]): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
  }
};

const clearStorage = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
  }
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromStorage());
  const [unreadCount, setUnreadCount] = useState(() =>
    loadFromStorage().filter((n) => !n.read).length
  );
  const client = useApolloClient();
  type NotificationHandler = (payload: NotificationEventPayload) => void;
  const handlersRef = useRef<Map<NotificationEventName, NotificationHandler>>(new Map());

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setNotifications(loadFromStorage());
    setUnreadCount(loadFromStorage().filter((n) => !n.read).length);
  }, []);

  const addNotification = useCallback((payload: NotificationEventPayload) => {
    const message = composeMessage(payload);
    const notification: Notification = {
      id: `${payload.type}-${payload.bookingId}-${Date.now()}`,
      type: payload.type,
      bookingId: payload.bookingId,
      title: payload.title,
      roomName: payload.roomName,
      startTime: payload.startTime,
      endTime: payload.endTime,
      organizerName: payload.organizerName,
      message,
      timestamp: Date.now(),
      read: false,
      waitlistStartTime: payload.waitlistStartTime,
      waitlistEndTime: payload.waitlistEndTime,
      checkedInByName: payload.checkedInByName,
    };

    setNotifications((prev) => {
      const next = [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveToStorage(next);
      return next;
    });
    setUnreadCount((c) => c + 1);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveToStorage(next);
      return next;
    });
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      saveToStorage(next);
      return next;
    });
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    clearStorage();
  }, []);

  const handleBookingCreated = useCallback(
    (payload: NotificationEventPayload) => {
      addNotification(payload);
      client.refetchQueries({ include: [MY_MEETINGS_QUERY] });
    },
    [addNotification, client]
  );

  const handleParticipantAdded = useCallback(
    (payload: NotificationEventPayload) => {
      addNotification(payload);
      client.refetchQueries({ include: [MY_MEETINGS_QUERY] });
      client.refetchQueries({ include: [BOOKING_DETAILS_QUERY] });
    },
    [addNotification, client]
  );

  const handleParticipantRemoved = useCallback(
    (payload: NotificationEventPayload) => {
      addNotification(payload);
      client.refetchQueries({ include: [MY_MEETINGS_QUERY] });
      client.refetchQueries({ include: [BOOKING_DETAILS_QUERY] });
    },
    [addNotification, client]
  );

  const handleCheckIn = useCallback(
    (payload: NotificationEventPayload) => {
      addNotification(payload);
      client.refetchQueries({ include: [BOOKING_DETAILS_QUERY] });
    },
    [addNotification, client]
  );

  const handleWaitlistConverted = useCallback(
    (payload: NotificationEventPayload) => {
      addNotification(payload);
      client.refetchQueries({ include: [MY_BOOKINGS_QUERY] });
      client.refetchQueries({ include: [MY_WAITLIST_QUERY] });
    },
    [addNotification, client]
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      return;
    }

    const cleanupFns: Array<() => void> = [];

    cleanupFns.push(onNotification('notification:BOOKING_CREATED', handleBookingCreated) as () => void);
    cleanupFns.push(onNotification('notification:PARTICIPANT_ADDED', handleParticipantAdded) as () => void);
    cleanupFns.push(onNotification('notification:PARTICIPANT_REMOVED', handleParticipantRemoved) as () => void);
    cleanupFns.push(onNotification('notification:CHECK_IN', handleCheckIn) as () => void);
    cleanupFns.push(onNotification('notification:WAITLIST_CONVERTED', handleWaitlistConverted) as () => void);

    handlersRef.current.set('notification:BOOKING_CREATED', handleBookingCreated);
    handlersRef.current.set('notification:PARTICIPANT_ADDED', handleParticipantAdded);
    handlersRef.current.set('notification:PARTICIPANT_REMOVED', handleParticipantRemoved);
    handlersRef.current.set('notification:CHECK_IN', handleCheckIn);
    handlersRef.current.set('notification:WAITLIST_CONVERTED', handleWaitlistConverted);

    return () => {
      cleanupFns.forEach((fn) => fn());
      handlersRef.current.clear();
    };
  }, [handleBookingCreated, handleParticipantAdded, handleParticipantRemoved, handleCheckIn, handleWaitlistConverted]);

  return {
    notifications,
    unreadCount: unread,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
};