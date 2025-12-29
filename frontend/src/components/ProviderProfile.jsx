import React, { useState, useEffect } from 'react'
import WalletConnect from './WalletConnect'
import './ProviderProfile.css'

const ProviderProfile = ({ onNavigateToAvailability, onNavigateToNotifications, onNavigateToPaymentMethods }) => {
  const [profileData, setProfileData] = useState({
    fullName: 'Dr. Maya Patel',
    email: 'maya.patel@aarohaa.com',
    phone: '+1 234 567 8900',
    title: 'Licensed Therapist',
    specialization: 'Anxiety, Stress Management, Mindfulness',
    bio: 'Experienced therapist specializing in anxiety, stress management, and mindfulness practices.',
    hourlyRate: 180, // $3/min = $180/hour
  })

  const [walletData, setWalletData] = useState({
    address: '',
    balance: '',
    network: 'Solana',
    isConnected: false,
  })

  useEffect(() => {
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
              <div className="provider-field-value">{profileData.fullName}</div>
            </div>
            <div className="provider-profile-field">
              <label>Professional Title</label>
              <div className="provider-field-value">{profileData.title}</div>
            </div>
            <div className="provider-profile-field">
              <label>Email Address</label>
              <div className="provider-field-value">{profileData.email}</div>
            </div>
            <div className="provider-profile-field">
              <label>Phone Number</label>
              <div className="provider-field-value">{profileData.phone}</div>
            </div>
            <div className="provider-profile-field full-width">
              <label>Specialization</label>
              <div className="provider-field-value">{profileData.specialization}</div>
            </div>
            <div className="provider-profile-field full-width">
              <label>Bio</label>
              <div className="provider-field-value">{profileData.bio}</div>
            </div>
            <div className="provider-profile-field">
              <label>Hourly Rate</label>
              <div className="provider-field-value">${profileData.hourlyRate}/hour</div>
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

