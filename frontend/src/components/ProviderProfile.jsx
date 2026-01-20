import React, { useState, useEffect } from 'react'
import { userService } from '../services'
import './ProviderProfile.css'

const ProviderProfile = ({ onNavigateToAvailability, onNavigateToNotifications, onNavigateToPaymentMethods }) => {
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    title: '',
    specialization: '',
    bio: '',
    hourlyRate: 0,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    
    // Fetch provider profile from backend
    const fetchProviderProfile = async () => {
      try {
        if (!isMounted) return
        setIsLoading(true)
        const response = await userService.getProviderProfile()
        
        if (!isMounted) return
        
        if (response.provider) {
          setProfileData({
            fullName: response.provider.name || '',
            email: response.provider.email || '',
            phone: response.provider.phone || '',
            title: response.provider.title || '',
            specialization: response.provider.specialty || '',
            bio: response.provider.bio || '',
            hourlyRate: response.provider.hourlyRate || 0,
          })
        }
        if (isMounted) {
          setError(null)
        }
      } catch (error) {
        console.error('Error fetching provider profile:', error)
        if (isMounted) {
          setError('Failed to load provider profile. Please try again.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchProviderProfile()
    
    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="provider-profile">
        <h1 className="provider-profile-title">Provider Profile</h1>
        <div className="provider-profile-card">
          <p>Loading profile data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="provider-profile">
        <h1 className="provider-profile-title">Provider Profile</h1>
        <div className="provider-profile-card">
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="provider-profile">
      <h1 className="provider-profile-title">Provider Profile</h1>

      {/* Professional Information Section */}
      <div className="provider-profile-section">
        <h2 className="provider-section-title">Professional Information</h2>
        <div className="provider-profile-card">
          <div className="provider-profile-grid">
            <div className="provider-profile-field">
              <label>Full Name</label>
              <div className="provider-field-value">{profileData.fullName || 'Not provided'}</div>
            </div>
            <div className="provider-profile-field">
              <label>Professional Title</label>
              <div className="provider-field-value">{profileData.title || 'Not provided'}</div>
            </div>
            <div className="provider-profile-field">
              <label>Email Address</label>
              <div className="provider-field-value">{profileData.email || 'Not provided'}</div>
            </div>
            <div className="provider-profile-field">
              <label>Phone Number</label>
              <div className="provider-field-value">{profileData.phone || 'Not provided'}</div>
            </div>
            <div className="provider-profile-field full-width">
              <label>Specialization</label>
              <div className="provider-field-value">{profileData.specialization || 'Not provided'}</div>
            </div>
            <div className="provider-profile-field full-width">
              <label>Bio</label>
              <div className="provider-field-value">{profileData.bio || 'Not provided'}</div>
            </div>
            <div className="provider-profile-field">
              <label>Hourly Rate</label>
              <div className="provider-field-value">${profileData.hourlyRate || 0}/hour</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="provider-profile-section">
        <h2 className="provider-section-title">Wallet</h2>
        <div className="provider-profile-card">
          <div className="provider-wallet-info">
            <div className="provider-wallet-field">
              <label>Connected Network</label>
              <div className="provider-field-value">Solana</div>
            </div>
            <div className="provider-wallet-not-connected">
              <p>Wallet not connected. Connect your Solana wallet to receive payments.</p>
              <button className="connect-wallet-btn">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="provider-profile-section">
        <h2 className="provider-section-title">Settings</h2>
        {(() => {
          try {
            const raw = localStorage.getItem('lastAppCrash')
            if (!raw) return null
            const crash = JSON.parse(raw)
            if (!crash?.message) return null
            return (
              <p style={{ color: '#dc2626', marginBottom: '12px' }}>
                Last crash: {crash.message}
              </p>
            )
          } catch {
            return null
          }
        })()}
        <div className="provider-profile-card">
          <div className="provider-settings-list">
            <div className="provider-setting-item">
              <div className="provider-setting-info">
                <h3 className="provider-setting-title">Availability</h3>
                <p className="provider-setting-description">Manage your working hours and availability</p>
              </div>
              <button 
                className="provider-setting-btn" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // Debounce rapid clicks - check timestamp
                  const now = Date.now()
                  const lastClick = e.currentTarget.dataset.lastClick
                  if (lastClick && now - parseInt(lastClick, 10) < 500) {
                    return // Ignore rapid clicks
                  }
                  e.currentTarget.dataset.lastClick = now.toString()
                  try {
                    localStorage.setItem('lastAvailabilityNav', new Date().toISOString())
                    localStorage.setItem('availabilitySafeMode', 'true')
                  } catch (storageError) {
                    console.warn('Unable to persist navigation attempt:', storageError)
                  }
                  
                  if (onNavigateToAvailability && typeof onNavigateToAvailability === 'function') {
                    try {
                      onNavigateToAvailability()
                    } catch (error) {
                      console.error('Error navigating to availability:', error)
                    }
                  }
                }}
              >
                Manage
              </button>
            </div>
            <div className="provider-setting-item">
              <div className="provider-setting-info">
                <h3 className="provider-setting-title">Notifications</h3>
                <p className="provider-setting-description">Configure appointment and session notifications</p>
              </div>
              <button className="provider-setting-btn" onClick={onNavigateToNotifications}>Configure</button>
            </div>
            <div className="provider-setting-item">
              <div className="provider-setting-info">
                <h3 className="provider-setting-title">Payment Methods</h3>
                <p className="provider-setting-description">Manage payment and payout settings</p>
              </div>
              <button className="provider-setting-btn" onClick={onNavigateToPaymentMethods}>Manage</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProviderProfile

