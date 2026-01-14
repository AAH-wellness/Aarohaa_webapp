import React from 'react'

const TimeSlotsList = ({ slots, selectedDate, onSlotSelect, isSlotBooked }) => {
  if (!selectedDate) {
    return null
  }

  // Filter slots for selected date
  const dateSlots = slots.filter(slot => slot.date === selectedDate)
  
  if (dateSlots.length === 0) {
    return (
      <div className="time-slots-section">
        <div className="no-slots-message">No available appointments</div>
      </div>
    )
  }

  // Format date label
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selectedDateObj = new Date(selectedDate)
  selectedDateObj.setHours(0, 0, 0, 0)
  
  const isToday = selectedDateObj.getTime() === today.getTime()
  const isTomorrow = selectedDateObj.getTime() === today.getTime() + 24 * 60 * 60 * 1000
  
  let dateLabel = ''
  if (isToday) {
    dateLabel = 'Today'
  } else if (isTomorrow) {
    dateLabel = 'Tomorrow'
  } else {
    dateLabel = selectedDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Sort slots by time
  const sortedSlots = [...dateSlots].sort((a, b) => {
    const timeA = a.time
    const timeB = b.time
    return timeA.localeCompare(timeB)
  })

  // Format time for display (12-hour format)
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="time-slots-section">
      <h3 className="time-slots-date-label">{dateLabel}</h3>
      <div className="time-slots-grid">
        {sortedSlots.map((slot) => {
          const booked = isSlotBooked ? isSlotBooked(slot.datetime) : false
          return (
            <button
              key={slot.datetime}
              className={`time-slot-btn ${booked ? 'booked' : ''}`}
              onClick={() => !booked && onSlotSelect(slot)}
              disabled={booked}
              title={booked ? 'You already have an appointment at this time' : ''}
            >
              {formatTime(slot.time)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TimeSlotsList

