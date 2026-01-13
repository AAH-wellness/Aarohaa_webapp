import React from 'react'

const CalendarGrid = ({ slots, selectedDate, onDateSelect }) => {
  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = []
    }
    acc[slot.date].push(slot)
    return acc
  }, {})

  // Get all unique dates and sort them
  const datesWithSlots = Object.keys(slotsByDate).sort()
  
  // Calculate 2-week range starting from today (or first available date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const startDate = datesWithSlots.length > 0 && new Date(datesWithSlots[0]) < today
    ? new Date(datesWithSlots[0])
    : new Date(today)
  
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 13) // 14 days total (2 weeks)

  // Generate calendar days (Tue-Sat for 2 weeks = 10 days)
  const calendarDays = []
  let currentDate = new Date(startDate)
  
  // Find next Tuesday (or today if it's Tue-Sat)
  const dayOfWeek = currentDate.getDay()
  // Calculate days to next Tuesday
  let daysToTuesday = 0
  if (dayOfWeek === 0) { // Sunday -> Tuesday (2 days)
    daysToTuesday = 2
  } else if (dayOfWeek === 1) { // Monday -> Tuesday (1 day)
    daysToTuesday = 1
  } else if (dayOfWeek >= 2 && dayOfWeek <= 6) { // Tue-Sat, start from today
    daysToTuesday = 0
  }
  
  currentDate.setDate(currentDate.getDate() + daysToTuesday)
  
  // Generate 10 days (Tue-Sat for 2 weeks)
  let daysGenerated = 0
  while (daysGenerated < 10 && currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    // Only include Tue-Sat (2-6)
    if (dayOfWeek >= 2 && dayOfWeek <= 6) {
      const dateKey = currentDate.toISOString().split('T')[0]
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' })
      const monthDay = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const slotCount = slotsByDate[dateKey]?.length || 0
      
      calendarDays.push({
        date: dateKey,
        dayName,
        monthDay,
        slotCount,
        isToday: dateKey === today.toISOString().split('T')[0]
      })
      daysGenerated++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Split into 2 rows of 5 days each
  const week1 = calendarDays.slice(0, 5)
  const week2 = calendarDays.slice(5, 10)

  return (
    <div className="calendar-grid">
      <div className="calendar-week">
        {week1.map((day) => (
          <div
            key={day.date}
            className={`calendar-day ${selectedDate === day.date ? 'selected' : ''} ${day.slotCount > 0 ? 'has-slots' : 'no-slots'}`}
            onClick={() => onDateSelect(day.date)}
          >
            <div className="day-name">{day.dayName}</div>
            <div className="day-date">{day.monthDay}</div>
            <div className="day-count">
              {day.slotCount > 0 ? `${day.slotCount} ${day.slotCount === 1 ? 'appt' : 'appts'}` : 'No appts'}
            </div>
          </div>
        ))}
      </div>
      <div className="calendar-week">
        {week2.map((day) => (
          <div
            key={day.date}
            className={`calendar-day ${selectedDate === day.date ? 'selected' : ''} ${day.slotCount > 0 ? 'has-slots' : 'no-slots'}`}
            onClick={() => onDateSelect(day.date)}
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

