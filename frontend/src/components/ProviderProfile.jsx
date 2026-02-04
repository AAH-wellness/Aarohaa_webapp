import React, { useState, useEffect, useRef } from 'react'
import { userService } from '../services'
import './ProviderProfile.css'

import { getProviderAvatarUrl } from '../utils/avatarUtils'

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const ACCEPT_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif'

const ProviderProfile = ({ onNavigateToAvailability, onNavigateToNotifications, onNavigateToPaymentMethods }) => {
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    title: '',
    specialization: '',
    bio: '',
    hourlyRate: 0,
    profilePhoto: null,
    gender: null,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState(null)
  const [genderSaving, setGenderSaving] = useState(false)
  const fileInputRef = useRef(null)

  const genderDisplayLabel = (value) => {
    if (!value) return 'Not provided'
    const labels = { male: 'Male', female: 'Female', other: 'Other' }
    return labels[value] || value
  }

  const genderIsPermanent = profileData.gender && ['male', 'female', 'other'].includes(profileData.gender)

  const handleGenderChange = async (e) => {
    const value = e.target.value || null
    const toSave = value && ['male', 'female', 'other'].includes(value) ? value : null
    if (!toSave) return
    setProfileData((prev) => ({ ...prev, gender: toSave }))
    try {
      setGenderSaving(true)
      await userService.updateProviderProfile({ gender: toSave })
    } catch (err) {
      console.error('Failed to update gender:', err)
      setProfileData((prev) => ({ ...prev, gender: profileData.gender }))
    } finally {
      setGenderSaving(false)
    }
  }

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
            profilePhoto: response.provider.profilePhoto || null,
            gender: response.provider?.gender ?? null,
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
        const response = await userService.updateProviderProfile({ profilePhoto: dataUrl })
        if (response?.provider?.profilePhoto !== undefined) {
          setProfileData((prev) => ({ ...prev, profilePhoto: response.provider.profilePhoto }))
        } else {
          setProfileData((prev) => ({ ...prev, profilePhoto: dataUrl }))
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

      {/* Profile Photo Section */}
      <div className="provider-profile-section">
        <h2 className="provider-section-title">Profile Photo</h2>
        <div className="provider-profile-card provider-profile-photo-card">
          <div className="provider-photo-wrap">
            <div className="provider-photo-preview">
              <img
                src={getProviderAvatarUrl(profileData.profilePhoto, profileData.gender)}
                alt="Profile"
                className={`provider-photo-img ${!profileData.profilePhoto ? 'provider-photo-default' : ''}`}
              />
            </div>
            <div className="provider-photo-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_IMAGE_TYPES}
                onChange={handlePhotoChange}
                className="provider-photo-input"
                aria-label="Upload profile photo"
                disabled={photoUploading}
              />
              <button
                type="button"
                className="provider-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
              >
                {photoUploading ? 'Uploading…' : profileData.profilePhoto ? 'Change photo' : 'Upload photo'}
              </button>
              <p className="provider-photo-hint">JPEG, PNG, WebP or GIF. Max 2MB.</p>
              {photoError && <p className="provider-photo-error">{photoError}</p>}
            </div>
          </div>
        </div>
      </div>

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
            <div className="provider-profile-field provider-profile-field-gender full-width">
              <label>Gender</label>
              {genderIsPermanent ? (
                <div className="provider-field-value provider-gender-permanent">
                  {genderDisplayLabel(profileData.gender)}
                </div>
              ) : (
                <div className="provider-gender-edit">
                  <select
                    value={profileData.gender || ''}
                    onChange={handleGenderChange}
                    disabled={genderSaving}
                    className="provider-field-select"
                    aria-label="Gender"
                  >
                    <option value="">Select gender (cannot be changed after saving)</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {genderSaving && <span className="provider-field-saving">Saving…</span>}
                </div>
              )}
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

