import React, { useState, useEffect } from 'react'
import './ProviderDashboard.css'
import { apiClient, API_CONFIG } from '../services'

const ProviderDashboard = ({ onJoinSession, onNavigateToSchedule }) => {
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    activeSessions: 0,
    totalEarnings: 0,
    todayEarnings: 0,
  })
  const [todayAppointments, setTodayAppointments] = useState([])
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true)
        const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
        const response = await apiClient.get(`${apiBaseUrl}/provider/bookings`)
        
        // Transform backend booking format to appointment format
        const allAppointments = (response.bookings || []).map(booking => ({
          id: booking.id,
          userId: booking.userId,
          patientName: booking.userName || 'Patient',
          userEmail: booking.userEmail,
          userPhone: booking.userPhone,
          dateTime: booking.appointmentDate,
          sessionType: booking.sessionType || 'Video Consultation',
          notes: booking.notes,
          status: booking.status || 'scheduled',
          createdAt: booking.createdAt
        }))
        
        const now = new Date()
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const tomorrow = new Date(todayStart)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        // Filter today's appointments
        const todayAppts = allAppointments.filter(apt => {
          const appointmentDate = new Date(apt.dateTime)
          return appointmentDate >= todayStart && appointmentDate < tomorrow && 
                 apt.status !== 'cancelled' && apt.status !== 'completed'
        })
        
        // Filter upcoming appointments
        const upcoming = allAppointments.filter(apt => {
          const appointmentDate = new Date(apt.dateTime)
          return appointmentDate > now && 
                 apt.status !== 'cancelled' && apt.status !== 'completed'
        })
        
        // Count active sessions (within 30 minutes of start time)
        const active = allAppointments.filter(apt => {
          const appointmentDate = new Date(apt.dateTime)
          const diffInMinutes = (appointmentDate - now) / (1000 * 60)
          return diffInMinutes >= -30 && diffInMinutes <= 30 && 
                 apt.status !== 'cancelled' && apt.status !== 'completed'
        }).length
        
        // Calculate earnings (mock: $50 per appointment)
        const totalEarnings = allAppointments.filter(apt => apt.status === 'completed').length * 50
        const todayEarnings = todayAppts.filter(apt => apt.status === 'completed').length * 50
        
        // Sort appointments
        todayAppts.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
        upcoming.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
        
        setTodayAppointments(todayAppts)
        setUpcomingAppointments(upcoming)
        setStats({
          upcomingAppointments: upcoming.length,
          activeSessions: active,
          totalEarnings: totalEarnings,
          todayEarnings: todayEarnings,
        })
      } catch (error) {
        console.error('Error loading provider appointments:', error)
        setTodayAppointments([])
        setUpcomingAppointments([])
      } finally {
        setLoading(false)
      }
    }

    loadAppointments()
    const interval = setInterval(loadAppointments, 60000) // Update every minute
    
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
          <div className="section-header-with-action">
            <h2 className="section-title">Today's Appointments</h2>
            {onNavigateToSchedule && (
              <button className="view-all-btn" onClick={onNavigateToSchedule}>
                View All
              </button>
            )}
          </div>
          {loading ? (
            <div className="appointments-loading">Loading appointments...</div>
          ) : todayAppointments.length === 0 ? (
            <div className="no-appointments-message">
              <p>No appointments scheduled for today.</p>
            </div>
          ) : (
            <div className="dashboard-appointments-list">
              {todayAppointments.slice(0, 3).map((appointment) => (
                <div key={appointment.id} className="dashboard-appointment-item">
                  <div className="dashboard-appointment-info">
                    <h4 className="dashboard-appointment-patient">
                      {appointment.patientName}
                    </h4>
                    <p className="dashboard-appointment-time">
                      {new Date(appointment.dateTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="dashboard-appointment-type">{appointment.sessionType}</p>
                  </div>
                  {onJoinSession && (
                    <button
                      className="dashboard-join-btn"
                      onClick={() => onJoinSession({
                        id: appointment.id,
                        userId: appointment.userId,
                        userName: appointment.patientName,
                        dateTime: appointment.dateTime,
                        sessionType: appointment.sessionType,
                        notes: appointment.notes,
                        status: appointment.status
                      })}
                    >
                      Join
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="section-header-with-action">
            <h2 className="section-title">Upcoming Appointments</h2>
            {onNavigateToSchedule && (
              <button className="view-all-btn" onClick={onNavigateToSchedule}>
                View All
              </button>
            )}
          </div>
          {loading ? (
            <div className="appointments-loading">Loading appointments...</div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="no-appointments-message">
              <p>No upcoming appointments.</p>
            </div>
          ) : (
            <div className="dashboard-appointments-list">
              {upcomingAppointments.slice(0, 3).map((appointment) => (
                <div key={appointment.id} className="dashboard-appointment-item">
                  <div className="dashboard-appointment-info">
                    <h4 className="dashboard-appointment-patient">
                      {appointment.patientName}
                    </h4>
                    <p className="dashboard-appointment-time">
                      {new Date(appointment.dateTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="dashboard-appointment-type">{appointment.sessionType}</p>
                  </div>
                  {onJoinSession && (
                    <button
                      className="dashboard-join-btn"
                      onClick={() => onJoinSession({
                        id: appointment.id,
                        userId: appointment.userId,
                        userName: appointment.patientName,
                        dateTime: appointment.dateTime,
                        sessionType: appointment.sessionType,
                        notes: appointment.notes,
                        status: appointment.status
                      })}
                    >
                      Join
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProviderDashboard

