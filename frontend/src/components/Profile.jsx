import React, { useState, useEffect } from 'react'
import WalletConnect from './WalletConnect'
import { userService } from '../services'
import './Profile.css'

const Profile = () => {
  const [kycData, setKycData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
  })
  const [loading, setLoading] = useState(true)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [editedAddress, setEditedAddress] = useState('')
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [authMethod, setAuthMethod] = useState('email')
  const [showGoogleProfileForm, setShowGoogleProfileForm] = useState(false)
  const [googleProfileForm, setGoogleProfileForm] = useState({
    name: '',
    dateOfBirth: '',
    phone: ''
  })
  const [isSubmittingGoogleProfile, setIsSubmittingGoogleProfile] = useState(false)

  const [walletData, setWalletData] = useState({
    address: '',
    balance: '',
    network: 'Solana',
    isConnected: false,
  })

  // Fetch user profile data from backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        const profile = await userService.getProfile()
        
        if (profile.user) {
          setKycData({
            fullName: profile.user.name || '',
            email: profile.user.email || '',
            phone: profile.user.phone || '',
            dateOfBirth: profile.user.dateOfBirth || '',
            address: profile.user.address || '',
          })
          setEditedAddress(profile.user.address || '')
          setProfileIncomplete(profile.user.profileIncomplete || false)
          setAuthMethod(profile.user.authMethod || 'email')
          
          // If profile is incomplete and user logged in via Google, show form
          if (profile.user.profileIncomplete && profile.user.authMethod === 'google') {
            setShowGoogleProfileForm(true)
            setGoogleProfileForm({
              name: profile.user.name || '',
              dateOfBirth: profile.user.dateOfBirth || '',
              phone: profile.user.phone || ''
            })
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        // If error, try to get from token (fallback)
        const token = localStorage.getItem('authToken')
        if (token) {
          // Token exists but profile fetch failed - show error
          alert('Failed to load profile data. Please try refreshing the page.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  // Check if wallet is connected on component mount
  useEffect(() => {
    // Check localStorage for wallet connection status
    const savedWallet = localStorage.getItem('walletData')
    if (savedWallet) {
      try {
        const wallet = JSON.parse(savedWallet)
        if (wallet.address && wallet.isConnected) {
          // Verify wallet is still connected
          if (window.solana && window.solana.isConnected) {
            setWalletData(wallet)
          } else {
            // Clear if not actually connected
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
    
    // Listen for wallet disconnect events
    const handleDisconnect = () => {
      setWalletData({
        address: '',
        balance: '',
        network: 'Solana',
        isConnected: false,
      })
      localStorage.removeItem('walletData')
    }

    // Listen for account changes
    const handleAccountChange = (publicKey) => {
      if (publicKey) {
        // Account changed, refresh wallet data
        const savedWallet = localStorage.getItem('walletData')
        if (savedWallet) {
          const wallet = JSON.parse(savedWallet)
          setWalletData({
            ...wallet,
            address: publicKey.toString(),
          })
          localStorage.setItem('walletData', JSON.stringify({
            ...wallet,
            address: publicKey.toString(),
          }))
        }
      } else {
        handleDisconnect()
      }
    }

    if (window.solana) {
      window.solana.on('disconnect', handleDisconnect)
      window.solana.on('accountChanged', handleAccountChange)
    }

    return () => {
      if (window.solana) {
        window.solana.off('disconnect', handleDisconnect)
        window.solana.off('accountChanged', handleAccountChange)
      }
    }
  }, [])

  // Handle wallet connection
  const handleWalletConnected = (walletData) => {
    setWalletData(walletData)
  }

  // Determine verification status based on wallet connection
  const verificationStatus = walletData.isConnected && walletData.address ? 'Verified' : 'Not Verified'

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()

    if (!passwordForm.currentPassword) {
      alert('Please enter your current password')
      return
    }

    if (!passwordForm.newPassword) {
      alert('Please enter a new password')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      alert('New password must be at least 8 characters long')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitting(false)
    alert('Password reset successfully!')
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setShowPasswordReset(false)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const handleEditAddress = () => {
    setIsEditingAddress(true)
    setEditedAddress(kycData.address)
  }

  const handleCancelEditAddress = () => {
    setIsEditingAddress(false)
    setEditedAddress(kycData.address)
  }

  const handleSaveAddress = async () => {
    if (!editedAddress.trim()) {
      alert('Address cannot be empty')
      return
    }

    setIsSavingAddress(true)
    try {
      // Update profile with new address
      const updatedProfile = await userService.updateProfile({
        address: editedAddress.trim()
      })

      if (updatedProfile.user) {
        setKycData(prev => ({
          ...prev,
          address: updatedProfile.user.address || editedAddress.trim()
        }))
        setIsEditingAddress(false)
        alert('Address updated successfully!')
      }
    } catch (error) {
      console.error('Error updating address:', error)
      alert('Failed to update address. Please try again.')
    } finally {
      setIsSavingAddress(false)
    }
  }

  const handleGoogleProfileChange = (e) => {
    const { name, value } = e.target
    setGoogleProfileForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCompleteGoogleProfile = async (e) => {
    e.preventDefault()

    if (!googleProfileForm.name.trim()) {
      alert('Please enter your name')
      return
    }

    if (!googleProfileForm.dateOfBirth) {
      alert('Please enter your date of birth')
      return
    }

    if (!googleProfileForm.phone.trim()) {
      alert('Please enter your phone number')
      return
    }

    setIsSubmittingGoogleProfile(true)
    try {
      const response = await userService.completeGoogleProfile({
        name: googleProfileForm.name.trim(),
        dateOfBirth: googleProfileForm.dateOfBirth,
        phone: googleProfileForm.phone.trim()
      })

      if (response.user) {
        setKycData(prev => ({
          ...prev,
          fullName: response.user.name,
          phone: response.user.phone,
          dateOfBirth: response.user.dateOfBirth
        }))
        setProfileIncomplete(false)
        setShowGoogleProfileForm(false)
        localStorage.removeItem('profileIncomplete')
        alert('Profile completed successfully!')
        
        // Refresh profile data
        const profile = await userService.getProfile()
        if (profile.user) {
          setKycData({
            fullName: profile.user.name || '',
            email: profile.user.email || '',
            phone: profile.user.phone || '',
            dateOfBirth: profile.user.dateOfBirth || '',
            address: profile.user.address || '',
          })
        }
      }
    } catch (error) {
      console.error('Error completing Google profile:', error)
      alert('Failed to complete profile. Please try again.')
    } finally {
      setIsSubmittingGoogleProfile(false)
    }
  }

  if (loading) {
    return (
      <div className="profile">
        <h1 className="profile-title">Profile</h1>
        <div className="loading-message">Loading profile data...</div>
      </div>
    )
  }

  return (
    <div className="profile">
      <h1 className="profile-title">Profile</h1>

      {/* Google Profile Completion Form */}
      {showGoogleProfileForm && profileIncomplete && authMethod === 'google' && (
        <div className="profile-section">
          <div className="profile-card google-profile-completion">
            <h2 className="section-title">Complete Your Profile</h2>
            <p className="completion-message">
              Please provide the following information to complete your profile:
            </p>
            <form onSubmit={handleCompleteGoogleProfile} className="google-profile-form">
              <div className="form-group">
                <label htmlFor="google-name">Full Name *</label>
                <input
                  type="text"
                  id="google-name"
                  name="name"
                  value={googleProfileForm.name}
                  onChange={handleGoogleProfileChange}
                  className="form-input"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="google-dob">Date of Birth *</label>
                <input
                  type="date"
                  id="google-dob"
                  name="dateOfBirth"
                  value={googleProfileForm.dateOfBirth}
                  onChange={handleGoogleProfileChange}
                  className="form-input"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label htmlFor="google-phone">Phone Number *</label>
                <input
                  type="tel"
                  id="google-phone"
                  name="phone"
                  value={googleProfileForm.phone}
                  onChange={handleGoogleProfileChange}
                  className="form-input"
                  placeholder="+1234567890"
                  required
                />
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmittingGoogleProfile}
                >
                  {isSubmittingGoogleProfile ? 'Saving...' : 'Complete Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Personal Information Section */}
      <div className="profile-section">
        <h2 className="section-title">Personal Information</h2>
        <div className="profile-card">
          <div className="kyc-status">
            <span className={`status-badge ${verificationStatus.toLowerCase().replace(' ', '-')}`}>
              {verificationStatus}
            </span>
          </div>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Full Name</label>
              <div className="field-value">{kycData.fullName || 'Not provided'}</div>
            </div>
            <div className="profile-field">
              <label>Email Address</label>
              <div className="field-value">{kycData.email || 'Not provided'}</div>
            </div>
            <div className="profile-field">
              <label>Phone Number</label>
              <div className="field-value">{kycData.phone || 'Not provided'}</div>
            </div>
            <div className="profile-field">
              <label>Date of Birth</label>
              <div className="field-value">{kycData.dateOfBirth || 'Not provided'}</div>
            </div>
            <div className="profile-field full-width">
              <div className="address-field-header">
                <label>Address</label>
                {!isEditingAddress ? (
                  <button
                    className="edit-address-btn"
                    onClick={handleEditAddress}
                    title="Edit address"
                  >
                    ✏️ Edit
                  </button>
                ) : null}
              </div>
              {isEditingAddress ? (
                <div className="address-edit-container">
                  <textarea
                    className="address-input"
                    value={editedAddress}
                    onChange={(e) => setEditedAddress(e.target.value)}
                    placeholder="Enter your address"
                    rows={3}
                  />
                  <div className="address-edit-actions">
                    <button
                      className="cancel-address-btn"
                      onClick={handleCancelEditAddress}
                      disabled={isSavingAddress}
                    >
                      Cancel
                    </button>
                    <button
                      className="save-address-btn"
                      onClick={handleSaveAddress}
                      disabled={isSavingAddress}
                    >
                      {isSavingAddress ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="field-value">{kycData.address || 'Not provided'}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="profile-section">
        <h2 className="section-title">Wallet</h2>
        <div className="profile-card">
          <div className="wallet-info">
            <div className="wallet-field">
              <label>Connected Network</label>
              <div className="field-value">{walletData.network}</div>
            </div>
            {walletData.isConnected && walletData.address ? (
              <>
                <div className="wallet-field">
                  <label>Wallet Address</label>
                  <div className="field-value wallet-address">
                    {walletData.address}
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(walletData.address)}
                      title="Copy address"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className="wallet-field">
                  <label>Balance</label>
                  <div className="field-value balance-value">{walletData.balance || '0.0000 SOL'}</div>
                </div>
              </>
            ) : (
              <div className="wallet-not-connected">
                <p>Wallet not connected. Connect your Solana wallet to verify your account.</p>
                <WalletConnect onWalletConnected={handleWalletConnected} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Reset Section */}
      <div className="profile-section">
        <div className="section-header">
          <h2 className="section-title">Security</h2>
          {!showPasswordReset && (
            <button
              className="toggle-password-btn"
              onClick={() => setShowPasswordReset(true)}
            >
              Reset Password
            </button>
          )}
        </div>
        {showPasswordReset && (
          <div className="profile-card">
            <form onSubmit={handlePasswordReset} className="password-reset-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="form-input"
                  placeholder="Enter your current password"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="form-input"
                  placeholder="Enter your new password (min. 8 characters)"
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="form-input"
                  placeholder="Confirm your new password"
                  required
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowPasswordReset(false)
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
