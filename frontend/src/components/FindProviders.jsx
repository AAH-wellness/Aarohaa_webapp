import React, { useState, useEffect } from 'react'
import { userService } from '../services'
import './FindProviders.css'

const FindProviders = ({ onBookSession }) => {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true)
        setError(null)
        // Fetch providers from backend database
        const providersList = await userService.getAllProviders({ status: 'ready' })
        setProviders(providersList)
      } catch (err) {
        console.error('Error fetching providers:', err)
        setError('Failed to load providers. Please try again later.')
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [])

  const handleBookSession = (providerId) => {
    if (onBookSession) {
      onBookSession(providerId)
    }
  }

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return 'P'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Helper function to calculate price per minute from hourly rate
  const getPricePerMinute = (hourlyRate) => {
    if (!hourlyRate || hourlyRate === 0) return 0
    return (hourlyRate / 60).toFixed(2)
  }

  if (loading) {
    return (
      <div className="find-providers">
        <h1 className="providers-title">Find Wellness Professionals</h1>
        <div className="loading-message">Loading providers...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="find-providers">
        <h1 className="providers-title">Find Wellness Professionals</h1>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  if (providers.length === 0) {
    return (
      <div className="find-providers">
        <h1 className="providers-title">Find Wellness Professionals</h1>
        <div className="no-providers-message">
          No providers available at the moment. Please check back later.
        </div>
      </div>
    )
  }

  return (
    <div className="find-providers">
      <h1 className="providers-title">Find Wellness Professionals</h1>
      <div className="providers-grid">
        {providers.map((provider) => (
          <div key={provider.id} className="provider-card">
            <div className="provider-header">
              <div className="provider-avatar">{getInitials(provider.name)}</div>
              <div className="provider-info">
                <h3 className="provider-name">{provider.name}</h3>
                <p className="provider-title">{provider.title || provider.specialty || 'Wellness Professional'}</p>
              </div>
              {provider.hourlyRate > 0 && (
                <div className="provider-price">${getPricePerMinute(provider.hourlyRate)}/min</div>
              )}
            </div>
            <div className="provider-rating">
              <span className="rating-star">★</span>
              <span className="rating-value">{provider.rating > 0 ? provider.rating.toFixed(1) : 'N/A'}</span>
              <span className="rating-reviews">({provider.reviewsCount || 0} reviews)</span>
            </div>
            {provider.bio && (
              <p className="provider-description">{provider.bio}</p>
            )}
            {provider.specialty && !provider.bio && (
              <p className="provider-description">Specializes in {provider.specialty}</p>
            )}
            <button 
              className="provider-button"
              onClick={() => handleBookSession(provider.id)}
            >
              Book Session
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FindProviders
