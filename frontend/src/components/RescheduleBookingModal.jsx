import React, { useEffect, useMemo, useState } from 'react'
import './RescheduleBookingModal.css'

const RescheduleBookingModal = ({
  appointment,
  onConfirm,
  onCancel,
  alternatives = [],
  showSuccess = false,
  successDateTime = null
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [timeValue, setTimeValue] = useState('')
  const [dateValue, setDateValue] = useState('')
  const [error, setError] = useState('')

  const baseDate = useMemo(() => {
    if (!appointment?.dateTime) return null
    const date = new Date(appointment.dateTime)
    return isNaN(date.getTime()) ? null : date
  }, [appointment])

  const dateLabel = useMemo(() => {
    if (!baseDate) return 'Unknown date'
    return baseDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }, [baseDate])

  const dateKey = useMemo(() => {
    if (!baseDate) return ''
    const pad = (value) => String(value).padStart(2, '0')
    return `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())}`
  }, [baseDate])

  const weekBounds = useMemo(() => {
    if (!baseDate) return { min: '', max: '' }
    const start = new Date(baseDate)
    const day = start.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diffToMonday)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const pad = (value) => String(value).padStart(2, '0')
    const toKey = (value) => `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
    return { min: toKey(start), max: toKey(end) }
  }, [baseDate])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    if (appointment?.dateTime) {
      const current = new Date(appointment.dateTime)
      if (!isNaN(current.getTime())) {
        const pad = (value) => String(value).padStart(2, '0')
        setTimeValue(`${pad(current.getHours())}:${pad(current.getMinutes())}`)
        setDateValue(`${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`)
      }
    }
  }, [appointment])

  const handleConfirm = () => {
    if (!timeValue) {
      setError('Please select a new time.')
      return
    }
    if (!dateValue) {
      setError('Appointment date is not available.')
      return
    }
    const newDateTime = new Date(`${dateValue}T${timeValue}`)
    if (isNaN(newDateTime.getTime())) {
      setError('Invalid time selected.')
      return
    }
    setError('')
    onConfirm?.(newDateTime.toISOString())
  }

  const handleAlternativeSelect = (slot) => {
    if (slot?.time) {
      setTimeValue(slot.time)
      if (slot.date) {
        setDateValue(slot.date)
      }
      setError('')
    }
  }

  if (!appointment) return null

  if (showSuccess) {
    const successLabel = successDateTime
      ? new Date(successDateTime).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })
      : ''
    return (
      <div className={`reschedule-modal-overlay ${isVisible ? 'visible' : ''}`} onClick={onCancel}>
        <div className="reschedule-modal-content success" onClick={(e) => e.stopPropagation()}>
          <h2 className="reschedule-modal-title">Rescheduled</h2>
          <p className="reschedule-modal-message">
            Your appointment has been updated.
          </p>
          {successLabel && (
            <p className="reschedule-modal-success-time">{successLabel}</p>
          )}
          <button className="reschedule-modal-btn primary" onClick={onCancel}>
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`reschedule-modal-overlay ${isVisible ? 'visible' : ''}`} onClick={onCancel}>
      <div className="reschedule-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="reschedule-modal-title">Reschedule Appointment</h2>
        <p className="reschedule-modal-subtitle">
          Pick a new date and time for {appointment.providerName || appointment.patientName || 'this session'}
          within the same week as <span className="reschedule-date">{dateLabel}</span>.
        </p>

        <div className="reschedule-field">
          <label className="reschedule-label">New date</label>
          <input
            type="date"
            className="reschedule-input"
            value={dateValue}
            min={weekBounds.min}
            max={weekBounds.max}
            onChange={(e) => setDateValue(e.target.value)}
          />
        </div>

        <div className="reschedule-field">
          <label className="reschedule-label">New time</label>
          <input
            type="time"
            className="reschedule-input"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
          />
        </div>

        {alternatives.length > 0 && (
          <div className="reschedule-alternatives">
            <p className="reschedule-alt-title">Suggested times</p>
            <div className="reschedule-alt-list">
              {alternatives.slice(0, 8).map((slot) => (
                <button
                  key={`${slot.date}-${slot.time}`}
                  type="button"
                  className="reschedule-alt-chip"
                  onClick={() => handleAlternativeSelect(slot)}
                >
                  {slot.date} · {slot.time}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="reschedule-error">{error}</p>}

        <div className="reschedule-actions">
          <button className="reschedule-modal-btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="reschedule-modal-btn primary" onClick={handleConfirm}>
            Confirm reschedule
          </button>
        </div>
      </div>
    </div>
  )
}

export default RescheduleBookingModal
