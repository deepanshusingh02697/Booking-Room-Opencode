import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useApolloClient } from '@apollo/client';
import { useAuth } from '../hooks/useAuth';
import { MY_BOOKINGS_QUERY, MY_MEETINGS_QUERY } from '../graphql/queries/bookings';
import { MY_WAITLIST_QUERY } from '../graphql/queries/waitlist';
import { BOOKING_DETAILS_QUERY } from '../graphql/queries/bookings';
import {
  disconnectSocket,
  getSocket,
  initSocket,
  onNotification,
  subscribeSocketStatus,
} from './socket';
import type { NotificationEventName, NotificationEventPayload } from './events';

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

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * The single owner of the realtime session: it connects the socket, subscribes
 * to the notification events once, and holds the list every page reads from.
 * `Navbar` renders the bell inside this provider, so the handlers are always
 * registered before any component can display a notification.
 */
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const client = useApolloClient();
  const [notifications, setNotifications] = useState<Notification[]>(loadFromStorage);
  const [isConnected, setIsConnected] = useState(() => getSocket()?.connected ?? false);

  useEffect(() => subscribeSocketStatus(setIsConnected), []);

  const addNotification = useCallback((payload: NotificationEventPayload) => {
    const notification: Notification = {
      id: `${payload.type}-${payload.bookingId}-${Date.now()}`,
      type: payload.type,
      bookingId: payload.bookingId,
      title: payload.title,
      roomName: payload.roomName,
      startTime: payload.startTime,
      endTime: payload.endTime,
      organizerName: payload.organizerName,
      message: composeMessage(payload),
      timestamp: Date.now(),
      read: false,
      waitlistStartTime: payload.waitlistStartTime,
      waitlistEndTime: payload.waitlistEndTime,
      checkedInByName: payload.checkedInByName,
    };

    setNotifications((previous) => {
      const next = [notification, ...previous].slice(0, MAX_NOTIFICATIONS);
      saveToStorage(next);
      return next;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((previous) => {
      const target = previous.find((n) => n.id === id);
      if (!target || target.read) {
        return previous;
      }
      const next = previous.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveToStorage(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((previous) => {
      const next = previous.map((n) => ({ ...n, read: true }));
      saveToStorage(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    clearStorage();
    setNotifications([]);
  }, []);

  const handleBookingCreated = useCallback(
    (payload: NotificationEventPayload) => {
      addNotification(payload);
      client.refetchQueries({ include: [MY_MEETINGS_QUERY] });
    },
    [addNotification, client],
  );

  const handleParticipantAdded = useCallback(
    (payload: NotificationEventPayload) => {
      addNotification(payload);
      client.refetchQueries({ include: [MY_MEETINGS_QUERY, BOOKING_DETAILS_QUERY] });
    },
    [addNotification, client],
  );

  const handleParticipantRemoved = useCallback(
    (payload: NotificationEventPayload) => {
      addNotification(payload);
      client.refetchQueries({ include: [MY_MEETINGS_QUERY, BOOKING_DETAILS_QUERY] });
    },
    [addNotification, client],
  );

  const handleCheckIn = useCallback(
    (payload: NotificationEventPayload) => {
      addNotification(payload);
      client.refetchQueries({ include: [BOOKING_DETAILS_QUERY] });
    },
    [addNotification, client],
  );

  const handleWaitlistConverted = useCallback(
    (payload: NotificationEventPayload) => {
      addNotification(payload);
      client.refetchQueries({ include: [MY_BOOKINGS_QUERY, MY_MEETINGS_QUERY, MY_WAITLIST_QUERY] });
    },
    [addNotification, client],
  );

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      return;
    }

    // Connect first, then subscribe: `onNotification` binds to the live socket,
    // so registering earlier would silently drop every event.
    initSocket();

    const unsubscribes = [
      onNotification('notification:BOOKING_CREATED', handleBookingCreated),
      onNotification('notification:PARTICIPANT_ADDED', handleParticipantAdded),
      onNotification('notification:PARTICIPANT_REMOVED', handleParticipantRemoved),
      onNotification('notification:CHECK_IN', handleCheckIn),
      onNotification('notification:WAITLIST_CONVERTED', handleWaitlistConverted),
    ];

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [
    isAuthenticated,
    user,
    handleBookingCreated,
    handleParticipantAdded,
    handleParticipantRemoved,
    handleCheckIn,
    handleWaitlistConverted,
  ]);

  // The unread count is derived, so it cannot drift from the list it summarises.
  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      isConnected,
      markAsRead,
      markAllAsRead,
      clearAll,
    }),
    [notifications, isConnected, markAsRead, markAllAsRead, clearAll],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used inside a NotificationProvider.');
  }
  return context;
};
