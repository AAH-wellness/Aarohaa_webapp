import React, { useState, useEffect } from 'react'
import './AdminProfile.css'

const AdminProfile = () => {
  const [adminData, setAdminData] = useState({
    name: 'Administrator',
    email: '',
    role: 'System Administrator',
    department: 'Platform Management',
    employeeId: '',
    joinDate: '',
    lastLogin: '',
    permissions: [],
    status: 'Active'
  })

  useEffect(() => {
    // Get logged-in admin user details from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    const userData = JSON.parse(localStorage.getItem('userData') || '{}')
    
    // Get last login time
    const lastLoginTime = localStorage.getItem('lastLoginTime')
    
    // Set admin data
    setAdminData({
      name: currentUser.name || userData.fullName || 'Administrator',
      email: currentUser.email || userData.email || '',
      role: 'System Administrator',
      department: 'Platform Management',
      employeeId: currentUser.id || 'ADM-' + Date.now().toString().slice(-6),
      joinDate: userData.joinDate || new Date().toLocaleDateString(),
      lastLogin: lastLoginTime || new Date().toLocaleString(),
      permissions: [
        'Full System Access',
        'User Management',
        'Provider Management',
        'Platform Settings',
        'Analytics & Reports',
        'Audit Log Access',
        'Maintenance Mode Control'
      ],
      status: 'Active'
    })
  }, [])

  const getInitials = (name) => {
    if (!name) return 'AD'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const infoCards = [
    {
      title: 'Employee ID',
      value: adminData.employeeId,
      icon: '🆔',
      color: 'blue'
    },
    {
      title: 'Department',
      value: adminData.department,
      icon: '🏢',
      color: 'green'
    },
    {
      title: 'Status',
      value: adminData.status,
      icon: '✅',
      color: 'green'
    },
    {
      title: 'Join Date',
      value: adminData.joinDate,
      icon: '📅',
      color: 'purple'
    }
  ]

  return (
    <div className="admin-profile">
      <div className="admin-profile-header">
        <h1 className="admin-profile-title">Administrator Profile</h1>
        <p className="admin-profile-subtitle">Corporate-level account information and access details</p>
      </div>

      <div className="admin-profile-content">
        {/* Profile Card Section */}
        <div className="admin-profile-card">
          <div className="admin-profile-avatar-section">
            <div className="admin-profile-avatar-large">
              <span className="admin-avatar-initials">{getInitials(adminData.name)}</span>
              <div className="admin-status-badge">
                <span className="status-dot"></span>
              </div>
            </div>
            <div className="admin-profile-info">
              <h2 className="admin-profile-name">{adminData.name}</h2>
              <p className="admin-profile-role">{adminData.role}</p>
              <p className="admin-profile-email">{adminData.email}</p>
            </div>
          </div>

          <div className="admin-profile-divider"></div>

          <div className="admin-info-grid">
            {infoCards.map((card, index) => (
              <div key={index} className={`admin-info-card admin-info-card-${card.color}`}>
                <div className="admin-info-icon">{card.icon}</div>
                <div className="admin-info-content">
                  <p className="admin-info-label">{card.title}</p>
                  <p className="admin-info-value">{card.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Details Section */}
        <div className="admin-profile-section">
          <h3 className="admin-section-title">Account Details</h3>
          <div className="admin-details-table">
            <div className="admin-detail-row">
              <span className="admin-detail-label">Full Name</span>
              <span className="admin-detail-value">{adminData.name}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Email Address</span>
              <span className="admin-detail-value">{adminData.email}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Role</span>
              <span className="admin-detail-value">{adminData.role}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Department</span>
              <span className="admin-detail-value">{adminData.department}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Employee ID</span>
              <span className="admin-detail-value">{adminData.employeeId}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Account Status</span>
              <span className="admin-detail-value admin-status-active">
                <span className="status-indicator"></span>
                {adminData.status}
              </span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Last Login</span>
              <span className="admin-detail-value">{adminData.lastLogin}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Join Date</span>
              <span className="admin-detail-value">{adminData.joinDate}</span>
            </div>
          </div>
        </div>

        {/* Permissions Section */}
        <div className="admin-profile-section">
          <h3 className="admin-section-title">System Permissions</h3>
          <div className="admin-permissions-grid">
            {adminData.permissions.map((permission, index) => (
              <div key={index} className="admin-permission-card">
                <div className="admin-permission-icon">🔐</div>
                <div className="admin-permission-content">
                  <p className="admin-permission-name">{permission}</p>
                  <span className="admin-permission-badge">Granted</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Section */}
        <div className="admin-profile-section">
          <h3 className="admin-section-title">Security & Access</h3>
          <div className="admin-security-cards">
            <div className="admin-security-card">
              <div className="admin-security-header">
                <span className="admin-security-icon">🔒</span>
                <div>
                  <h4 className="admin-security-title">Two-Factor Authentication</h4>
                  <p className="admin-security-subtitle">Enhanced security for admin access</p>
                </div>
              </div>
              <div className="admin-security-status">
                <span className="admin-security-badge enabled">Enabled</span>
              </div>
            </div>
            <div className="admin-security-card">
              <div className="admin-security-header">
                <span className="admin-security-icon">📊</span>
                <div>
                  <h4 className="admin-security-title">Access Level</h4>
                  <p className="admin-security-subtitle">Full administrative privileges</p>
                </div>
              </div>
              <div className="admin-security-status">
                <span className="admin-security-badge level">Level 5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminProfile

