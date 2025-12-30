import React, { useState, useEffect } from 'react'
import './AdminAuditLog.css'

const AdminAuditLog = () => {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    // Load audit logs from localStorage (real data only)
    const storedLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]')
    setLogs(storedLogs)
  }, [])

  useEffect(() => {
    let filtered = [...logs]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(log => log.type === typeFilter)
    }

    // Date filter
    if (dateFilter === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      filtered = filtered.filter(log => new Date(log.timestamp) >= today)
    } else if (dateFilter === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(log => new Date(log.timestamp) >= weekAgo)
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, typeFilter, dateFilter])

  const getTypeIcon = (type) => {
    const icons = {
      user_action: '👤',
      provider_action: '🏥',
      system_event: '⚙️',
      security_event: '🔒',
      admin_action: '👑',
    }
    return icons[type] || '📝'
  }

  const getSeverityBadge = (severity) => {
    const badges = {
      high: { class: 'severity-high', label: 'High' },
      medium: { class: 'severity-medium', label: 'Medium' },
      low: { class: 'severity-low', label: 'Low' },
    }
    return badges[severity] || badges.low
  }

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Type', 'Action', 'User', 'IP Address', 'Details', 'Severity'],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.type,
        log.action,
        log.user,
        log.ipAddress,
        log.details,
        log.severity,
      ]),
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="admin-audit-log">
      <div className="audit-log-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Complete activity tracking and system event log</p>
        </div>
        <div className="header-actions">
          <button className="action-button secondary" onClick={exportLogs}>
            <span className="button-icon">📥</span>
            Export Logs
          </button>
          <button className="action-button primary">
            <span className="button-icon">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      <div className="audit-stats">
        <div className="stat-card">
          <span className="stat-icon">📝</span>
          <div className="stat-content">
            <span className="stat-value">{logs.length}</span>
            <span className="stat-label">Total Events</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔒</span>
          <div className="stat-content">
            <span className="stat-value">{logs.filter(l => l.type === 'security_event').length}</span>
            <span className="stat-label">Security Events</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚠️</span>
          <div className="stat-content">
            <span className="stat-value">{logs.filter(l => l.severity === 'high').length}</span>
            <span className="stat-label">High Severity</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <div className="stat-content">
            <span className="stat-value">
              {logs.filter(l => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return new Date(l.timestamp) >= today
              }).length}
            </span>
            <span className="stat-label">Today</span>
          </div>
        </div>
      </div>

      <div className="audit-filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="user_action">User Actions</option>
            <option value="provider_action">Provider Actions</option>
            <option value="system_event">System Events</option>
            <option value="security_event">Security Events</option>
            <option value="admin_action">Admin Actions</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
          </select>
        </div>
      </div>

      <div className="audit-log-container">
        <div className="audit-log-list">
          {filteredLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No audit logs found</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const severity = getSeverityBadge(log.severity)
              return (
                <div key={log.id} className={`audit-log-item ${log.severity}`}>
                  <div className="log-icon">{getTypeIcon(log.type)}</div>
                  <div className="log-content">
                    <div className="log-header">
                      <span className="log-action">{log.action}</span>
                      <span className={`severity-badge ${severity.class}`}>{severity.label}</span>
                    </div>
                    <div className="log-details">
                      <span className="log-user">{log.user}</span>
                      <span className="log-separator">•</span>
                      <span className="log-ip">{log.ipAddress}</span>
                      <span className="log-separator">•</span>
                      <span className="log-type">{log.type.replace('_', ' ')}</span>
                    </div>
                    <div className="log-description">{log.details}</div>
                    <div className="log-timestamp">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminAuditLog




