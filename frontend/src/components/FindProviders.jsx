import React, { useState, useEffect, useMemo } from 'react'
import { userService } from '../services'
import { useTheme } from '../contexts/ThemeContext'
import SearchBar from './SearchBar'
import FiltersBar from './FiltersBar'
import ProviderCard from './ProviderCard'
import ProviderCardSkeletonList from './ProviderCardSkeleton'
import EmptyState from './EmptyState'
import './FindProviders.css'

const FindProviders = ({ onBookSession, onNavigateToAppointments }) => {
  const { theme } = useTheme()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState(null)
  const [minRating, setMinRating] = useState(null)
  const [availableToday, setAvailableToday] = useState(false)
  const hasLoadedOnce = React.useRef(false)

  // Fetch providers from API
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        if (!hasLoadedOnce.current) {
          setLoading(true)
        } else {
          setSearching(true)
        }
        setError(null)
        // Fetch providers from backend database
        // Only show providers with status='ready' (have set their availability)
        const filters = { status: 'ready' }
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

    fetchProviders()
  }, [])

  // Extract unique specialties from providers
  const specialties = useMemo(() => {
    const specialtySet = new Set()
    providers.forEach(provider => {
      if (provider.specialty) {
        // Split by comma or semicolon and add each
        provider.specialty.split(/[,;]/).forEach(s => {
          const trimmed = s.trim()
          if (trimmed) specialtySet.add(trimmed)
        })
      }
    })
    return Array.from(specialtySet).sort()
  }, [providers])

  // Client-side filtering logic
  const filteredProviders = useMemo(() => {
    return providers.filter(provider => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          provider.name?.toLowerCase().includes(query) ||
          provider.title?.toLowerCase().includes(query) ||
          provider.specialty?.toLowerCase().includes(query) ||
          provider.bio?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Specialty filter
      if (selectedSpecialty) {
        if (!provider.specialty) return false
        const providerSpecialties = provider.specialty.split(/[,;]/).map(s => s.trim().toLowerCase())
        if (!providerSpecialties.includes(selectedSpecialty.toLowerCase())) return false
      }

      // Min rating filter
      if (minRating !== null) {
        if (!provider.rating || provider.rating < minRating) return false
      }

      // Available today filter (UI-only for now)
      if (availableToday) {
        // If provider has availability field, check it
        // For now, this is UI-only so we'll skip filtering
        // if (provider.availability) {
        //   // Check if available today logic here
        // }
      }

      return true
    })
  }, [providers, searchQuery, selectedSpecialty, minRating, availableToday])

  const handleBookSession = (providerId) => {
    if (onBookSession) {
      onBookSession(providerId)
    }
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedSpecialty(null)
    setMinRating(null)
    setAvailableToday(false)
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

  // Show loading state
  if (loading && providers.length === 0) {
    return (
      <div className={`find-providers-page find-providers-page--${theme}`}>
        <div className="find-providers-inner">
          <div className="find-providers-header">
            <h1 className="find-providers-title">Find Wellness Professionals</h1>
            <p className="find-providers-subtitle">
              Search by name, specialty, or condition and book a session.
            </p>
          </div>
          <ProviderCardSkeletonList count={6} />
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className={`find-providers-page find-providers-page--${theme}`}>
        <div className="find-providers-inner">
          <h1 className="find-providers-title mb-8">Find Wellness Professionals</h1>
          <div className="find-providers-error-card">
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const hasActiveFilters = searchQuery.trim() || selectedSpecialty || minRating !== null || availableToday
  const showEmptyState = !loading && filteredProviders.length === 0 && hasActiveFilters

  return (
    <div className={`find-providers-page find-providers-page--${theme}`}>
      <div className="find-providers-inner">
        {/* Header */}
        <div className="find-providers-header">
          <h1 className="find-providers-title">Find Wellness Professionals</h1>
          <p className="find-providers-subtitle">
            Search by name, specialty, or condition and book a session.
          </p>
        </div>

        {/* Search Bar */}
        <div className="find-providers-search-wrap">
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            searching={searching}
          />
        </div>

        {/* Filters Bar */}
        {providers.length > 0 && (
          <FiltersBar
            selectedSpecialty={selectedSpecialty}
            onSpecialtyChange={setSelectedSpecialty}
            minRating={minRating}
            onMinRatingChange={setMinRating}
            availableToday={availableToday}
            onAvailableTodayChange={setAvailableToday}
            onClear={handleClearFilters}
            specialties={specialties}
          />
        )}

        {/* Provider List */}
        <div className="mt-6">
          {loading && providers.length === 0 ? (
            <ProviderCardSkeletonList count={6} />
          ) : showEmptyState ? (
            <EmptyState onClearFilters={handleClearFilters} />
          ) : filteredProviders.length === 0 && !hasActiveFilters ? (
            <div className="find-providers-empty-inline">
              <p>No providers available at the moment. Please check back later.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onBookSession={handleBookSession}
                  onNavigateToAppointments={onNavigateToAppointments}
                  getInitials={getInitials}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FindProviders
