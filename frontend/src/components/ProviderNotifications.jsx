import React, { useState, useEffect } from 'react'
import './ProviderNotifications.css'

const ProviderNotifications = ({ onBack }) => {
  const [notifications, setNotifications] = useState({
    email: {
      enabled: true,
      newBooking: true,
      bookingCancelled: true,
      sessionReminder: true,
      paymentReceived: true,
    },
    push: {
      enabled: true,
      newBooking: true,
      bookingCancelled: false,
      sessionReminder: true,
      paymentReceived: true,
    },
    sms: {
      enabled: false,
      newBooking: false,
      bookingCancelled: false,
      sessionReminder: false,
      paymentReceived: false,
    },
  })

  const [emailAddress, setEmailAddress] = useState('maya.patel@aarohaa.com')
  const [phoneNumber, setPhoneNumber] = useState('+1 234 567 8900')
  const [reminderTime, setReminderTime] = useState('30')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem('providerNotifications')
    if (saved) {
      setNotifications(JSON.parse(saved))
    }
    const savedEmail = localStorage.getItem('providerNotificationEmail')
    if (savedEmail) setEmailAddress(savedEmail)
    const savedPhone = localStorage.getItem('providerNotificationPhone')
    if (savedPhone) setPhoneNumber(savedPhone)
    const savedReminder = localStorage.getItem('providerReminderTime')
    if (savedReminder) setReminderTime(savedReminder)
  }, [])

  const handleToggle = (channel, type) => {
    setNotifications({
      ...notifications,
      [channel]: {
        ...notifications[channel],
        [type]: !notifications[channel][type],
      },
    })
  }

  const handleChannelToggle = (channel) => {
    setNotifications({
      ...notifications,
      [channel]: {
        ...notifications[channel],
        enabled: !notifications[channel].enabled,
      },
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    localStorage.setItem('providerNotifications', JSON.stringify(notifications))
    localStorage.setItem('providerNotificationEmail', emailAddress)
    localStorage.setItem('providerNotificationPhone', phoneNumber)
    localStorage.setItem('providerReminderTime', reminderTime)
    
    setIsSaving(false)
    alert('Notification settings saved successfully!')
  }

  const notificationTypes = [
    { key: 'newBooking', label: 'New Booking', description: 'Get notified when a patient books an appointment' },
    { key: 'bookingCancelled', label: 'Booking Cancelled', description: 'Get notified when a patient cancels' },
    { key: 'sessionReminder', label: 'Session Reminder', description: 'Receive reminders before sessions start' },
    { key: 'paymentReceived', label: 'Payment Received', description: 'Get notified when payments are processed' },
  ]

  return (
    <div className="provider-notifications">
      <div className="notifications-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div>
          <h1 className="notifications-title">Notification Settings</h1>
          <p className="notifications-subtitle">Configure how and when you receive notifications</p>
        </div>
      </div>

      <div className="notifications-container">
        <div className="notification-section">
          <div className="section-header">
            <h2 className="section-title">Contact Information</h2>
            <p className="section-description">Update your contact details for notifications</p>
          </div>
          
          <div className="contact-fields">
            <div className="contact-field">
              <label>Email Address</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="contact-input"
                placeholder="your.email@example.com"
              />
            </div>
            <div className="contact-field">
              <label>Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="contact-input"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
        </div>

        <div className="notification-section">
          <div className="section-header">
            <h2 className="section-title">Session Reminders</h2>
          </div>
          <div className="reminder-setting">
            <label>Remind me</label>
            <select
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="reminder-select"
            >
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="120">2 hours before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>
        </div>

        <div className="notification-section">
          <div className="section-header">
            <h2 className="section-title">Notification Channels</h2>
            <p className="section-description">Choose which channels to receive notifications on</p>
          </div>

          {['email', 'push', 'sms'].map((channel) => (
            <div key={channel} className="channel-group">
              <div className="channel-header">
                <div className="channel-toggle">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications[channel].enabled}
                      onChange={() => handleChannelToggle(channel)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <div>
                    <span className="channel-name">
                      {channel === 'email' ? '📧 Email' : channel === 'push' ? '🔔 Push Notifications' : '📱 SMS'}
                    </span>
                  </div>
                </div>
              </div>
              
              {notifications[channel].enabled && (
                <div className="channel-settings">
                  {notificationTypes.map((type) => (
                    <div key={type.key} className="notification-setting">
                      <div className="setting-info">
                        <span className="setting-label">{type.label}</span>
                        <span className="setting-description">{type.description}</span>
                      </div>
                      <label className="toggle-switch small">
                        <input
                          type="checkbox"
                          checked={notifications[channel][type.key]}
                          onChange={() => handleToggle(channel, type.key)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="notifications-actions">
          <button className="cancel-button" onClick={onBack}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProviderNotifications

