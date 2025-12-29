import React, { useState, useEffect } from 'react'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    activeSessions: 0,
    todayAppointments: 0,
    totalEarnings: 0,
    platformHealth: 'healthy',
    walletTransactions: 0,
    walletVolume: 0,
    systemUptime: 100,
    alerts: [],
  })

  const [walletActivity, setWalletActivity] = useState([])
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const loadStats = () => {
      // Load from localStorage or calculate from data
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]')
      const messages = JSON.parse(localStorage.getItem('messages') || '[]')
      const walletData = JSON.parse(localStorage.getItem('walletData') || 'null')
      
      const now = new Date()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Calculate stats
      const todayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.dateTime)
        return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }).length

      // Mock wallet activity
      const mockWalletActivity = [
        { id: 1, type: 'Payment', amount: 50, wallet: 'Phantom', time: '5 min ago', status: 'completed' },
        { id: 2, type: 'Payment', amount: 75, wallet: 'Solflare', time: '12 min ago', status: 'completed' },
        { id: 3, type: 'Payment', amount: 100, wallet: 'Phantom', time: '1 hour ago', status: 'completed' },
        { id: 4, type: 'Connection', amount: 0, wallet: 'Backpack', time: '2 hours ago', status: 'connected' },
      ]

      // Mock alerts
      const mockAlerts = [
        { id: 1, type: 'warning', message: 'High session load detected', time: '10 min ago', severity: 'medium' },
        { id: 2, type: 'info', message: 'New provider verification pending', time: '1 hour ago', severity: 'low' },
      ]

      setWalletActivity(mockWalletActivity)
      setAlerts(mockAlerts)

      setStats({
        totalUsers: 1250, // Mock data
        totalProviders: 3, // From FindProviders
        activeSessions: 2, // Mock active sessions
        todayAppointments,
        totalEarnings: appointments.length * 50, // Mock calculation
        platformHealth: 'healthy',
        walletTransactions: mockWalletActivity.length,
        walletVolume: mockWalletActivity.reduce((sum, t) => sum + t.amount, 0),
        systemUptime: 99.9,
        alerts: mockAlerts,
      })
    }

    loadStats()
    const interval = setInterval(loadStats, 30000) // Update every 30 seconds for real-time feel
    return () => clearInterval(interval)
  }, [])

  const kpiCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: '👥',
      color: 'blue',
      trend: '+12%',
      trendLabel: 'vs last month',
    },
    {
      title: 'Total Providers',
      value: stats.totalProviders,
      icon: '🏥',
      color: 'green',
      trend: '+2',
      trendLabel: 'new this month',
    },
    {
      title: 'Active Sessions',
      value: stats.activeSessions,
      icon: '💻',
      color: 'purple',
      trend: 'Live',
      trendLabel: 'right now',
      isLive: stats.activeSessions > 0,
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: '📅',
      color: 'orange',
      trend: `+${stats.todayAppointments}`,
      trendLabel: 'scheduled today',
    },
    {
      title: 'Platform Health',
      value: stats.platformHealth.charAt(0).toUpperCase() + stats.platformHealth.slice(1),
      icon: '💚',
      color: 'green',
      trend: '100%',
      trendLabel: 'uptime',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalEarnings.toLocaleString()}`,
      icon: '💰',
      color: 'gold',
      trend: '+15%',
      trendLabel: 'vs last month',
    },
    {
      title: 'Wallet Transactions',
      value: stats.walletTransactions,
      icon: '🔗',
      color: 'purple',
      trend: `$${stats.walletVolume}`,
      trendLabel: 'total volume',
    },
    {
      title: 'System Uptime',
      value: `${stats.systemUptime}%`,
      icon: '⚡',
      color: 'green',
      trend: '99.9%',
      trendLabel: 'last 30 days',
    },
  ]

  const recentActivities = [
    { type: 'user_registered', message: 'New user registered: john.doe@example.com', time: '2 min ago', icon: '👤' },
    { type: 'appointment_booked', message: 'Appointment booked: Dr. Maya Patel with Patient', time: '5 min ago', icon: '📅' },
    { type: 'session_started', message: 'Video session started', time: '10 min ago', icon: '💻' },
    { type: 'provider_verified', message: 'Provider verified: Sarah Rodriguez', time: '1 hour ago', icon: '✅' },
  ]

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">System-wide overview and platform monitoring</p>
        </div>
        <div className="health-indicator">
          <span className="health-status healthy">●</span>
          <span>All Systems Operational</span>
        </div>
      </div>

      <div className="kpi-grid">
        {kpiCards.map((card, index) => (
          <div key={index} className={`kpi-card kpi-card-${card.color}`}>
            <div className="kpi-header">
              <div className="kpi-icon">{card.icon}</div>
              <div className={`kpi-badge ${card.isLive ? 'live' : ''}`}>
                {card.isLive && <span className="live-dot"></span>}
                {card.trend}
              </div>
            </div>
            <div className="kpi-content">
              <h3 className="kpi-title">{card.title}</h3>
              <p className="kpi-value">{card.value}</p>
              <p className="kpi-trend-label">{card.trendLabel}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section wide">
          <div className="section-header-row">
            <h2 className="section-title">Recent Activity</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="activity-table">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-row">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <p className="activity-message">{activity.message}</p>
                  <p className="activity-time">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header-row">
            <h2 className="section-title">Platform Alerts</h2>
            <span className={`alert-count ${alerts.length > 0 ? 'has-alerts' : ''}`}>
              {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
            </span>
          </div>
          <div className="alerts-list">
            {alerts.length === 0 ? (
              <div className="no-alerts">No active alerts</div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                  <div className="alert-icon">
                    {alert.type === 'warning' ? '⚠️' : alert.type === 'error' ? '🔴' : 'ℹ️'}
                  </div>
                  <div className="alert-content">
                    <p className="alert-message">{alert.message}</p>
                    <p className="alert-time">{alert.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section wide">
          <div className="section-header-row">
            <h2 className="section-title">Wallet Activity</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="wallet-activity-table">
            {walletActivity.length === 0 ? (
              <div className="empty-state">No recent wallet activity</div>
            ) : (
              walletActivity.map(activity => (
                <div key={activity.id} className="wallet-activity-row">
                  <div className="wallet-icon">{activity.wallet === 'Phantom' ? '👻' : activity.wallet === 'Solflare' ? '🔥' : '🎒'}</div>
                  <div className="wallet-activity-content">
                    <div className="wallet-activity-header">
                      <span className="wallet-type">{activity.type}</span>
                      {activity.amount > 0 && (
                        <span className="wallet-amount">${activity.amount}</span>
                      )}
                    </div>
                    <div className="wallet-activity-details">
                      <span className="wallet-name">{activity.wallet}</span>
                      <span className="wallet-separator">•</span>
                      <span className={`wallet-status status-${activity.status}`}>{activity.status}</span>
                      <span className="wallet-separator">•</span>
                      <span className="wallet-time">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <button className="quick-action-btn">
              <span className="action-icon">👥</span>
              <span className="action-label">Manage Users</span>
            </button>
            <button className="quick-action-btn">
              <span className="action-icon">🏥</span>
              <span className="action-label">Manage Providers</span>
            </button>
            <button className="quick-action-btn">
              <span className="action-icon">📊</span>
              <span className="action-label">View Analytics</span>
            </button>
            <button className="quick-action-btn">
              <span className="action-icon">⚙️</span>
              <span className="action-label">Platform Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
