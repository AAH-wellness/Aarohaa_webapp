import React, { useState } from 'react'
import './AdminSettings.css'

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    platformName: 'Aarohaa Wellness',
    platformEmail: 'admin@aarohaa.com',
    sessionDuration: 60,
    maxConcurrentSessions: 100,
    requireProviderVerification: true,
    enableWalletPayments: true,
    enableGoogleAuth: true,
    maintenanceMode: false,
    allowNewRegistrations: true,
    emailNotifications: true,
    auditLogRetention: 90,
    maxFileUploadSize: 10,
    platformCurrency: 'USD',
  })

  const [activeTab, setActiveTab] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem('platformSettings', JSON.stringify(settings))
    setHasChanges(false)
    
    // Trigger storage event for other tabs/windows
    window.dispatchEvent(new Event('storage'))
    
    // Show confirmation with maintenance mode warning if enabled
    if (settings.maintenanceMode) {
      alert('Settings saved successfully!\n\n⚠️ Maintenance mode is now ENABLED. Only administrators can access the platform.')
    } else {
      alert('Settings saved successfully!')
    }
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      // Reset to default values
      setSettings({
        platformName: 'Aarohaa Wellness',
        platformEmail: 'admin@aarohaa.com',
        sessionDuration: 60,
        maxConcurrentSessions: 100,
        requireProviderVerification: true,
        enableWalletPayments: true,
        enableGoogleAuth: true,
        maintenanceMode: false,
        allowNewRegistrations: true,
        emailNotifications: true,
        auditLogRetention: 90,
        maxFileUploadSize: 10,
        platformCurrency: 'USD',
      })
      setHasChanges(true)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'features', label: 'Features', icon: '✨' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'policies', label: 'Policies', icon: '📋' },
  ]

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <div>
          <h1 className="page-title">Platform Settings</h1>
          <p className="page-subtitle">Manage platform configuration and policies</p>
        </div>
        <div className="settings-actions">
          <button className="action-button secondary" onClick={handleReset}>
            Reset to Default
          </button>
          <button
            className={`action-button primary ${!hasChanges ? 'disabled' : ''}`}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2 className="section-title">General Settings</h2>
              <div className="settings-form">
                <div className="form-group">
                  <label className="form-label">Platform Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.platformName}
                    onChange={(e) => handleSettingChange('platformName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={settings.platformEmail}
                    onChange={(e) => handleSettingChange('platformEmail', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Default Session Duration (minutes)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={settings.sessionDuration}
                    onChange={(e) => handleSettingChange('sessionDuration', parseInt(e.target.value))}
                    min="15"
                    max="120"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Concurrent Sessions</label>
                  <input
                    type="number"
                    className="form-input"
                    value={settings.maxConcurrentSessions}
                    onChange={(e) => handleSettingChange('maxConcurrentSessions', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform Currency</label>
                  <select
                    className="form-select"
                    value={settings.platformCurrency}
                    onChange={(e) => handleSettingChange('platformCurrency', e.target.value)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SOL">SOL (SOL)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2 className="section-title">Security Settings</h2>
              <div className="settings-form">
                <div className="form-group toggle-group">
                  <div className="toggle-label-group">
                    <label className="form-label">Require Provider Verification</label>
                    <p className="form-description">All providers must be verified before they can accept appointments</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.requireProviderVerification}
                      onChange={(e) => handleSettingChange('requireProviderVerification', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="form-group toggle-group">
                  <div className="toggle-label-group">
                    <label className="form-label">Enable Google Authentication</label>
                    <p className="form-description">Allow users to sign in with Google</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.enableGoogleAuth}
                      onChange={(e) => handleSettingChange('enableGoogleAuth', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label">Audit Log Retention (days)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={settings.auditLogRetention}
                    onChange={(e) => handleSettingChange('auditLogRetention', parseInt(e.target.value))}
                    min="30"
                    max="365"
                  />
                  <p className="form-description">How long to keep audit logs before automatic deletion</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Max File Upload Size (MB)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={settings.maxFileUploadSize}
                    onChange={(e) => handleSettingChange('maxFileUploadSize', parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="settings-section">
              <h2 className="section-title">Feature Toggles</h2>
              <div className="settings-form">
                <div className="form-group toggle-group">
                  <div className="toggle-label-group">
                    <label className="form-label">Enable Wallet Payments</label>
                    <p className="form-description">Allow blockchain wallet payments (Solana)</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.enableWalletPayments}
                      onChange={(e) => handleSettingChange('enableWalletPayments', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="form-group toggle-group">
                  <div className="toggle-label-group">
                    <label className="form-label">Maintenance Mode</label>
                    <p className="form-description">Put platform in maintenance mode (only admins can access)</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="form-group toggle-group">
                  <div className="toggle-label-group">
                    <label className="form-label">Allow New Registrations</label>
                    <p className="form-description">Allow new users and providers to register</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.allowNewRegistrations}
                      onChange={(e) => handleSettingChange('allowNewRegistrations', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2 className="section-title">Notification Settings</h2>
              <div className="settings-form">
                <div className="form-group toggle-group">
                  <div className="toggle-label-group">
                    <label className="form-label">Email Notifications</label>
                    <p className="form-description">Send email notifications for important events</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="settings-section">
              <h2 className="section-title">Platform Policies</h2>
              <div className="policies-content">
                <div className="policy-card">
                  <h3 className="policy-title">Terms of Service</h3>
                  <p className="policy-description">Manage platform terms of service and user agreements</p>
                  <button className="policy-action-btn">Edit Policy</button>
                </div>
                <div className="policy-card">
                  <h3 className="policy-title">Privacy Policy</h3>
                  <p className="policy-description">Configure privacy policy and data handling practices</p>
                  <button className="policy-action-btn">Edit Policy</button>
                </div>
                <div className="policy-card">
                  <h3 className="policy-title">Provider Guidelines</h3>
                  <p className="policy-description">Set rules and guidelines for wellness providers</p>
                  <button className="policy-action-btn">Edit Policy</button>
                </div>
                <div className="policy-card">
                  <h3 className="policy-title">User Code of Conduct</h3>
                  <p className="policy-description">Define expected behavior and community standards</p>
                  <button className="policy-action-btn">Edit Policy</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSettings

