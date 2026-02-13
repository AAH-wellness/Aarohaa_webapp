import React, { useState, useEffect, useRef } from 'react'
import WalletConnect from './WalletConnect'
import { userService } from '../services'
import PasswordResetSuccessModal from './PasswordResetSuccessModal'
import { getUserAvatarUrl } from '../utils/avatarUtils'
import UserPaymentMethods from './UserPaymentMethods'
import './Profile.css'

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const ACCEPT_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif'

const Profile = () => {
  const [kycData, setKycData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    profilePhoto: null,
    gender: null,
  })
  const [loading, setLoading] = useState(true)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [editedAddress, setEditedAddress] = useState('')
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [authMethod, setAuthMethod] = useState('email')
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState(null)
  const [genderSaving, setGenderSaving] = useState(false)
  const fileInputRef = useRef(null)
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

  // Helper function to get fallback user data from localStorage
  const getFallbackUserData = () => {
    try {
      const currentUser = localStorage.getItem('currentUser')
      const userData = localStorage.getItem('userData')
      
      if (currentUser) {
        const user = JSON.parse(currentUser)
        return {
          fullName: user.name || user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          dateOfBirth: user.dateOfBirth || user.date_of_birth || '',
          address: user.address || '',
          profilePhoto: user.profilePhoto || user.profile_photo || null,
          gender: user.gender || null,
        }
      }
      
      if (userData) {
        const data = JSON.parse(userData)
        return {
          fullName: data.fullName || data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          dateOfBirth: data.dateOfBirth || '',
          address: data.address || '',
          profilePhoto: null,
          gender: null,
        }
      }
    } catch (error) {
      console.error('Error getting fallback user data:', error)
    }
    return null
  }

  // Fetch user profile data from backend
  useEffect(() => {
    let isMounted = true
    
    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        const profile = await userService.getProfile()
        
        if (!isMounted) return
        
        if (profile && profile.user) {
          setKycData({
            fullName: profile.user.name || '',
            email: profile.user.email || '',
            phone: profile.user.phone || '',
            dateOfBirth: profile.user.dateOfBirth || '',
            address: profile.user.address || '',
            profilePhoto: profile.user.profilePhoto || null,
            gender: profile.user.gender || null,
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
        } else {
          console.warn('Profile data structure unexpected:', profile)
          // Try fallback: get from localStorage directly
          if (isMounted) {
            const fallbackData = getFallbackUserData()
            if (fallbackData) {
              setKycData(fallbackData)
            } else {
              setKycData({
                fullName: '',
                email: '',
                phone: '',
                dateOfBirth: '',
                address: '',
                profilePhoto: null,
                gender: null,
              })
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        if (!isMounted) return
        
        // Try fallback: get from localStorage directly
        const fallbackData = getFallbackUserData()
        if (fallbackData) {
          setKycData(fallbackData)
        } else {
          // Set default data so component can still render even on error
          setKycData({
            fullName: '',
            email: '',
            phone: '',
            dateOfBirth: '',
            address: '',
            profilePhoto: null,
            gender: null,
          })
        }
        
        // If error, try to get from token (fallback)
        const token = localStorage.getItem('authToken')
        if (token) {
          // Token exists but profile fetch failed - show error
          console.error('Failed to load profile data. Token exists but fetch failed.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUserProfile()
    
    return () => {
      isMounted = false
    }
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
  const [showPasswordResetSuccess, setShowPasswordResetSuccess] = useState(false)
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
    
    // Show premium success modal instead of alert
    setShowPasswordReset(false)
    setShowPasswordResetSuccess(true)
    
    // Reset form
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
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
          dateOfBirth: response.user.dateOfBirth,
          profilePhoto: response.user.profilePhoto || prev.profilePhoto,
          gender: response.user.gender || prev.gender,
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
            profilePhoto: profile.user.profilePhoto || null,
            gender: profile.user.gender || null,
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

  const genderDisplayLabel = (value) => {
    if (!value) return 'Not provided'
    const labels = { male: 'Male', female: 'Female', other: 'Other' }
    return labels[value] || value
  }

  const handleGenderChange = async (e) => {
    const value = e.target.value || null
    const toSave = value && ['male', 'female', 'other'].includes(value) ? value : null
    if (!toSave) return
    
    // Store previous gender for rollback
    const previousGender = kycData.gender
    setKycData((prev) => ({ ...prev, gender: toSave }))
    
    try {
      setGenderSaving(true)
      const response = await userService.updateProfile({ gender: toSave })
      // Update with response if available
      if (response?.user?.gender !== undefined) {
        setKycData((prev) => ({ ...prev, gender: response.user.gender }))
      }
    } catch (err) {
      console.error('Failed to update gender:', err)
      alert('Failed to update gender. Please try again.')
      // Rollback to previous gender
      setKycData((prev) => ({ ...prev, gender: previousGender }))
    } finally {
      setGenderSaving(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError(null)
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file (JPEG, PNG, WebP, or GIF).')
      return
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotoError('Image must be 2MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result
      try {
        setPhotoUploading(true)
        const response = await userService.updateProfile({ profilePhoto: dataUrl })
        if (response?.user?.profilePhoto !== undefined) {
          setKycData((prev) => ({ ...prev, profilePhoto: response.user.profilePhoto }))
        } else {
          setKycData((prev) => ({ ...prev, profilePhoto: dataUrl }))
        }
      } catch (err) {
        console.error('Profile photo update failed:', err)
        setPhotoError('Failed to save photo. Please try again.')
      } finally {
        setPhotoUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <div className="profile">
        <h1 className="profile-title">Profile</h1>
        <div className="loading-message">Loading profile data...</div>
      </div>
    )
  }

  // Safety check: ensure getUserAvatarUrl is available
  let avatarUrl = 'https://api.dicebear.com/8.x/personas/svg?seed=person' // Default fallback
  try {
    if (typeof getUserAvatarUrl === 'function') {
      const photoUrl = getUserAvatarUrl(kycData?.profilePhoto, kycData?.gender)
      if (photoUrl && typeof photoUrl === 'string') {
        avatarUrl = photoUrl
      }
    }
  } catch (error) {
    console.error('Error getting avatar URL:', error)
    // Use default fallback URL if function fails
    avatarUrl = 'https://api.dicebear.com/8.x/personas/svg?seed=person'
  }

  // Ensure kycData exists
  const safeKycData = kycData || {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    profilePhoto: null,
    gender: null,
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

      {/* Profile Photo Section */}
      <div className="profile-section">
        <h2 className="section-title">Profile Photo</h2>
        <div className="profile-card profile-photo-card">
          <div className="profile-photo-wrap">
            <div className="profile-photo-preview">
              <img
                src={avatarUrl}
                alt="Profile"
                className={`profile-photo-img ${!safeKycData.profilePhoto ? 'profile-photo-default' : ''}`}
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  try {
                    const fallbackUrl = getUserAvatarUrl ? getUserAvatarUrl(null, 'other') : 'https://api.dicebear.com/8.x/personas/svg?seed=person'
                    if (e.target.src !== fallbackUrl) {
                      e.target.src = fallbackUrl
                    }
                  } catch (err) {
                    console.error('Error in image onError handler:', err)
                    e.target.src = 'https://api.dicebear.com/8.x/personas/svg?seed=person'
                  }
                }}
              />
            </div>
            <div className="profile-photo-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_IMAGE_TYPES}
                onChange={handlePhotoChange}
                className="profile-photo-input"
                aria-label="Upload profile photo"
                disabled={photoUploading}
              />
              <button
                type="button"
                className="profile-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
              >
                {photoUploading ? 'Uploading…' : safeKycData.profilePhoto ? 'Change photo' : 'Upload photo'}
              </button>
              <p className="profile-photo-hint">JPEG, PNG, WebP or GIF. Max 2MB.</p>
              {photoError && <p className="profile-photo-error">{photoError}</p>}
            </div>
          </div>
        </div>
      </div>

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
              <div className="field-value">{safeKycData.fullName || 'Not provided'}</div>
            </div>
            <div className="profile-field">
              <label>Email Address</label>
              <div className="field-value">{safeKycData.email || 'Not provided'}</div>
            </div>
            <div className="profile-field">
              <label>Phone Number</label>
              <div className="field-value">{safeKycData.phone || 'Not provided'}</div>
            </div>
            <div className="profile-field">
              <label>Date of Birth</label>
              <div className="field-value">{safeKycData.dateOfBirth || 'Not provided'}</div>
            </div>
            <div className="profile-field profile-field-gender">
              <label>Gender</label>
              {safeKycData.gender ? (
                <div className="field-value">{genderDisplayLabel(safeKycData.gender)}</div>
              ) : (
                <div className="profile-gender-edit">
                  <select
                    className="profile-field-select"
                    value={safeKycData.gender || ''}
                    onChange={handleGenderChange}
                    disabled={genderSaving}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {genderSaving && <span style={{ fontSize: '12px', color: '#666' }}>Saving...</span>}
                </div>
              )}
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
                <div className="field-value">{safeKycData.address || 'Not provided'}</div>
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
            <div className="coming-soon-placeholder" style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: '#666',
              fontSize: '16px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#333' }}>Coming Soon</div>
              <div style={{ fontSize: '14px' }}>Wallet functionality will be available soon</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="profile-section">
        <div className="profile-card">
          <UserPaymentMethods />
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

      {/* Password Reset Success Modal */}
      {showPasswordResetSuccess && (
        <PasswordResetSuccessModal
          onClose={() => setShowPasswordResetSuccess(false)}
        />
      )}
    </div>
  )
}

export default Profile
