import React, { useState, useEffect, useMemo, useRef, useCallback, Component } from 'react'
import { userService } from '../services'
import './ProviderAvailability.css'

// Error boundary to catch any render errors
class AvailabilityErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ProviderAvailability Error:', error, errorInfo)
    try {
      localStorage.setItem('lastAppCrash', JSON.stringify({
        message: error?.message || 'ProviderAvailability render error',
        stack: error?.stack || '',
        time: new Date().toISOString()
      }))
    } catch (storageError) {
      console.warn('Unable to persist crash info:', storageError)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <h2 style={{ color: '#dc2626' }}>Something went wrong</h2>
          <p>Unable to load availability settings.</p>
          <button 
            onClick={() => this.props.onBack && this.props.onBack()}
            style={{ padding: '10px 20px', marginTop: '16px', cursor: 'pointer' }}
          >
            Go Back
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Memoize days array outside component to prevent recreation on every render
const DAYS = Object.freeze([
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
])

// Default availability state
const DEFAULT_AVAILABILITY = Object.freeze({
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '10:00', end: '14:00' },
  sunday: { enabled: false, start: '10:00', end: '14:00' },
})

const TIMEZONE_OPTIONS = Object.freeze([
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
])

const MAX_AVAILABILITY_BYTES = 100000
const MAX_AVAILABILITY_KEYS = 64
const TIME_OPTIONS = Object.freeze(
  Array.from({ length: 96 }, (_, index) => {
    const totalMinutes = index * 15
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  })
)

const buildTimeOptions = (currentValue) => {
  if (!currentValue || TIME_OPTIONS.includes(currentValue)) {
    return TIME_OPTIONS
  }
  return [currentValue, ...TIME_OPTIONS]
}

const normalizeTimeValue = (value, fallback) => {
  if (!value || typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return fallback
  }

  // Handle ISO datetime strings (timezone fixes sometimes stored full timestamps)
  if (trimmed.includes('T') || trimmed.endsWith('Z')) {
    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      const hours = String(parsed.getHours()).padStart(2, '0')
      const minutes = String(parsed.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    }
  }

  const parts = trimmed.split(':')
  if (parts.length >= 2) {
    const hours = Number(parts[0])
    const minutes = Number(parts[1])
    if (Number.isInteger(hours) && Number.isInteger(minutes) &&
        hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  return fallback
}

const normalizeAvailability = (availabilityData) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const normalizedAvailability = {}

  days.forEach((day) => {
    const dayInput = availabilityData?.[day]
    const defaults = DEFAULT_AVAILABILITY[day]
    if (dayInput && typeof dayInput === 'object') {
      normalizedAvailability[day] = {
        enabled: typeof dayInput.enabled === 'boolean'
          ? dayInput.enabled
          : dayInput.enabled === 'true' || dayInput.enabled === 1,
        start: normalizeTimeValue(dayInput.start, defaults.start),
        end: normalizeTimeValue(dayInput.end, defaults.end),
      }
    } else {
      normalizedAvailability[day] = { ...defaults }
    }
  })

  return normalizedAvailability
}

const normalizeTimezone = (value) => {
  if (TIMEZONE_OPTIONS.includes(value)) {
    return value
  }
  return 'America/New_York'
}

const ProviderAvailabilityInner = ({ onBack }) => {
  try {
    localStorage.setItem('availabilityRenderStart', new Date().toISOString())
  } catch (storageError) {
    console.warn('Unable to persist availability render start:', storageError)
  }

  // Use function initialization to avoid recreating object on every render
  const [availability, setAvailability] = useState(() => ({ ...DEFAULT_AVAILABILITY }))
  const [timezone, setTimezone] = useState('America/New_York')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isReady, setIsReady] = useState(false) // New: delay rendering until mounted
  const debugSkipUI = typeof window !== 'undefined' && localStorage.getItem('availabilityDebugSkip') === 'true'
  const [useSafeMode, setUseSafeMode] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('availabilitySafeMode') !== 'false'
  })
  
  // Track component mount state
  const isMountedRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const handleDayToggle = useCallback((day) => {
    try {
      setAvailability((prev) => {
        // Prevent unnecessary updates if state hasn't changed
        const currentDay = prev[day] || { enabled: false, start: '09:00', end: '17:00' }
        const newEnabled = !currentDay.enabled
        if (currentDay.enabled === newEnabled) {
          return prev // No change, return same object
        }
        return {
          ...prev,
          [day]: {
            ...currentDay,
            enabled: newEnabled,
          },
        }
      })
    } catch (error) {
      console.error('Error toggling day:', error)
    }
  }, [])

  const handleTimeChange = useCallback((day, field, value) => {
    try {
      setAvailability((prev) => {
        const currentDay = prev[day] || { enabled: false, start: '09:00', end: '17:00' }
        // Prevent unnecessary updates if value hasn't changed
        if (currentDay[field] === value) {
          return prev // No change, return same object
        }
        return {
          ...prev,
          [day]: {
            ...currentDay,
            [field]: value,
          },
        }
      })
    } catch (error) {
      console.error('Error changing time:', error)
    }
  }, [])

  // First effect: just mark component as mounted and ready
  useEffect(() => {
    isMountedRef.current = true
    try {
      localStorage.setItem('availabilityMount', new Date().toISOString())
      localStorage.setItem('availabilityRenderCommit', new Date().toISOString())
    } catch (storageError) {
      console.warn('Unable to persist availability mount time:', storageError)
    }
    
    // Use requestAnimationFrame to defer heavy work until after paint
    const frameId = requestAnimationFrame(() => {
      if (isMountedRef.current) {
        setIsReady(true)
      }
    })
    
    return () => {
      isMountedRef.current = false
      cancelAnimationFrame(frameId)
    }
  }, [])

  // Second effect: load data only after component is ready
  useEffect(() => {
    // Don't load until component is ready
    if (!isReady) return
    
    // Prevent duplicate loads
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    
    const loadAvailability = async () => {
      // Double-check mount status
      if (!isMountedRef.current) return
      
      try {
        setIsLoading(true)
        setError(null)
        try {
          localStorage.setItem('availabilityLoadStart', new Date().toISOString())
        } catch (storageError) {
          console.warn('Unable to persist availability load start time:', storageError)
        }
        
        let response
        try {
          response = await userService.getProviderAvailability()
        } catch (apiError) {
          if (!isMountedRef.current) return
          console.error('API error loading availability:', apiError)
          // Continue with default values if API fails
          setIsLoading(false)
          return
        }
        
        if (!isMountedRef.current) return
        
        if (response && response.availability) {
          let availabilityData = response.availability
          if (typeof availabilityData === 'string') {
            try {
              if (availabilityData.length > MAX_AVAILABILITY_BYTES) {
                throw new Error('Availability payload too large')
              }
              availabilityData = JSON.parse(availabilityData)
            } catch (parseError) {
              console.error('Error parsing availability JSON:', parseError)
            }
          }
          if (availabilityData && typeof availabilityData === 'object') {
            const keyCount = Object.keys(availabilityData).length
            if (keyCount > MAX_AVAILABILITY_KEYS) {
              throw new Error(`Availability payload has too many keys (${keyCount})`)
            }
            try {
              localStorage.setItem('availabilityKeysCount', String(keyCount))
              const serialized = JSON.stringify(availabilityData)
              localStorage.setItem('availabilitySizeBytes', String(serialized.length))
              localStorage.setItem('availabilityIsArray', String(Array.isArray(availabilityData)))
            } catch (storageError) {
              console.warn('Unable to persist availability metrics:', storageError)
            }
          }
          
          if (isMountedRef.current && availabilityData && typeof availabilityData === 'object') {
            const normalized = normalizeAvailability(availabilityData)
            if (isMountedRef.current) {
              setAvailability(normalized)
            }
          }
        }
        
        if (!isMountedRef.current) return
        
        // Load timezone from localStorage
        try {
          const savedTimezone = localStorage.getItem('providerTimezone')
          if (savedTimezone && isMountedRef.current) {
            setTimezone(normalizeTimezone(savedTimezone))
          }
        } catch (storageError) {
          console.error('Error reading from localStorage:', storageError)
        }
      } catch (error) {
        if (!isMountedRef.current) return
        console.error('Error loading availability:', error)
        try {
          localStorage.setItem('availabilityLoadError', JSON.stringify({
            message: error?.message || 'Availability load error',
            stack: error?.stack || '',
            time: new Date().toISOString()
          }))
        } catch (storageError) {
          console.warn('Unable to persist availability load error:', storageError)
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
          try {
            localStorage.setItem('availabilityLoadEnd', new Date().toISOString())
          } catch (storageError) {
            console.warn('Unable to persist availability load end time:', storageError)
          }
        }
      }
    }

    loadAvailability()
  }, [isReady])

  // Safety check: ensure availability object has all required days
  // MUST be called before any conditional returns to follow Rules of Hooks
  const safeAvailability = useMemo(() => {
    try {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      const safe = {}
      days.forEach(day => {
        if (availability && availability[day] && typeof availability[day] === 'object') {
          safe[day] = {
            enabled: Boolean(availability[day].enabled),
            start: availability[day].start || '09:00',
            end: availability[day].end || '17:00'
          }
        } else {
          safe[day] = {
            enabled: day !== 'saturday' && day !== 'sunday',
            start: '09:00',
            end: '17:00'
          }
        }
      })
      return safe
    } catch (error) {
      console.error('Error in safeAvailability useMemo:', error)
      // Return safe defaults
      return {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '10:00', end: '14:00' },
        sunday: { enabled: false, start: '10:00', end: '14:00' },
      }
    }
  }, [availability])

  const lastCrash = (() => {
    try {
      const raw = localStorage.getItem('lastAppCrash')
      return raw ? JSON.parse(raw) : null
    } catch (error) {
      console.warn('Unable to read lastAppCrash:', error)
      return null
    }
  })()

  const handleSave = useCallback(async () => {
    // Prevent multiple simultaneous save operations
    if (isSaving) {
      return
    }
    
    try {
      setIsSaving(true)
      setError(null)
      
      // Save availability to backend (sanitize any unexpected values)
      const normalizedAvailability = normalizeAvailability(availability)
      await userService.updateProviderAvailability(normalizedAvailability)
      
      // Save timezone to localStorage (not part of backend yet)
      try {
        localStorage.setItem('providerTimezone', timezone)
      } catch (storageError) {
        console.error('Error saving timezone to localStorage:', storageError)
        // Continue even if localStorage fails
      }
      
      alert('Availability settings saved successfully! Your profile is now visible to users.')
      if (onBack && typeof onBack === 'function') {
        try {
          onBack()
        } catch (callbackError) {
          console.error('Error in onBack callback:', callbackError)
        }
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      setError('Failed to save availability. Please try again.')
      alert('Failed to save availability. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [availability, timezone, isSaving, onBack])

  // Return minimal content while mounting to reduce initial render load
  if (!isReady) {
    return (
      <div style={{ padding: '32px', minHeight: '100vh' }}>
        <p style={{ color: 'rgba(14, 72, 38, 0.6)' }}>Loading...</p>
      </div>
    )
  }

  // Show loading state while loading data
  if (isLoading) {
    return (
      <div className="provider-availability">
        <div className="availability-header">
          <button className="back-button" onClick={() => onBack && onBack()}>
            ← Back
          </button>
          <div>
            <h1 className="availability-title">Manage Availability</h1>
            <p className="availability-subtitle">Loading availability settings...</p>
          </div>
        </div>
        <div className="availability-container" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ color: 'rgba(14, 72, 38, 0.6)' }}>Loading...</div>
        </div>
      </div>
    )
  }

  if (debugSkipUI) {
    return (
      <div className="provider-availability">
        <div className="availability-header">
          <button className="back-button" onClick={() => onBack && onBack()}>
            ← Back
          </button>
          <div>
            <h1 className="availability-title">Manage Availability (Debug Mode)</h1>
            <p className="availability-subtitle">
              Availability UI rendering is skipped. Clear "availabilityDebugSkip" in localStorage to restore.
            </p>
          </div>
        </div>
        <div className="availability-container">
          <p>Debug mode is active. This helps isolate render crashes.</p>
        </div>
      </div>
    )
  }

  if (useSafeMode) {
    return (
      <div className="provider-availability" style={{ minHeight: '100vh', padding: '32px' }}>
        <div className="availability-header">
          <button className="back-button" onClick={() => onBack && onBack()}>
            ← Back
          </button>
          <div>
            <h1 className="availability-title">Manage Availability</h1>
            {error && (
              <p style={{ color: '#dc2626', marginTop: '8px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="availability-container">
          <div className="availability-section">
            <div className="section-header">
              <h2 className="section-title">Timezone</h2>
            </div>
            <div className="timezone-selector">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="timezone-select"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Phoenix">Arizona Time (MST)</option>
                <option value="America/Anchorage">Alaska Time (AKT)</option>
                <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
              </select>
            </div>
          </div>

          <div className="availability-section">
            <div className="section-header">
              <h2 className="section-title">Weekly Schedule</h2>
              <p className="section-description">Toggle days and edit times (HH:mm)</p>
            </div>
            <div className="availability-days">
              {DAYS.map((day) => {
                const dayData = safeAvailability[day.key] || { enabled: false, start: '09:00', end: '17:00' }
                return (
                  <div key={day.key} className="availability-day-card">
                    <div className="day-header">
                      <div className="day-toggle">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={dayData.enabled}
                            onChange={() => handleDayToggle(day.key)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className="day-label">{day.label}</span>
                      </div>
                    </div>
                    {dayData.enabled ? (
                      <div className="day-times">
                        <div className="time-input-group">
                          <label>Start Time</label>
                          <input
                            type="text"
                            value={dayData.start}
                            onChange={(e) => handleTimeChange(day.key, 'start', e.target.value)}
                            className="time-input"
                            placeholder="09:00"
                          />
                        </div>
                        <span className="time-separator">to</span>
                        <div className="time-input-group">
                          <label>End Time</label>
                          <input
                            type="text"
                            value={dayData.end}
                            onChange={(e) => handleTimeChange(day.key, 'end', e.target.value)}
                            className="time-input"
                            placeholder="17:00"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="day-unavailable">
                        <span>Unavailable</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="availability-actions">
            <button className="cancel-button" onClick={() => onBack && onBack()}>
              Cancel
            </button>
            <button className="save-button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Availability'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="provider-availability" style={{ minHeight: '100vh', padding: '32px' }}>
      <div className="availability-header">
        <button className="back-button" onClick={() => onBack && onBack()}>
          ← Back
        </button>
        <div>
          <h1 className="availability-title">Manage Availability</h1>
          <p className="availability-subtitle">Set your working hours for each day of the week</p>
          {lastCrash && lastCrash.message && (
            <p style={{ color: '#dc2626', marginTop: '8px' }}>
              Last crash: {lastCrash.message}
            </p>
          )}
          {error && (
            <p style={{ color: '#dc2626', marginTop: '8px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="availability-container">
        <div className="availability-section">
          <div className="section-header">
            <h2 className="section-title">Timezone</h2>
          </div>
          <div className="timezone-selector">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="timezone-select"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Phoenix">Arizona Time (MST)</option>
              <option value="America/Anchorage">Alaska Time (AKT)</option>
              <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
            </select>
          </div>
        </div>

        <div className="availability-section">
          <div className="section-header">
            <h2 className="section-title">Weekly Schedule</h2>
            <p className="section-description">Toggle days on/off and set your working hours</p>
          </div>
          
          <div className="availability-days">
            {DAYS.map((day) => {
              // Ensure day data exists, use defaults if not
              const dayData = safeAvailability[day.key] || { enabled: false, start: '09:00', end: '17:00' }
              
              return (
                <div key={day.key} className="availability-day-card">
                  <div className="day-header">
                    <div className="day-toggle">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={dayData.enabled}
                          onChange={() => handleDayToggle(day.key)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="day-label">{day.label}</span>
                    </div>
                  </div>
                  {dayData.enabled && (
                    <div className="day-times">
                      <div className="time-input-group">
                        <label>Start Time</label>
                        <select
                          value={dayData.start}
                          onChange={(e) => handleTimeChange(day.key, 'start', e.target.value)}
                          className="time-input"
                        >
                          {buildTimeOptions(dayData.start).map(option => (
                            <option key={`start-${day.key}-${option}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span className="time-separator">to</span>
                      <div className="time-input-group">
                        <label>End Time</label>
                        <select
                          value={dayData.end}
                          onChange={(e) => handleTimeChange(day.key, 'end', e.target.value)}
                          className="time-input"
                        >
                          {buildTimeOptions(dayData.end).map(option => (
                            <option key={`end-${day.key}-${option}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  {!dayData.enabled && (
                    <div className="day-unavailable">
                      <span>Unavailable</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="availability-actions">
          <button className="cancel-button" onClick={() => onBack && onBack()}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Wrapper component with error boundary
const ProviderAvailability = ({ onBack }) => {
  return (
    <AvailabilityErrorBoundary onBack={onBack}>
      <ProviderAvailabilityInner onBack={onBack} />
    </AvailabilityErrorBoundary>
  )
}

export default ProviderAvailability


