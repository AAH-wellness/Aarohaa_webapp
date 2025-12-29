import React, { useState, useEffect } from 'react'
import WalletConnect from './WalletConnect'
import './Profile.css'

const Profile = () => {
  const [kycData, setKycData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    dateOfBirth: '1990-01-15',
    address: '123 Wellness Street, Health City, HC 12345',
  })

  const [walletData, setWalletData] = useState({
    address: '',
    balance: '',
    network: 'Solana',
    isConnected: false,
  })

  // Load user data from localStorage on mount
  useEffect(() => {
    // Load saved user profile data from localStorage if available
    const savedUserData = localStorage.getItem('userProfileData')
    const savedUserDataAlt = localStorage.getItem('userData')
    
    if (savedUserData) {
      try {
        const userData = JSON.parse(savedUserData)
        setKycData(prev => ({
          ...prev,
          fullName: userData.fullName || prev.fullName,
          email: userData.email || prev.email,
          phone: userData.phone || prev.phone,
          dateOfBirth: userData.dateOfBirth || prev.dateOfBirth,
          address: userData.address || prev.address,
        }))
        if (userData.address) {
          setEditedAddress(userData.address)
        }
      } catch (error) {
        console.error('Error loading user profile data:', error)
      }
    } else if (savedUserDataAlt) {
      // Fallback to userData if userProfileData doesn't exist
      try {
        const userData = JSON.parse(savedUserDataAlt)
        setKycData(prev => ({
          ...prev,
          fullName: userData.fullName || prev.fullName,
          email: userData.email || prev.email,
          phone: userData.phone || prev.phone,
          dateOfBirth: userData.dateOfBirth || prev.dateOfBirth,
        }))
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }
    
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
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [editedAddress, setEditedAddress] = useState(kycData.address)

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

  const handleSaveAddress = () => {
    if (!editedAddress.trim()) {
      alert('Address cannot be empty')
      return
    }
    
    // Update the address in state
    setKycData(prev => ({ ...prev, address: editedAddress.trim() }))
    
    // Save to localStorage
    const userProfileData = {
      address: editedAddress.trim(),
      ...kycData,
      address: editedAddress.trim()
    }
    localStorage.setItem('userProfileData', JSON.stringify(userProfileData))
    
    setIsEditingAddress(false)
    alert('Address updated successfully!')
  }

  const handleCancelEditAddress = () => {
    setEditedAddress(kycData.address)
    setIsEditingAddress(false)
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
              <div className="field-value">{kycData.phone}</div>
            </div>
            <div className="profile-field">
              <label>Date of Birth</label>
              <div className="field-value">{kycData.dateOfBirth}</div>
            </div>
            <div className="profile-field full-width">
              <div className="address-field-header">
                <label>Address</label>
                {!isEditingAddress && (
                  <button
                    className="edit-address-btn"
                    onClick={handleEditAddress}
                    title="Edit address"
                  >
                    ✏️ Edit
                  </button>
                )}
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
                    >
                      Cancel
                    </button>
                    <button
                      className="save-address-btn"
                      onClick={handleSaveAddress}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="field-value">{kycData.address}</div>
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
