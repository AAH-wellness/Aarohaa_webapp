import React, { useState, useEffect, useRef } from 'react'
import { userService } from '../services'
import './FindProviders.css'

const FindProviders = ({ onBookSession }) => {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)
  const hasLoadedOnce = useRef(false)

  // Debounced search effect
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        // Only show full loading on initial load, use searching state for subsequent searches
        if (!hasLoadedOnce.current) {
          setLoading(true)
        } else {
          setSearching(true)
        }
        setError(null)
        // Fetch providers from backend database with optional search parameter
        // Only show providers with status='ready' (have set their availability)
        const filters = { status: 'ready' }
        if (searchQuery.trim()) {
          filters.search = searchQuery.trim()
        }
        const providersList = await userService.getAllProviders(filters)
        setProviders(providersList)
        hasLoadedOnce.current = true
      } catch (err) {
        console.error('Error fetching providers:', err)
        setError('Failed to load providers. Please try again later.')
        setProviders([])
      } finally {
        setLoading(false)
        setSearching(false)
      }
    }

    // Debounce search: wait 500ms after user stops typing
    const timeoutId = setTimeout(() => {
      fetchProviders()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleBookSession = (providerId) => {
    if (onBookSession) {
      onBookSession(providerId)
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleClearSearch = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setSearchQuery('')
    // Maintain focus on search input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus()
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

  // Show loading only on initial page load
  if (loading && providers.length === 0) {
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

  const hasSearchQuery = searchQuery.trim().length > 0
  const showNoResults = !loading && providers.length === 0 && hasSearchQuery

  if (providers.length === 0 && !hasSearchQuery) {
    return (
      <div className="find-providers">
        <h1 className="providers-title">Find Wellness Professionals</h1>
      <div className="search-container">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search by name, title, specialty, or bio..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
            autoFocus={false}
          />
          {searching && (
            <span className="search-loading">⏳</span>
          )}
          {hasSearchQuery && !searching && (
            <button 
              type="button"
              className="search-clear" 
              onClick={handleClearSearch} 
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>
        <div className="no-providers-message">
          No providers available at the moment. Please check back later.
        </div>
      </div>
    )
  }

  return (
    <div className="find-providers">
      <h1 className="providers-title">Find Wellness Professionals</h1>
      <div className="search-container">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, title, specialty, or bio..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {hasSearchQuery && (
            <button className="search-clear" onClick={handleClearSearch} aria-label="Clear search">
              ×
            </button>
          )}
        </div>
      </div>
      {showNoResults && (
        <div className="no-results-message">
          No providers found matching "{searchQuery}". Try a different search term.
        </div>
      )}
      {!showNoResults && (
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
              <>
                <div className="bio-header">Bio:</div>
                <p className="provider-description">{provider.bio}</p>
              </>
            )}
            {provider.specialty && !provider.bio && (
              <>
                <div className="bio-header">Bio:</div>
                <p className="provider-description">Specializes in {provider.specialty}</p>
              </>
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
      )}
    </div>
  )
}

export default FindProviders
