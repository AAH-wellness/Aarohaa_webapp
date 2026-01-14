import React from 'react'

const CalendarGrid = ({ slots, selectedDate, onDateSelect, providerAvailability }) => {
  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = []
    }
    acc[slot.date].push(slot)
    return acc
  }, {})

  // Calculate 2-week range starting from the Monday of the current week
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Find the Monday of the current week
  const dayOfWeek = today.getDay()
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // If Sunday (0), go back 6 days; otherwise go to Monday (1)
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() + daysToMonday)
  
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 6) // 7 days total (1 week, Monday to Sunday)

  // Generate calendar days for 1 week (all 7 days, starting from Monday)
  const calendarDays = []
  let currentDate = new Date(startDate)
  
  // Generate 7 days (1 week, Monday through Sunday)
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    const dayOfWeek = currentDate.getDay()
    
    // Map day number to day name (0=Sunday, 1=Monday, ..., 6=Saturday)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayNameShort = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa']
    const dayNameFull = dayNames[dayOfWeek]
    const dayName = dayNameShort[dayOfWeek]
    
    // Check if this day is available for the provider
    const dayKey = dayNameFull.toLowerCase()
    // Check if the day is enabled - explicitly check for false, default to true if not set
    const dayAvailability = providerAvailability?.[dayKey]
    // Explicitly check: if enabled is false, day is unavailable; otherwise it's available
    const isDayAvailable = dayAvailability?.enabled !== false
    
    // Debug logging for Monday and Wednesday specifically
    if ((dayKey === 'monday' || dayKey === 'wednesday') && providerAvailability) {
      console.log(`${dayNameFull} availability check:`, {
        dayKey,
        dayAvailability,
        enabled: dayAvailability?.enabled,
        isDayAvailable,
        dateKey,
        isToday: dateKey === today.toISOString().split('T')[0],
        fullAvailability: providerAvailability
      })
    }
    
    // Debug logging for unavailable days
    if (providerAvailability && !isDayAvailable) {
      console.log(`Day ${dayNameFull} (${dayKey}) is unavailable:`, dayAvailability)
    }
    
    const monthDay = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const slotCount = slotsByDate[dateKey]?.length || 0
    
    calendarDays.push({
      date: dateKey,
      dayName,
      monthDay,
      slotCount,
      isToday: dateKey === today.toISOString().split('T')[0],
      isAvailable: isDayAvailable
    })
    
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Single week row (7 days: M-S)
  return (
    <div className="calendar-grid">
      <div className="calendar-week">
        {calendarDays.map((day) => (
          <div
            key={day.date}
            className={`calendar-day ${selectedDate === day.date ? 'selected' : ''} ${day.slotCount > 0 ? 'has-slots' : 'no-slots'} ${!day.isAvailable ? 'unavailable' : ''} ${day.isAvailable && day.slotCount === 0 ? 'enabled-no-slots' : ''}`}
            onClick={() => day.isAvailable ? onDateSelect(day.date) : null}
            style={{ cursor: day.isAvailable ? 'pointer' : 'not-allowed' }}
          >
            <div className="day-name">{day.dayName}</div>
            <div className="day-date">{day.monthDay}</div>
            <div className="day-count">
              {day.slotCount > 0 ? `${day.slotCount} ${day.slotCount === 1 ? 'appt' : 'appts'}` : 'No appts'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CalendarGrid

