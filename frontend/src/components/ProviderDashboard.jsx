import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Calendar, Video, BarChart3, Settings } from 'lucide-react'
import './ProviderDashboard.css'

const ProviderDashboard = ({ onNavigate }) => {
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

      // Calculate earnings (mock data for now)
      const totalEarnings = appointments.length * 50 // Mock: $50 per appointment
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.dateTime)
        return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }).length
      const todayEarnings = todayAppointments * 50

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
      trend: '+3',
      trendLabel: 'This week',
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
      trend: '+12%',
      trendLabel: 'This month',
    },
    {
      title: 'Today\'s Earnings',
      value: `$${stats.todayEarnings.toLocaleString()}`,
      icon: '💵',
      color: 'orange',
      trend: '+$120',
      trendLabel: 'vs yesterday',
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
          <QuickActionButtons onNavigate={onNavigate} />
        </div>

        <div className="dashboard-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="recent-activity">
            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-content">
                <p className="activity-text">Session completed with John Doe</p>
                <p className="activity-time">2 hours ago</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📅</div>
              <div className="activity-content">
                <p className="activity-text">New appointment booked for tomorrow</p>
                <p className="activity-time">5 hours ago</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">💰</div>
              <div className="activity-content">
                <p className="activity-text">Payment received: $150</p>
                <p className="activity-time">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const QuickActionButtons = ({ onNavigate }) => {
  const actions = [
    {
      id: 'schedule',
      icon: <Calendar className="quick-action-icon" />,
      label: 'View Schedule',
      description: 'My appointments',
      gradient: 'gradient-blue',
      onClick: () => onNavigate && onNavigate('My Schedule'),
    },
    {
      id: 'session',
      icon: <Video className="quick-action-icon" />,
      label: 'Start Session',
      description: 'Active sessions',
      gradient: 'gradient-purple',
      onClick: () => onNavigate && onNavigate('Active Sessions'),
    },
    {
      id: 'analytics',
      icon: <BarChart3 className="quick-action-icon" />,
      label: 'View Analytics',
      description: 'Reports & insights',
      gradient: 'gradient-orange',
      onClick: () => onNavigate && onNavigate('Earnings'),
    },
    {
      id: 'settings',
      icon: <Settings className="quick-action-icon" />,
      label: 'Settings',
      description: 'Configure',
      gradient: 'gradient-emerald',
      onClick: () => onNavigate && onNavigate('Profile'),
    },
  ]

  return (
    <div className="quick-actions-grid">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          onClick={action.onClick}
          className={`quick-action-button ${action.gradient}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: index * 0.1,
            type: 'spring',
            stiffness: 200,
          }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="quick-action-pattern"></div>
          <div className="quick-action-content">
            <div className="quick-action-icon-wrapper">
              {action.icon}
            </div>
            <div className="quick-action-text">
              <h3 className="quick-action-label">{action.label}</h3>
              <p className="quick-action-description">{action.description}</p>
            </div>
          </div>
          <motion.div
            className="quick-action-shine"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
        </motion.button>
      ))}
    </div>
  )
}

export default ProviderDashboard

