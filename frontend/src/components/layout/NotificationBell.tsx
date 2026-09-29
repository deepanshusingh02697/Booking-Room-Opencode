import { useState, useRef, useEffect, useCallback } from 'react';
import { LuBell, LuBellOff } from 'react-icons/lu';
import { useNotifications } from '../../realtime/NotificationProvider';
import { layout, typeScale } from '../../theme';
import { NavLink } from 'react-router-dom';

export const NotificationBell = () => {
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleNotificationClick = (notification: { id: string }) => {
    markAsRead(notification.id);
    setIsOpen(false);
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-white hover:bg-white/10 transition-colors"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {isConnected ? (
          <LuBell className="h-5 w-5" aria-hidden="true" />
        ) : (
          <LuBellOff className="h-5 w-5 text-amber-300" aria-hidden="true" />
        )}
        {!isConnected && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />
        )}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 h-5 w-5 min-w-[19px] rounded-full bg-red-500 text-[11px] font-bold flex items-center justify-center text-white"
            aria-label={`${unreadCount} unread`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-96 bg-white border border-black shadow-lg rounded z-50"
          role="menu"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-rule">
            <h3 className={typeScale.panelTitle}>Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className={typeScale.buttonLabel}
                  aria-label="Mark all as read"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[13px] font-medium text-red-600 hover:underline"
                  aria-label="Clear all notifications"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {recentNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-body">
              No notifications yet
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {recentNotifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-4 py-3 text-left border-b border-rule hover:bg-tint transition-colors ${
                    !notification.read ? 'bg-tintStrong' : ''
                  }`}
                  role="menuitem"
                >
                  <p className={`text-sm ${!notification.read ? 'font-semibold text-heading' : 'text-body'}`}>
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-faint">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}

          <div className="px-4 py-2 border-t border-rule">
            <NavLink
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center text-sm font-semibold text-navy hover:text-navySoft"
            >
              View all notifications
            </NavLink>
          </div>
        </div>
      )}
    </div>
  );
};