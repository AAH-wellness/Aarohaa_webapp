import React, { useState, useEffect } from 'react'
import './AdminUsers.css'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    // Load users from localStorage (real data only)
    const storedUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]')
    setUsers(storedUsers)
  }, [])

  useEffect(() => {
    let filtered = [...users]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.joinDate) - new Date(a.joinDate)
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'appointments') {
        return b.appointments - a.appointments
      }
      return 0
    })

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter, sortBy])

  const handleStatusChange = (userId, newStatus) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, status: newStatus } : user
    )
    setUsers(updatedUsers)
    localStorage.setItem('adminUsers', JSON.stringify(updatedUsers))
  }

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updatedUsers = users.filter(user => user.id !== userId)
      setUsers(updatedUsers)
      localStorage.setItem('adminUsers', JSON.stringify(updatedUsers))
    }
  }

  return (
    <div className="admin-users">
      <div className="admin-users-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage and monitor all platform users</p>
        </div>
        <button className="action-button primary">
          <span className="button-icon">➕</span>
          Add User
        </button>
      </div>

      <div className="users-filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search users by name or email..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="recent">Recent First</option>
            <option value="name">Name A-Z</option>
            <option value="appointments">Most Appointments</option>
          </select>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Join Date</th>
              <th>Appointments</th>
              <th>Wallet Address</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{user.name.charAt(0)}</div>
                      <span className="user-name">{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{new Date(user.joinDate).toLocaleDateString()}</td>
                  <td>
                    <span className="badge appointments-badge">{user.appointments}</span>
                  </td>
                  <td>
                    <span className="wallet-address">{user.wallet}</span>
                  </td>
                  <td>
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      className={`status-select status-${user.status}`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn view" title="View Details">👁️</button>
                      <button className="action-btn edit" title="Edit User">✏️</button>
                      <button className="action-btn delete" title="Delete User" onClick={() => handleDeleteUser(user.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="users-stats">
        <div className="stat-card">
          <span className="stat-label">Total Users</span>
          <span className="stat-value">{users.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Users</span>
          <span className="stat-value">{users.filter(u => u.status === 'active').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Appointments</span>
          <span className="stat-value">{users.reduce((sum, u) => sum + u.appointments, 0)}</span>
        </div>
      </div>
    </div>
  )
}

export default AdminUsers

