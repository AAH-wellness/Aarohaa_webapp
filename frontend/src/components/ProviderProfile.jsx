import React, { useState, useEffect } from 'react'
import WalletConnect from './WalletConnect'
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

  const [walletData, setWalletData] = useState({
    address: '',
    balance: '',
    network: 'Solana',
    isConnected: false,
  })

  useEffect(() => {
    // Fetch provider profile from backend
    const fetchProviderProfile = async () => {
      try {
        setIsLoading(true)
        const response = await userService.getProviderProfile()
        
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
        setError(null)
      } catch (error) {
        console.error('Error fetching provider profile:', error)
        setError('Failed to load provider profile. Please try again.')
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

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

