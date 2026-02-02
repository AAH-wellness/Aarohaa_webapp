import React, { createContext, useContext, useState, useCallback } from 'react'

const UserNotificationContext = createContext(null)

export function UserNotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((message, options = {}) => {
    const id = `n-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const { type = 'info', autoDismissMs = 6000 } = options
    setNotifications((prev) => [...prev, { id, message, type, autoDismissMs }])
    if (autoDismissMs > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, autoDismissMs)
    }
    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <UserNotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, clearAll }}
    >
      {children}
    </UserNotificationContext.Provider>
  )
}

export function useUserNotification() {
  const ctx = useContext(UserNotificationContext)
  if (!ctx) {
    return {
      notifications: [],
      addNotification: (msg) => {},
      removeNotification: () => {},
      clearAll: () => {},
    }
  }
  return ctx
}
