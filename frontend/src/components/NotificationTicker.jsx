import React, { useState, useEffect, useRef } from 'react'
import { useUserNotification } from '../contexts/UserNotificationContext'
import './NotificationTicker.css'

/**
 * Headline revolver / ticker bar shown directly below the user dashboard header.
 * Drops down slowly from header bottom, scrolls notifications, then slides back up when cleared.
 */
export default function NotificationTicker() {
  const { notifications, removeNotification, clearAll } = useUserNotification()
  const [isExiting, setIsExiting] = useState(false)
  const [displayList, setDisplayList] = useState([])
  const prevCountRef = useRef(0)

  useEffect(() => {
    if (notifications.length > 0) {
      setDisplayList(notifications)
      setIsExiting(false)
    } else if (prevCountRef.current > 0) {
      setIsExiting(true)
    }
    prevCountRef.current = notifications.length
  }, [notifications.length, notifications])

  const handleAnimationEnd = (e) => {
    if (e.target.classList.contains('notification-ticker') && e.animationName === 'notification-ticker-drop-out') {
      setIsExiting(false)
      setDisplayList([])
    }
  }

  const show = notifications.length > 0 || isExiting
  const list = notifications.length > 0 ? notifications : displayList

  if (!show || !list.length) {
    return null
  }

  return (
    <div
      className={`notification-ticker ${isExiting ? 'notification-ticker--exiting' : ''}`}
      role="region"
      aria-label="Notifications"
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="notification-ticker-inner">
        <span className="notification-ticker-label">📢</span>
        <div className="notification-ticker-revolver">
          <div className="notification-ticker-track">
            {[...list, ...list].map((n, i) => (
              <div
                key={n.id + String(i)}
                className={`notification-ticker-item notification-ticker-item--${n.type || 'info'}`}
              >
                <span className="notification-ticker-message">{n.message}</span>
                {!isExiting && (
                  <button
                    type="button"
                    className="notification-ticker-dismiss"
                    onClick={() => removeNotification(n.id)}
                    aria-label="Dismiss notification"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        {!isExiting && list.length > 1 && (
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
