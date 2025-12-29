import React, { useState, useEffect } from 'react'
import './AdminProviders.css'

const AdminProviders = () => {
  const [providers, setProviders] = useState([])
  const [filteredProviders, setFilteredProviders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [verificationFilter, setVerificationFilter] = useState('all')

  useEffect(() => {
    // Load providers from localStorage or mock data
    const mockProviders = [
      { id: 1, name: 'Dr. Maya Patel', email: 'maya.patel@example.com', specialty: 'Yoga Therapy', status: 'verified', appointments: 45, earnings: 2250, joinDate: '2024-01-10' },
      { id: 2, name: 'Sarah Rodriguez', email: 'sarah.rodriguez@example.com', specialty: 'Meditation', status: 'verified', appointments: 38, earnings: 1900, joinDate: '2024-01-15' },
      { id: 3, name: 'James Chen', email: 'james.chen@example.com', specialty: 'Mindfulness', status: 'pending', appointments: 0, earnings: 0, joinDate: '2024-02-20' },
    ]

    const storedProviders = JSON.parse(localStorage.getItem('adminProviders') || '[]')
    setProviders(storedProviders.length > 0 ? storedProviders : mockProviders)
  }, [])

  useEffect(() => {
    let filtered = [...providers]

    if (searchTerm) {
      filtered = filtered.filter(provider =>
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (verificationFilter !== 'all') {
      filtered = filtered.filter(provider => provider.status === verificationFilter)
    }

    setFilteredProviders(filtered)
  }, [providers, searchTerm, verificationFilter])

  const handleVerificationChange = (providerId, newStatus) => {
    const updatedProviders = providers.map(provider =>
      provider.id === providerId ? { ...provider, status: newStatus } : provider
    )
    setProviders(updatedProviders)
    localStorage.setItem('adminProviders', JSON.stringify(updatedProviders))
  }

  return (
    <div className="admin-providers">
      <div className="admin-providers-header">
        <div>
          <h1 className="page-title">Provider Management</h1>
          <p className="page-subtitle">Manage and verify wellness professionals</p>
        </div>
        <button className="action-button primary">
          <span className="button-icon">➕</span>
          Add Provider
        </button>
      </div>

      <div className="providers-filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={verificationFilter}
          onChange={(e) => setVerificationFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Providers</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending Verification</option>
        </select>
      </div>

      <div className="providers-grid">
        {filteredProviders.length === 0 ? (
          <div className="empty-state">No providers found</div>
        ) : (
          filteredProviders.map(provider => (
            <div key={provider.id} className="provider-card-admin">
              <div className="provider-card-header">
                <div className="provider-avatar-admin">{provider.name.charAt(0)}</div>
                <div className="provider-info-admin">
                  <h3 className="provider-name-admin">{provider.name}</h3>
                  <p className="provider-specialty-admin">{provider.specialty}</p>
                </div>
                <div className={`verification-badge verification-${provider.status}`}>
                  {provider.status === 'verified' ? '✓ Verified' : '⏳ Pending'}
                </div>
              </div>
              <div className="provider-details">
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{provider.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Join Date:</span>
                  <span className="detail-value">{new Date(provider.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Appointments:</span>
                  <span className="detail-value highlight">{provider.appointments}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Earnings:</span>
                  <span className="detail-value highlight">${provider.earnings}</span>
                </div>
              </div>
              <div className="provider-actions">
                <select
                  value={provider.status}
                  onChange={(e) => handleVerificationChange(provider.id, e.target.value)}
                  className={`status-select status-${provider.status}`}
                >
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
                <button className="action-btn view">View Profile</button>
                <button className="action-btn edit">Edit</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="providers-stats">
        <div className="stat-card">
          <span className="stat-label">Total Providers</span>
          <span className="stat-value">{providers.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Verified</span>
          <span className="stat-value">{providers.filter(p => p.status === 'verified').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending</span>
          <span className="stat-value">{providers.filter(p => p.status === 'pending').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Earnings</span>
          <span className="stat-value">${providers.reduce((sum, p) => sum + p.earnings, 0)}</span>
        </div>
      </div>
    </div>
  )
}

export default AdminProviders

