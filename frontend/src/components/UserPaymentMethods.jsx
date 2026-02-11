import React, { useState, useEffect } from 'react'
import { userService } from '../services'
import './UserPaymentMethods.css'

const UserPaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    zipCode: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true)
      const response = await userService.getPaymentMethods()
      if (response.paymentMethods) {
        setPaymentMethods(response.paymentMethods)
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
      // Fallback to localStorage
      const saved = localStorage.getItem('userPaymentMethods')
      if (saved) {
        setPaymentMethods(JSON.parse(saved))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const validateCardForm = () => {
    const errors = {}
    
    // Card number validation (basic - should be 13-19 digits)
    const cardNumber = cardForm.cardNumber.replace(/\s/g, '')
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19 || !/^\d+$/.test(cardNumber)) {
      errors.cardNumber = 'Please enter a valid card number'
    }
    
    // Expiry date validation (MM/YY format)
    if (!cardForm.expiryDate || !/^\d{2}\/\d{2}$/.test(cardForm.expiryDate)) {
      errors.expiryDate = 'Please enter expiry date in MM/YY format'
    } else {
      const [month, year] = cardForm.expiryDate.split('/')
      const expMonth = parseInt(month, 10)
      const expYear = parseInt('20' + year, 10)
      const now = new Date()
      if (expMonth < 1 || expMonth > 12) {
        errors.expiryDate = 'Invalid month'
      } else if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
        errors.expiryDate = 'Card has expired'
      }
    }
    
    // CVV validation (3-4 digits)
    if (!cardForm.cvv || !/^\d{3,4}$/.test(cardForm.cvv)) {
      errors.cvv = 'Please enter a valid CVV'
    }
    
    // Cardholder name validation
    if (!cardForm.cardholderName || cardForm.cardholderName.trim().length < 2) {
      errors.cardholderName = 'Please enter cardholder name'
    }
    
    // ZIP code validation (basic)
    if (!cardForm.zipCode || cardForm.zipCode.trim().length < 3) {
      errors.zipCode = 'Please enter a valid ZIP code'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handleCardInputChange = (field, value) => {
    let formattedValue = value
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value)
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value)
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4)
    }
    
    setCardForm(prev => ({
      ...prev,
      [field]: formattedValue
    }))
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const getCardBrand = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, '')
    if (/^4/.test(number)) return 'Visa'
    if (/^5[1-5]/.test(number)) return 'Mastercard'
    if (/^3[47]/.test(number)) return 'Amex'
    if (/^6(?:011|5)/.test(number)) return 'Discover'
    return 'Card'
  }

  const maskCardNumber = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, '')
    return '•••• •••• •••• ' + number.slice(-4)
  }

  const handleAddCard = async () => {
    if (!validateCardForm()) {
      return
    }

    setIsSaving(true)
    try {
      const cardData = {
        cardNumber: cardForm.cardNumber.replace(/\s/g, ''),
        expiryDate: cardForm.expiryDate,
        cvv: cardForm.cvv,
        cardholderName: cardForm.cardholderName.trim(),
        zipCode: cardForm.zipCode.trim(),
        brand: getCardBrand(cardForm.cardNumber),
        last4: cardForm.cardNumber.replace(/\s/g, '').slice(-4),
      }

      const response = await userService.addPaymentMethod(cardData)
      
      if (response.paymentMethod) {
        setPaymentMethods(prev => [...prev, response.paymentMethod])
        // Reset form
        setCardForm({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: '',
          zipCode: '',
        })
        setIsAddingCard(false)
        alert('Card added successfully!')
      }
    } catch (error) {
      console.error('Error adding card:', error)
      alert('Failed to add card. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetDefault = async (methodId) => {
    try {
      await userService.setDefaultPaymentMethod(methodId)
      setPaymentMethods(prev => 
        prev.map(method => ({
          ...method,
          isDefault: method.id === methodId
        }))
      )
      alert('Default payment method updated')
    } catch (error) {
      console.error('Error setting default payment method:', error)
      alert('Failed to update default payment method')
    }
  }

  const handleRemoveCard = async (methodId) => {
    if (!window.confirm('Are you sure you want to remove this card?')) {
      return
    }

    try {
      await userService.removePaymentMethod(methodId)
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId))
      alert('Card removed successfully')
    } catch (error) {
      console.error('Error removing card:', error)
      alert('Failed to remove card. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="user-payment-methods">
        <div className="loading-message">Loading payment methods...</div>
      </div>
    )
  }

  return (
    <div className="user-payment-methods">
      <div className="payment-methods-header">
        <h2 className="section-title">Payment Methods</h2>
        <p className="section-description">Manage your saved cards for automatic payments after sessions</p>
      </div>

      <div className="payment-methods-content">
        {/* Saved Cards List */}
        <div className="saved-cards-section">
          <h3 className="subsection-title">Saved Cards</h3>
          {paymentMethods.length === 0 ? (
            <div className="no-cards-message">
              <p>No saved cards yet. Add a card to enable automatic payments.</p>
            </div>
          ) : (
            <div className="cards-list">
              {paymentMethods.map((method) => (
                <div key={method.id} className={`card-item ${method.isDefault ? 'default' : ''}`}>
                  <div className="card-info">
                    <div className="card-brand">{method.brand || 'Card'}</div>
                    <div className="card-number">•••• •••• •••• {method.last4 || '0000'}</div>
                    <div className="card-details">
                      <span className="card-expiry">Expires {method.expiryDate}</span>
                      {method.isDefault && <span className="default-badge">Default</span>}
                    </div>
                  </div>
                  <div className="card-actions">
                    {!method.isDefault && (
                      <button
                        className="set-default-btn"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      className="remove-card-btn"
                      onClick={() => handleRemoveCard(method.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Card Form */}
        {!isAddingCard ? (
          <button
            className="add-card-btn"
            onClick={() => setIsAddingCard(true)}
          >
            + Add New Card
          </button>
        ) : (
          <div className="add-card-form">
            <h3 className="subsection-title">Add New Card</h3>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  value={cardForm.cardholderName}
                  onChange={(e) => handleCardInputChange('cardholderName', e.target.value)}
                  placeholder="John Doe"
                  className={formErrors.cardholderName ? 'error' : ''}
                />
                {formErrors.cardholderName && (
                  <span className="error-message">{formErrors.cardholderName}</span>
                )}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Card Number</label>
                <input
                  type="text"
                  value={cardForm.cardNumber}
                  onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  className={formErrors.cardNumber ? 'error' : ''}
                />
                {formErrors.cardNumber && (
                  <span className="error-message">{formErrors.cardNumber}</span>
                )}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="text"
                  value={cardForm.expiryDate}
                  onChange={(e) => handleCardInputChange('expiryDate', e.target.value)}
                  placeholder="MM/YY"
                  maxLength="5"
                  className={formErrors.expiryDate ? 'error' : ''}
                />
                {formErrors.expiryDate && (
                  <span className="error-message">{formErrors.expiryDate}</span>
                )}
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input
                  type="text"
                  value={cardForm.cvv}
                  onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                  placeholder="123"
                  maxLength="4"
                  className={formErrors.cvv ? 'error' : ''}
                />
                {formErrors.cvv && (
                  <span className="error-message">{formErrors.cvv}</span>
                )}
              </div>
              <div className="form-group">
                <label>ZIP Code</label>
                <input
                  type="text"
                  value={cardForm.zipCode}
                  onChange={(e) => handleCardInputChange('zipCode', e.target.value)}
                  placeholder="12345"
                  className={formErrors.zipCode ? 'error' : ''}
                />
                {formErrors.zipCode && (
                  <span className="error-message">{formErrors.zipCode}</span>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setIsAddingCard(false)
                  setCardForm({
                    cardNumber: '',
                    expiryDate: '',
                    cvv: '',
                    cardholderName: '',
                    zipCode: '',
                  })
                  setFormErrors({})
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="save-card-btn"
                onClick={handleAddCard}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Card'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserPaymentMethods
