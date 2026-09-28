import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LuMail, LuX, LuBell } from 'react-icons/lu';
import { useNotifications } from '../../realtime/useNotifications';
import { PanelCard, ListRow, EmptyState, PageHeader } from '../../components/common';
import { layout, typeScale, copy } from '../../theme';

export const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [showAll, setShowAll] = useState(false);

  const displayNotifications = showAll ? notifications : notifications.slice(0, 50);

  const handleNotificationClick = useCallback((notification: { bookingId: number; id: string }) => {
    markAsRead(notification.id);
  }, [markAsRead]);

  return (
    <div className={layout.pageBody}>
      <PageHeader
        title="Notifications"
        sub={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        topPad="pt-10"
        action={
          <>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className={`h-10 px-4 rounded border ${layout.card} ${typeScale.buttonLabel}`}
              >
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className={`h-10 px-4 rounded border border-red-300 bg-white text-red-600 hover:bg-red-50 ${typeScale.buttonLabel}`}
              >
                Clear all
              </button>
            )}
          </>
        }
      />

      <PanelCard
        title="Notification History"
        sub={`${notifications.length} total ${notifications.length > 50 ? '(showing latest 50)' : ''}`}
      >
        {displayNotifications.length === 0 ? (
          <EmptyState
            message="No notifications yet. When you're invited to a meeting, added to a booking, or your waitlist entry converts, it will appear here."
          />
        ) : (
          <div className="divide-y divide-rule">
            {displayNotifications.map((notification) => (
              <ListRow
                key={notification.id}
                className={`py-3 ${!notification.read ? 'bg-tintStrong' : ''}`}
                action={
                  <Link
                    to={`/bookings/${notification.bookingId}`}
                    onClick={() => handleNotificationClick(notification)}
                    className="flex items-center gap-1 text-navy hover:text-navySoft text-sm font-medium"
                  >
                    <LuMail className="h-3.5 w-3.5" aria-hidden="true" />
                    View
                  </Link>
                }
              >
                <p className={`text-sm ${!notification.read ? 'font-semibold text-heading' : 'text-body'}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-faint">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </ListRow>
            ))}
          </div>
        )}

        {notifications.length > 50 && !showAll && (
          <div className="mt-4 pt-4 border-t border-rule text-center">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-sm font-medium text-navy hover:text-navySoft"
            >
              Show all {notifications.length} notifications
            </button>
          </div>
        )}
      </PanelCard>
    </div>
  );
};