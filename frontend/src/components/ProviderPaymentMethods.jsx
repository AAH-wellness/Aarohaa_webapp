import React, { useState, useEffect } from 'react'
import WalletConnect from './WalletConnect'
import './ProviderPaymentMethods.css'

const ProviderPaymentMethods = ({ onBack }) => {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [bankAccount, setBankAccount] = useState({
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
  })
  const [payoutSchedule, setPayoutSchedule] = useState('weekly')
  const [isSaving, setIsSaving] = useState(false)
  const [walletData, setWalletData] = useState({
    address: '',
    balance: '',
    network: 'Solana',
    isConnected: false,
  })

  useEffect(() => {
    // Load saved data
    const saved = localStorage.getItem('providerPaymentMethods')
    if (saved) {
      setPaymentMethods(JSON.parse(saved))
    }
    const savedBank = localStorage.getItem('providerBankAccount')
    if (savedBank) {
      setBankAccount(JSON.parse(savedBank))
    }
    const savedSchedule = localStorage.getItem('providerPayoutSchedule')
    if (savedSchedule) setPayoutSchedule(savedSchedule)

    // Load wallet data
    const savedWallet = localStorage.getItem('walletData')
    if (savedWallet) {
      try {
        const wallet = JSON.parse(savedWallet)
        if (wallet.address && wallet.isConnected) {
          setWalletData(wallet)
        }
      } catch (error) {
        console.error('Error loading wallet data:', error)
      }
    }
  }, [])

  const handleBankChange = (field, value) => {
    setBankAccount({
      ...bankAccount,
      [field]: value,
    })
  }

  const handleAddBankAccount = () => {
    if (!bankAccount.accountName || !bankAccount.accountNumber || !bankAccount.routingNumber) {
      alert('Please fill in all required fields')
      return
    }

    const newMethod = {
      id: Date.now(),
      type: 'bank',
      ...bankAccount,
      addedAt: new Date().toISOString(),
    }

    setPaymentMethods([...paymentMethods, newMethod])
    setBankAccount({
      accountName: '',
      accountNumber: '',
      routingNumber: '',
      bankName: '',
    })
  }

  const handleRemoveMethod = (id) => {
    if (window.confirm('Are you sure you want to remove this payment method?')) {
      setPaymentMethods(paymentMethods.filter(method => method.id !== id))
    }
  }

  const handleWalletConnected = (wallet) => {
    setWalletData(wallet)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    localStorage.setItem('providerPaymentMethods', JSON.stringify(paymentMethods))
    localStorage.setItem('providerBankAccount', JSON.stringify(bankAccount))
    localStorage.setItem('providerPayoutSchedule', payoutSchedule)
    
    setIsSaving(false)
    alert('Payment settings saved successfully!')
  }

  return (
    <div className="provider-payment-methods">
      <div className="payment-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div>
          <h1 className="payment-title">Payment Methods</h1>
          <p className="payment-subtitle">Manage how you receive payments and earnings</p>
        </div>
      </div>

      <div className="payment-container">
        <div className="payment-section">
          <div className="section-header">
            <h2 className="section-title">Crypto Wallet</h2>
            <p className="section-description">Connect your Solana wallet to receive payments in crypto</p>
          </div>
          
          <div className="wallet-section">
            {walletData.isConnected && walletData.address ? (
              <div className="wallet-connected">
                <div className="wallet-info">
                  <div className="wallet-info-row">
                    <span className="wallet-label">Network:</span>
                    <span className="wallet-value">{walletData.network}</span>
                  </div>
                  <div className="wallet-info-row">
                    <span className="wallet-label">Address:</span>
                    <span className="wallet-value wallet-address">
                      {walletData.address}
                    </span>
                  </div>
                  <div className="wallet-info-row">
                    <span className="wallet-label">Balance:</span>
                    <span className="wallet-value">{walletData.balance || '0.0000 SOL'}</span>
                  </div>
                </div>
                <button className="disconnect-button" onClick={() => {
                  localStorage.removeItem('walletData')
                  setWalletData({
                    address: '',
                    balance: '',
                    network: 'Solana',
                    isConnected: false,
                  })
                }}>
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="wallet-disconnected">
                <p>No wallet connected</p>
                <WalletConnect onWalletConnected={handleWalletConnected} />
              </div>
            )}
          </div>
        </div>

        <div className="payment-section">
          <div className="section-header">
            <h2 className="section-title">Bank Account</h2>
            <p className="section-description">Add bank account for direct deposit</p>
          </div>
          
          <div className="bank-form">
            <div className="form-row">
              <div className="form-field">
                <label>Account Holder Name *</label>
                <input
                  type="text"
                  value={bankAccount.accountName}
                  onChange={(e) => handleBankChange('accountName', e.target.value)}
                  className="form-input"
                  placeholder="John Doe"
                />
              </div>
              <div className="form-field">
                <label>Bank Name *</label>
                <input
                  type="text"
                  value={bankAccount.bankName}
                  onChange={(e) => handleBankChange('bankName', e.target.value)}
                  className="form-input"
                  placeholder="Bank Name"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Account Number *</label>
                <input
                  type="text"
                  value={bankAccount.accountNumber}
                  onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                  className="form-input"
                  placeholder="1234567890"
                />
              </div>
              <div className="form-field">
                <label>Routing Number *</label>
                <input
                  type="text"
                  value={bankAccount.routingNumber}
                  onChange={(e) => handleBankChange('routingNumber', e.target.value)}
                  className="form-input"
                  placeholder="123456789"
                />
              </div>
            </div>
            <button className="add-bank-button" onClick={handleAddBankAccount}>
              Add Bank Account
            </button>
          </div>

          {paymentMethods.length > 0 && (
            <div className="saved-methods">
              <h3 className="saved-methods-title">Saved Payment Methods</h3>
              {paymentMethods.map((method) => (
                <div key={method.id} className="payment-method-card">
                  <div className="method-info">
                    <div className="method-icon">🏦</div>
                    <div className="method-details">
                      <span className="method-name">{method.accountName}</span>
                      <span className="method-number">
                        {method.bankName} • •••• {method.accountNumber.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="remove-method-button"
                    onClick={() => handleRemoveMethod(method.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="payment-section">
          <div className="section-header">
            <h2 className="section-title">Payout Settings</h2>
            <p className="section-description">Choose how often you want to receive payouts</p>
          </div>
          
          <div className="payout-schedule">
            <label>Payout Frequency</label>
            <select
              value={payoutSchedule}
              onChange={(e) => setPayoutSchedule(e.target.value)}
              className="schedule-select"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <p className="schedule-note">
              Payouts will be processed to your default payment method according to the schedule you choose.
            </p>
          </div>
        </div>

        <div className="payment-actions">
          <button className="cancel-button" onClick={onBack}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProviderPaymentMethods

