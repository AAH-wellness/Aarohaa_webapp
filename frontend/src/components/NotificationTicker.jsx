import React from 'react'
import { useUserNotification } from '../contexts/UserNotificationContext'
import './NotificationTicker.css'

/**
 * Headline revolver / ticker bar shown directly below the user dashboard header.
 * Displays notifications in a scrolling ticker; when multiple exist, they rotate.
 */
export default function NotificationTicker() {
  const { notifications, removeNotification, clearAll } = useUserNotification()

  if (!notifications.length) {
    return null
  }

  return (
    <div className="notification-ticker" role="region" aria-label="Notifications">
      <div className="notification-ticker-inner">
        <span className="notification-ticker-label">📢</span>
        <div className="notification-ticker-revolver" data-scroll={notifications.length > 1}>
          <div className="notification-ticker-track">
            {/* Duplicate set for seamless scroll when multiple items */}
            {(notifications.length > 1 ? [...notifications, ...notifications] : notifications).map((n, i) => (
              <div
                key={n.id + String(i)}
                className={`notification-ticker-item notification-ticker-item--${n.type || 'info'}`}
              >
                <span className="notification-ticker-message">{n.message}</span>
                <button
                  type="button"
                  className="notification-ticker-dismiss"
                  onClick={() => removeNotification(n.id)}
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        {notifications.length > 1 && (
          <button
            type="button"
            className="notification-ticker-clear"
            onClick={clearAll}
            aria-label="Clear all notifications"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
