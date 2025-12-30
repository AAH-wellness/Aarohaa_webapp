import React, { useState, useEffect } from 'react'
import WalletConnect from './WalletConnect'
import userService from '../services/userService'
import './Profile.css'

const Profile = () => {
  const [kycData, setKycData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [editedAddress, setEditedAddress] = useState('')
  const [isSavingAddress, setIsSavingAddress] = useState(false)

  const [walletData, setWalletData] = useState({
    address: '',
    balance: '',
    network: 'Solana',
    isConnected: false,
  })

  // Fetch user profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      try {
        // Fetch from backend API only
        const response = await userService.getProfile()
        if (response && response.user) {
          setKycData({
            fullName: response.user.name || '',
            email: response.user.email || '',
            phone: response.user.phone || '',
            address: response.user.address || '',
          })
        } else {
          // No user data available
          setKycData({
            fullName: '',
            email: '',
            phone: '',
            address: '',
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        // Show empty state on error
        setKycData({
          fullName: '',
          email: '',
          phone: '',
          address: '',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
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

  // Handle address editing
  const handleEditAddress = () => {
    setEditedAddress(kycData.address)
    setIsEditingAddress(true)
  }

  const handleCancelEditAddress = () => {
    setIsEditingAddress(false)
    setEditedAddress('')
  }

  const handleSaveAddress = async () => {
    if (!editedAddress.trim()) {
      alert('Address cannot be empty')
      return
    }

    setIsSavingAddress(true)
    try {
      // Update address via backend
      const response = await userService.updateProfile({ address: editedAddress.trim() })
      
      if (response && response.user) {
        setKycData(prev => ({
          ...prev,
          address: response.user.address || editedAddress.trim()
        }))
        setIsEditingAddress(false)
        alert('Address updated successfully!')
      } else {
        // Update local state even if response format is unexpected
        setKycData(prev => ({
          ...prev,
          address: editedAddress.trim()
        }))
        setIsEditingAddress(false)
        alert('Address updated!')
      }
    } catch (error) {
      console.error('Error updating address:', error)
      alert('Failed to update address. Please try again.')
    } finally {
      setIsSavingAddress(false)
    }
  }

  if (isLoading) {
    return (
      <div className="profile">
        <h1 className="profile-title">Profile</h1>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile">
      <h1 className="profile-title">Profile</h1>

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
              <div className="field-value">{kycData.fullName}</div>
            </div>
            <div className="profile-field">
              <label>Email Address</label>
              <div className="field-value">{kycData.email}</div>
            </div>
            <div className="profile-field">
              <label>Phone Number</label>
              <div className="field-value">{kycData.phone || 'Not provided'}</div>
            </div>
            <div className="profile-field full-width">
              <label>
                Address
                {!isEditingAddress && (
                  <button
                    onClick={handleEditAddress}
                    style={{
                      marginLeft: '10px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      backgroundColor: '#0e4826',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}
              </label>
              {isEditingAddress ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea
                    value={editedAddress}
                    onChange={(e) => setEditedAddress(e.target.value)}
                    placeholder="Enter your address"
                    rows={3}
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      minHeight: '80px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleSaveAddress}
                      disabled={isSavingAddress}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#0e4826',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isSavingAddress ? 'wait' : 'pointer',
                        fontSize: '14px',
                        opacity: isSavingAddress ? 0.7 : 1
                      }}
                    >
                      {isSavingAddress ? 'Saving...' : '💾 Save'}
                    </button>
                    <button
                      onClick={handleCancelEditAddress}
                      disabled={isSavingAddress}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ccc',
                        color: '#333',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isSavingAddress ? 'wait' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Cancel
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
