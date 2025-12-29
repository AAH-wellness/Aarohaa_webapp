import React, { useState, useEffect } from 'react'
import './AdminAppointments.css'

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    // Load appointments from localStorage
    const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]')
    setAppointments(storedAppointments)
  }, [])

  useEffect(() => {
    let filtered = [...appointments]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.serviceType?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter)
    }

    // Date filter
    if (dateFilter === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.dateTime)
        return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
      })
    } else if (dateFilter === 'upcoming') {
      const now = new Date()
      filtered = filtered.filter(apt => new Date(apt.dateTime) > now)
    } else if (dateFilter === 'past') {
      const now = new Date()
      filtered = filtered.filter(apt => new Date(apt.dateTime) < now)
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))

    setFilteredAppointments(filtered)
  }, [appointments, searchTerm, statusFilter, dateFilter])

  const handleStatusChange = (appointmentId, newStatus) => {
    const updatedAppointments = appointments.map(apt =>
      apt.id === appointmentId ? { ...apt, status: newStatus } : apt
    )
    setAppointments(updatedAppointments)
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments))
  }

  const handleCancelAppointment = (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      handleStatusChange(appointmentId, 'cancelled')
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed'
      case 'pending':
        return 'status-pending'
      case 'completed':
        return 'status-completed'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return 'status-pending'
    }
  }

  const stats = {
    total: appointments.length,
    today: appointments.filter(apt => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const aptDate = new Date(apt.dateTime)
      return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }).length,
    upcoming: appointments.filter(apt => new Date(apt.dateTime) > new Date()).length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
  }

  return (
    <div className="admin-appointments">
      <div className="admin-appointments-header">
        <div>
          <h1 className="page-title">Appointment Management</h1>
          <p className="page-subtitle">Oversee and manage all platform appointments</p>
        </div>
        <div className="header-actions">
          <button className="action-button secondary">
            <span className="button-icon">📥</span>
            Export Data
          </button>
          <button className="action-button primary">
            <span className="button-icon">📊</span>
            View Reports
          </button>
        </div>
      </div>

      <div className="appointments-stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Appointments</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Today</span>
          <span className="stat-value">{stats.today}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Upcoming</span>
          <span className="stat-value">{stats.upcoming}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{stats.completed}</span>
        </div>
      </div>

      <div className="appointments-filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by provider, user, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>
      </div>

      <div className="appointments-table-container">
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Provider</th>
              <th>User</th>
              <th>Service</th>
              <th>Duration</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  No appointments found
                </td>
              </tr>
            ) : (
              filteredAppointments.map(apt => (
                <tr key={apt.id}>
                  <td>
                    <div className="datetime-cell">
                      <span className="date">{new Date(apt.dateTime).toLocaleDateString()}</span>
                      <span className="time">{new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{apt.providerName?.charAt(0) || 'P'}</div>
                      <span>{apt.providerName || 'Unknown Provider'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{apt.userName?.charAt(0) || 'U'}</div>
                      <span>{apt.userName || 'Unknown User'}</span>
                    </div>
                  </td>
                  <td>{apt.serviceType || 'Wellness Session'}</td>
                  <td>{apt.duration || '60'} min</td>
                  <td>${apt.amount || '50'}</td>
                  <td>
                    <select
                      value={apt.status || 'pending'}
                      onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                      className={`status-select ${getStatusBadgeClass(apt.status || 'pending')}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn view" title="View Details">👁️</button>
                      <button className="action-btn edit" title="Edit">✏️</button>
                      {apt.status !== 'cancelled' && (
                        <button 
                          className="action-btn cancel" 
                          title="Cancel" 
                          onClick={() => handleCancelAppointment(apt.id)}
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminAppointments




