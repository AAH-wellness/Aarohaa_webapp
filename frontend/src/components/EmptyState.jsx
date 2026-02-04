import React from 'react'
import { SearchX } from 'lucide-react'
import './EmptyState.css'

const EmptyState = ({ onClearFilters }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon-wrap">
        <SearchX className="empty-state-icon" />
      </div>
      <h3 className="empty-state-title">No providers found</h3>
      <p className="empty-state-desc">
        Try adjusting your search or filters.
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="empty-state-btn"
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}

export default EmptyState

