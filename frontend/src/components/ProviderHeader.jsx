import React, { useState, useRef, useEffect } from 'react'
import providerService from '../services/providerService'
import './ProviderHeader.css'

const ProviderHeader = ({ onNavigateToProfile, onSignOut, activeView, onToggleSidebar, isSidebarOpen }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [providerName, setProviderName] = useState('Provider')
  const [providerTitle, setProviderTitle] = useState('')
  const [providerInitials, setProviderInitials] = useState('P')
  const dropdownRef = useRef(null)

  useEffect(() => {
    // Fetch provider profile data
    const fetchProviderData = async () => {
      try {
        const response = await providerService.getProviderProfile()
        if (response && response.provider) {
          const provider = response.provider
          const name = provider.name || 'Provider'
          const title = provider.title || provider.specialty || ''
          
          setProviderName(name)
          setProviderTitle(title)
          
          // Generate initials from name
          const nameParts = name.trim().split(' ').filter(part => part.length > 0)
          if (nameParts.length >= 2) {
            setProviderInitials((nameParts[0][0] + nameParts[1][0]).toUpperCase())
          } else if (nameParts.length === 1 && nameParts[0].length >= 2) {
            setProviderInitials(nameParts[0].substring(0, 2).toUpperCase())
          } else {
            setProviderInitials(name.substring(0, 2).toUpperCase())
          }
        }
      } catch (error) {
        console.error('Error fetching provider data for header:', error)
        // Keep default values if fetch fails
      }
    }

    fetchProviderData()
  }, [])

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
            <div className="provider-user-avatar">{providerInitials}</div>
            <div className="provider-user-info">
              <span className="provider-user-name">{providerName}</span>
              <span className="provider-user-role">{providerTitle || 'Provider'}</span>
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

