import React, { useState, useEffect } from 'react'
import WalletConnect from './WalletConnect'
import providerService from '../services/providerService'
import userService from '../services/userService'
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
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [walletData, setWalletData] = useState({
    address: '',
    balance: '',
    network: 'Solana',
    isConnected: false,
  })

  useEffect(() => {
    const fetchProviderProfile = async () => {
      setIsLoading(true)
      setError('')
      try {
        const response = await providerService.getProviderProfile()
        console.log('ProviderProfile: Received response:', response)
        if (response && response.provider) {
          const provider = response.provider
          console.log('ProviderProfile: Setting profile data:', provider)
          setProfileData({
            fullName: provider.name || '',
            email: provider.email || '',
            phone: provider.phone || '',
            title: provider.title || '',
            specialization: provider.specialty || '',
            bio: provider.bio || '',
            hourlyRate: provider.hourlyRate || 0,
          })
        } else {
          console.warn('ProviderProfile: Response missing provider data:', response)
          setError('Profile data not found. Please try refreshing the page.')
        }
      } catch (error) {
        console.error('Error fetching provider profile:', error)
        const errorMessage = error.message || 'Failed to load profile. Please try again.'
        setError(errorMessage)
        // If provider not found, show a helpful message
        if (errorMessage.includes('not found')) {
          setError('Provider profile not found. If you just registered, please refresh the page or contact support.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProviderProfile()

    // Load wallet data
    const savedWallet = localStorage.getItem('walletData')
    if (savedWallet) {
      try {
        const wallet = JSON.parse(savedWallet)
        if (wallet.address && wallet.isConnected) {
          if (window.solana && window.solana.isConnected) {
            setWalletData(wallet)
          } else {
            localStorage.removeItem('walletData')
            setWalletData({
              address: '',
              balance: '',
              network: 'Solana',
              isConnected: false,
            })
          }
        }
      } catch (error) {
        console.error('Error loading wallet data:', error)
      }
    }
  }, [])

  const handleWalletConnected = (walletData) => {
    setWalletData(walletData)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      const updateData = {
        name: profileData.fullName,
        phone: profileData.phone,
        title: profileData.title,
        specialty: profileData.specialization,
        bio: profileData.bio,
        hourlyRate: profileData.hourlyRate,
      }
      
      const response = await providerService.updateProviderProfile(updateData)
      if (response && response.provider) {
        // Update local state with the response
        const updatedProvider = response.provider
        setProfileData({
          fullName: updatedProvider.name || profileData.fullName,
          email: updatedProvider.email || profileData.email,
          phone: updatedProvider.phone || profileData.phone,
          title: updatedProvider.title || profileData.title,
          specialization: updatedProvider.specialty || profileData.specialization,
          bio: updatedProvider.bio || profileData.bio,
          hourlyRate: updatedProvider.hourlyRate || profileData.hourlyRate,
        })
        setIsEditing(false)
        setError('')
        alert('Profile updated successfully! Changes are saved to the database.')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setError('Failed to save profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="provider-profile">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="provider-profile">
      <div className="provider-profile-header">
        <h1 className="provider-profile-title">Provider Profile</h1>
        {!isEditing ? (
          <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
            <span>✏️</span>
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="profile-action-buttons">
            <button className="cancel-profile-btn" onClick={() => setIsEditing(false)}>
              <span>✕</span>
              <span>Cancel</span>
            </button>
            <button className="save-profile-btn" onClick={handleSave} disabled={isSaving}>
              <span>{isSaving ? '⏳' : '💾'}</span>
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message" style={{ color: '#c33', padding: '10px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Professional Information Section */}
      <div className="provider-profile-section">
        <h2 className="provider-section-title">Professional Information</h2>
        <div className="provider-profile-card">
          <div className="provider-profile-grid">
            <div className="provider-profile-field">
              <label>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  className="provider-input"
                />
              ) : (
                <div className="provider-field-value">{profileData.fullName || 'Not set'}</div>
              )}
            </div>
            <div className="provider-profile-field">
              <label>Professional Title</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.title}
                  onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                  className="provider-input"
                  placeholder="e.g., Licensed Therapist"
                />
              ) : (
                <div className="provider-field-value">{profileData.title || 'Not set'}</div>
              )}
            </div>
            <div className="provider-profile-field">
              <label>Email Address</label>
              <div className="provider-field-value">{profileData.email || 'Not set'}</div>
            </div>
            <div className="provider-profile-field">
              <label>Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="provider-input"
                  placeholder="+1 234 567 8900"
                />
              ) : (
                <div className="provider-field-value">{profileData.phone || 'Not set'}</div>
              )}
            </div>
            <div className="provider-profile-field full-width">
              <label>Specialization</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.specialization}
                  onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                  className="provider-input"
                  placeholder="e.g., Anxiety, Stress Management, Mindfulness"
                />
              ) : (
                <div className="provider-field-value">{profileData.specialization || 'Not set'}</div>
              )}
            </div>
            <div className="provider-profile-field full-width">
              <label>Bio</label>
              {isEditing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className="provider-textarea"
                  rows="4"
                  placeholder="Describe your expertise and experience..."
                />
              ) : (
                <div className="provider-field-value">{profileData.bio || 'Not set'}</div>
              )}
            </div>
            <div className="provider-profile-field">
              <label>Hourly Rate ($)</label>
              {isEditing ? (
                <input
                  type="number"
                  value={profileData.hourlyRate}
                  onChange={(e) => setProfileData({ ...profileData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  className="provider-input"
                  min="0"
                  step="0.01"
                />
              ) : (
                <div className="provider-field-value">${profileData.hourlyRate}/hour</div>
              )}
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
              <div className="provider-field-value">{walletData.network}</div>
            </div>
            {walletData.isConnected && walletData.address ? (
              <>
                <div className="provider-wallet-field">
                  <label>Wallet Address</label>
                  <div className="provider-field-value provider-wallet-address">
                    {walletData.address}
                    <button
                      className="provider-copy-btn"
                      onClick={() => copyToClipboard(walletData.address)}
                      title="Copy address"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className="provider-wallet-field">
                  <label>Balance</label>
                  <div className="provider-field-value provider-balance-value">{walletData.balance || '0.0000 SOL'}</div>
                </div>
              </>
            ) : (
              <div className="provider-wallet-not-connected">
                <p>Wallet not connected. Connect your Solana wallet to receive payments.</p>
                <WalletConnect onWalletConnected={handleWalletConnected} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="provider-profile-section">
        <h2 className="provider-section-title">Settings</h2>
        <div className="provider-profile-card">
          <div className="provider-settings-list">
            <div className="provider-setting-item">
              <div className="provider-setting-info">
                <h3 className="provider-setting-title">Availability</h3>
                <p className="provider-setting-description">Manage your working hours and availability</p>
              </div>
              <button className="provider-setting-btn" onClick={onNavigateToAvailability}>Manage</button>
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

