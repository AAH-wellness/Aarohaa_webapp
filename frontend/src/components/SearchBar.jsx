import React from 'react'
import { Search, X } from 'lucide-react'

const SearchBar = ({ value, onChange, onClear, searching, placeholder = "Search providers, specialties, or conditions…" }) => {
  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-4 z-10 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 pl-12 pr-12 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 text-gray-900 placeholder-gray-400 transition-all duration-200"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {searching && (
            <div className="w-8 h-8 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {value && !searching && (
            <button
              type="button"
              onClick={onClear}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchBar

