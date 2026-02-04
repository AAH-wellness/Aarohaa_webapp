import React from 'react'
import { Search, X } from 'lucide-react'
import './SearchBar.css'

const SearchBar = ({ value, onChange, onClear, searching, placeholder = "Search providers, specialties, or conditions…" }) => {
  return (
    <div className="search-bar">
      <div className="search-bar-inner">
        <div className="search-bar-icon-wrap">
          <Search className="search-bar-icon" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="search-bar-input"
        />
        <div className="search-bar-actions">
          {searching && (
            <div className="search-bar-spinner-wrap">
              <div className="search-bar-spinner" aria-hidden="true"></div>
            </div>
          )}
          {value && !searching && (
            <button
              type="button"
              onClick={onClear}
              className="search-bar-clear-btn"
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

