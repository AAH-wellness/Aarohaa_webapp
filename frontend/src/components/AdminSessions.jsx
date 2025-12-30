import React, { useState, useEffect } from 'react'
import './AdminSessions.css'

const AdminSessions = () => {
  const [sessions, setSessions] = useState([])
  const [filteredSessions, setFilteredSessions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    // Load active sessions from localStorage (real data only)
    const storedSessions = JSON.parse(localStorage.getItem('activeSessions') || '[]')
    setSessions(storedSessions)
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setSessions(prev => prev.map(session => ({
        ...session,
        duration: session.status === 'active' 
          ? Math.floor((new Date() - new Date(session.startTime)) / 60000)
          : session.duration
      })))
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let filtered = [...sessions]

    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.userName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter)
    }

    setFilteredSessions(filtered)
  }, [sessions, searchTerm, statusFilter])

  const handleEndSession = (sessionId) => {
    if (window.confirm('Are you sure you want to end this session?')) {
      setSessions(prev => prev.map(session =>
        session.id === sessionId
          ? { ...session, status: 'ended', endTime: new Date().toISOString() }
          : session
      ))
      localStorage.setItem('activeSessions', JSON.stringify(sessions))
    }
  }

  const getConnectionQualityBadge = (quality) => {
    const badges = {
      excellent: { class: 'quality-excellent', icon: '🟢', label: 'Excellent' },
      good: { class: 'quality-good', icon: '🟡', label: 'Good' },
      fair: { class: 'quality-fair', icon: '🟠', label: 'Fair' },
      poor: { class: 'quality-poor', icon: '🔴', label: 'Poor' },
    }
    return badges[quality] || badges.good
  }

  const activeSessionsCount = sessions.filter(s => s.status === 'active').length
  const totalParticipants = sessions.reduce((sum, s) => sum + (s.participants || 0), 0)

  return (
    <div className="admin-sessions">
      <div className="admin-sessions-header">
        <div>
          <h1 className="page-title">Active Sessions Monitor</h1>
          <p className="page-subtitle">Real-time monitoring of video sessions and platform activity</p>
        </div>
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span>Live Monitoring</span>
        </div>
      </div>

      <div className="sessions-stats-grid">
        <div className="stat-card live">
          <div className="stat-header">
            <span className="stat-icon">💻</span>
            <span className="live-badge">LIVE</span>
          </div>
          <span className="stat-label">Active Sessions</span>
          <span className="stat-value">{activeSessionsCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <span className="stat-label">Total Participants</span>
          <span className="stat-value">{totalParticipants}</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏱️</span>
          <span className="stat-label">Avg. Duration</span>
          <span className="stat-value">
            {sessions.length > 0
              ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length)
              : 0}{' '}
            min
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <span className="stat-label">Total Sessions Today</span>
          <span className="stat-value">{sessions.length}</span>
        </div>
      </div>

      <div className="sessions-filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Sessions</option>
          <option value="active">Active</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      <div className="sessions-grid">
        {filteredSessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📹</div>
            <p>No active sessions found</p>
          </div>
        ) : (
          filteredSessions.map(session => {
            const quality = getConnectionQualityBadge(session.connectionQuality)
            const elapsed = Math.floor((new Date() - new Date(session.startTime)) / 60000)
            
            return (
              <div key={session.id} className={`session-card ${session.status === 'active' ? 'active' : ''}`}>
                <div className="session-header">
                  <div className="session-status">
                    {session.status === 'active' && <span className="live-dot"></span>}
                    <span className="status-text">
                      {session.status === 'active' ? 'LIVE' : 'Ended'}
                    </span>
                  </div>
                  <div className={`connection-quality ${quality.class}`}>
                    <span>{quality.icon}</span>
                    <span>{quality.label}</span>
                  </div>
                </div>

                <div className="session-participants">
                  <div className="participant">
                    <div className="participant-avatar provider">{session.providerName?.charAt(0) || 'P'}</div>
                    <div className="participant-info">
                      <span className="participant-name">{session.providerName}</span>
                      <span className="participant-role">Provider</span>
                    </div>
                  </div>
                  <div className="participant">
                    <div className="participant-avatar user">{session.userName?.charAt(0) || 'U'}</div>
                    <div className="participant-info">
                      <span className="participant-name">{session.userName}</span>
                      <span className="participant-role">User</span>
                    </div>
                  </div>
                </div>

                <div className="session-details">
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{elapsed} min</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Started:</span>
                    <span className="detail-value">
                      {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Participants:</span>
                    <span className="detail-value">{session.participants || 2}</span>
                  </div>
                </div>

                <div className="session-actions">
                  <button className="action-btn view" title="View Session">
                    👁️ Monitor
                  </button>
                  {session.status === 'active' && (
                    <button
                      className="action-btn end"
                      title="End Session"
                      onClick={() => handleEndSession(session.id)}
                    >
                      ⏹️ End
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AdminSessions




