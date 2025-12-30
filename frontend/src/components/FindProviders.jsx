import React, { useState, useEffect } from 'react'
import providerService from '../services/providerService'
import './FindProviders.css'

const FindProviders = ({ onBookSession }) => {
  const [providers, setProviders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch providers from API (only ready providers with availability set)
        // Backend defaults to status='ready' and only shows providers who have set availability
        // Note: Providers are auto-verified when they set availability
        const providersData = await providerService.getProviders({ status: 'ready' })
        
        console.log('Fetched providers:', providersData)
        
        // Ensure providersData is an array
        if (!Array.isArray(providersData)) {
          console.error('Invalid providers data format:', providersData)
          setError('Invalid response format from server.')
          setIsLoading(false)
          return
        }
        
        // Transform API data to component format
        const formattedProviders = providersData.map(provider => {
          // Get initials from name
          const names = provider.name.split(' ')
          const initials = names.length >= 2 
            ? (names[0][0] + names[1][0]).toUpperCase()
            : provider.name.substring(0, 2).toUpperCase()
          
          // Calculate price per minute from hourly rate
          const pricePerMin = provider.hourlyRate ? (provider.hourlyRate / 60).toFixed(2) : 0
          
          return {
            value: provider.id, // Use provider ID as value for booking
            initials: initials,
            name: provider.name,
            title: provider.specialty || provider.title || 'Wellness Professional',
            rating: provider.rating || 0,
            reviews: provider.sessionsCompleted || provider.reviewsCount || 0,
            price: parseFloat(pricePerMin),
            description: provider.bio || provider.description || 'Professional wellness services.',
            providerId: provider.id,
            hourlyRate: provider.hourlyRate,
          }
        })
        
        setProviders(formattedProviders)
      } catch (error) {
        console.error('Error fetching providers:', error)
        setError('Failed to load providers. Please try again later.')
        setProviders([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProviders()
  }, [])

  const handleBookSession = (providerValue) => {
    if (onBookSession) {
      onBookSession(providerValue)
    }
  }

  return (
    <div className="find-providers">
      <h1 className="providers-title">Find Wellness Professionals</h1>
      
      {isLoading ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading providers...</p>
        </div>
      ) : error ? (
        <div className="error-state" style={{ textAlign: 'center', padding: '40px', color: '#c33' }}>
          <p>{error}</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>
          <p>No providers available at the moment.</p>
        </div>
      ) : (
        <div className="providers-grid">
          {providers.map((provider, index) => (
            <div key={provider.providerId || index} className="provider-card">
              <div className="provider-header">
                <div className="provider-avatar">{provider.initials}</div>
                <div className="provider-info">
                  <h3 className="provider-name">{provider.name}</h3>
                  <p className="provider-title">{provider.title}</p>
                </div>
                <div className="provider-price">${provider.price}/min</div>
              </div>
              <div className="provider-rating">
                <span className="rating-star">★</span>
                <span className="rating-value">{provider.rating || 'N/A'}</span>
                <span className="rating-reviews">({provider.reviews} {provider.reviews === 1 ? 'review' : 'reviews'})</span>
              </div>
              <p className="provider-description">{provider.description}</p>
              <button 
                className="provider-button"
                onClick={() => handleBookSession(provider.value)}
              >
                Book Session
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FindProviders
