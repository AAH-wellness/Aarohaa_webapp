import React from 'react'
import { Filter } from 'lucide-react'

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
    <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-sm border-b border-gray-100 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4" />
            <span>Filters:</span>
          </div>
          
          {/* Specialty Dropdown */}
          <select
            value={selectedSpecialty || ''}
            onChange={(e) => onSpecialtyChange(e.target.value || null)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition-all"
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
            value={minRating || ''}
            onChange={(e) => onMinRatingChange(e.target.value ? parseFloat(e.target.value) : null)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition-all"
          >
            <option value="">Any Rating</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
          </select>

          {/* Available Today Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={availableToday}
              onChange={(e) => onAvailableTodayChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-200 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-700">Available Today</span>
          </label>

          {/* Clear Button */}
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="ml-auto px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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

