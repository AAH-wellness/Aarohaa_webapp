import React, { useState, useEffect } from 'react'
import providerService from '../services/providerService'
import AvailabilitySuccessModal from './AvailabilitySuccessModal'
import './ProviderAvailability.css'

const ProviderAvailability = ({ onBack }) => {
  const [availability, setAvailability] = useState({
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '10:00', end: '14:00' },
    sunday: { enabled: false, start: '10:00', end: '14:00' },
  })

  const [timezone, setTimezone] = useState('America/New_York')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ]

  const handleDayToggle = (day) => {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        enabled: !availability[day].enabled,
      },
    })
  }

  const handleTimeChange = (day, field, value) => {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        [field]: value,
      },
    })
  }

  useEffect(() => {
    const fetchAvailability = async () => {
      setIsLoading(true)
      setError('')
      try {
        const savedAvailability = await providerService.getProviderAvailability()
        if (savedAvailability && Object.keys(savedAvailability).length > 0) {
          // Merge saved availability with default structure
          const merged = { ...availability }
          Object.keys(savedAvailability).forEach(day => {
            if (merged[day]) {
              merged[day] = { ...merged[day], ...savedAvailability[day] }
            } else {
              merged[day] = savedAvailability[day]
            }
          })
          setAvailability(merged)
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
        // Continue with default availability if fetch fails
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailability()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      // Include timezone in availability data
      const availabilityData = {
        ...availability,
        timezone: timezone
      }
      
      await providerService.updateProviderAvailability(availabilityData)
      // Show success modal instead of alert
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Error saving availability:', error)
      setError('Failed to save availability. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="provider-availability">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading availability settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="provider-availability">
      <div className="availability-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div>
          <h1 className="availability-title">Manage Availability</h1>
          <p className="availability-subtitle">Set your working hours for each day of the week. Changes are saved immediately.</p>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ color: '#c33', padding: '10px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

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
            {days.map((day) => (
              <div key={day.key} className="availability-day-card">
                <div className="day-header">
                  <div className="day-toggle">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={availability[day.key].enabled}
                        onChange={() => handleDayToggle(day.key)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className="day-label">{day.label}</span>
                  </div>
                </div>
                {availability[day.key].enabled && (
                  <div className="day-times">
                    <div className="time-input-group">
                      <label>Start Time</label>
                      <input
                        type="time"
                        value={availability[day.key].start}
                        onChange={(e) => handleTimeChange(day.key, 'start', e.target.value)}
                        className="time-input"
                      />
                    </div>
                    <span className="time-separator">to</span>
                    <div className="time-input-group">
                      <label>End Time</label>
                      <input
                        type="time"
                        value={availability[day.key].end}
                        onChange={(e) => handleTimeChange(day.key, 'end', e.target.value)}
                        className="time-input"
                      />
                    </div>
                  </div>
                )}
                {!availability[day.key].enabled && (
                  <div className="day-unavailable">
                    <span>Unavailable</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="availability-actions">
          <button className="cancel-button" onClick={onBack}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <AvailabilitySuccessModal
          onClose={() => {
            setShowSuccessModal(false)
            if (onBack) {
              onBack()
            }
          }}
        />
      )}
    </div>
  )
}

export default ProviderAvailability


