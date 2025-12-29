import React, { useState, useRef, useEffect } from 'react'
import './ProviderHeader.css'

const ProviderHeader = ({ onNavigateToProfile, onSignOut, activeView, onToggleSidebar, isSidebarOpen }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleProfileClick = () => {
    setShowDropdown(false)
    if (onNavigateToProfile) {
      onNavigateToProfile()
    }
  }

  const handleSignOut = () => {
    setShowDropdown(false)
    if (onSignOut) {
      onSignOut()
    }
  }

  return (
    <header className="provider-header">
      <div className="provider-header-left">
        <button 
          className="provider-mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
        >
          <span className={`provider-hamburger ${isSidebarOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <div className="provider-logo">
          <img 
            src="/logo.png" 
            alt="Aarohaa Wellness Logo" 
            className="provider-logo-icon"
            onError={(e) => {
              console.error('Logo failed to load:', e.target.src)
              e.target.style.display = 'none'
            }}
          />
          <span className="provider-logo-text">Aarohaa Wellness</span>
          <span className="provider-badge">Provider</span>
        </div>
      </div>
      <div className="provider-header-right">
        <div className="provider-user-profile-container" ref={dropdownRef}>
          <div 
            className="provider-user-profile"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="provider-user-avatar">MP</div>
            <div className="provider-user-info">
              <span className="provider-user-name">Dr. Maya Patel</span>
              <span className="provider-user-role">Licensed Therapist</span>
            </div>
            <span className="provider-dropdown-arrow">▼</span>
          </div>
          {showDropdown && (
            <div className="provider-profile-dropdown">
              <div className="provider-dropdown-item" onClick={handleProfileClick}>
                <span className="provider-dropdown-icon">👤</span>
                <span>Profile</span>
              </div>
              <div className="provider-dropdown-item" onClick={handleSignOut}>
                <span className="provider-dropdown-icon">🚪</span>
                <span>Sign Out</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default ProviderHeader

