import React from 'react'
import { Filter, Sparkles } from 'lucide-react'
import './FiltersBar.css'

const FiltersBar = ({ 
  selectedSpecialty, 
  onSpecialtyChange, 
  minRating, 
  onMinRatingChange, 
  availableToday, 
  onAvailableTodayChange, 
  onClear,
  specialties = []
}) => {
  const hasActiveFilters = selectedSpecialty || minRating || availableToday

  return (
    <div className="filters-bar">
      <div className="filters-bar-inner">
        <div className="filters-bar-label">
          <Filter className="filters-bar-icon" />
          <span>Categories</span>
          <Sparkles className="filters-bar-sparkle" aria-hidden="true" />
        </div>
        
        <div className="filters-bar-controls">
          {/* Specialty Dropdown */}
          <select
            value={selectedSpecialty || ''}
            onChange={(e) => onSpecialtyChange(e.target.value || null)}
            className="filters-bar-select filters-bar-select--specialty"
          >
            <option value="">All Specialties</option>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>

          {/* Min Rating Dropdown */}
          <select
            value={minRating !== null ? String(minRating) : ''}
            onChange={(e) => onMinRatingChange(e.target.value ? parseFloat(e.target.value) : null)}
            className="filters-bar-select filters-bar-select--rating"
          >
            <option value="">Any Rating</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
          </select>

          {/* Available Today Toggle */}
          <label className="filters-bar-toggle">
            <input
              type="checkbox"
              checked={availableToday}
              onChange={(e) => onAvailableTodayChange(e.target.checked)}
              className="filters-bar-checkbox"
            />
            <span className="filters-bar-toggle-track">
              <span className="filters-bar-toggle-thumb" />
            </span>
            <span className="filters-bar-toggle-label">Available Today</span>
          </label>

          {/* Clear Button */}
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="filters-bar-clear"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FiltersBar
