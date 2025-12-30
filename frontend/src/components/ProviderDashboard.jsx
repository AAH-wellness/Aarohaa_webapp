import React, { useState, useEffect } from 'react'
import './ProviderDashboard.css'

const ProviderDashboard = () => {
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    activeSessions: 0,
    totalEarnings: 0,
    todayEarnings: 0,
  })

  useEffect(() => {
    // Load appointments from localStorage
    const loadStats = () => {
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]')
      const now = new Date()
      
      // Count upcoming appointments
      const upcoming = appointments.filter(apt => {
        const aptDate = new Date(apt.dateTime)
        return aptDate > now
      }).length

      // Calculate earnings from real payment data
      const payments = JSON.parse(localStorage.getItem('payments') || '[]')
      const totalEarnings = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayPayments = payments.filter(p => {
        const paymentDate = new Date(p.date || p.createdAt)
        return paymentDate >= today && paymentDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
      })
      const todayEarnings = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

      setStats({
        upcomingAppointments: upcoming,
        activeSessions: 0, // Will be updated when sessions are active
        totalEarnings: totalEarnings,
        todayEarnings: todayEarnings,
      })
    }

    loadStats()
    const interval = setInterval(loadStats, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  const statCards = [
    {
      title: 'Upcoming Appointments',
      value: stats.upcomingAppointments,
      icon: '📅',
      color: 'blue',
      trend: '',
      trendLabel: '',
    },
    {
      title: 'Active Sessions',
      value: stats.activeSessions,
      icon: '💻',
      color: 'green',
      trend: 'Live',
      trendLabel: 'Now',
      isLive: stats.activeSessions > 0,
    },
    {
      title: 'Total Earnings',
      value: `$${stats.totalEarnings.toLocaleString()}`,
      icon: '💰',
      color: 'purple',
      trend: '',
      trendLabel: '',
    },
    {
      title: 'Today\'s Earnings',
      value: `$${stats.todayEarnings.toLocaleString()}`,
      icon: '💵',
      color: 'orange',
      trend: '',
      trendLabel: '',
    },
  ]

  return (
    <div className="provider-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Provider Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className={`stat-card stat-card-${card.color}`}>
            <div className="stat-card-header">
              <div className="stat-icon">{card.icon}</div>
              <div className={`stat-badge ${card.isLive ? 'live' : ''}`}>
                {card.isLive && <span className="live-dot"></span>}
                {card.trend}
              </div>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">{card.title}</h3>
              <p className="stat-value">{card.value}</p>
              <p className="stat-trend-label">{card.trendLabel}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions">
            <button className="action-btn">
              <span className="action-icon">📅</span>
              <span className="action-label">View Schedule</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">💻</span>
              <span className="action-label">Start Session</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">📊</span>
              <span className="action-label">View Analytics</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">⚙️</span>
              <span className="action-label">Settings</span>
            </button>
          </div>
        </div>

        <div className="dashboard-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="recent-activity">
            {(() => {
              const activities = JSON.parse(localStorage.getItem('providerActivities') || '[]')
              return activities.length === 0 ? (
                <div className="empty-state">No recent activity</div>
              ) : (
                activities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">{activity.icon || '📝'}</div>
                    <div className="activity-content">
                      <p className="activity-text">{activity.text}</p>
                      <p className="activity-time">{activity.time}</p>
                    </div>
                  </div>
                ))
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProviderDashboard

