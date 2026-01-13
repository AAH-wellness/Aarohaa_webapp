import React from 'react'
import { SearchX } from 'lucide-react'

const EmptyState = ({ onClearFilters }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <SearchX className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No providers found
      </h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        Try adjusting your search or filters.
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="px-6 py-2 bg-green-800 hover:bg-green-900 text-white rounded-lg font-medium transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}

export default EmptyState

