import React, { useState, useRef, useEffect } from 'react'
import { userService } from '../services'
import './Header.css'

const Header = ({ onNavigateToProfile, onSignOut, activeView, onToggleSidebar, isSidebarOpen }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [userName, setUserName] = useState('User')
  const [userInitials, setUserInitials] = useState('U')
  const dropdownRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    // Fetch user profile from backend
    const loadUserInfo = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          // No token, user not logged in
          setUserName('User')
          setUserInitials('U')
          return
        }

        // Fetch user profile from backend
        const profile = await userService.getProfile()
        
        if (profile.user && profile.user.name) {
          const name = profile.user.name.trim()
          setUserName(name)
          
          // Generate initials
          const nameParts = name.split(' ').filter(part => part.length > 0)
          if (nameParts.length >= 2) {
            setUserInitials((nameParts[0][0] + nameParts[1][0]).toUpperCase())
          } else if (nameParts.length === 1 && nameParts[0].length >= 2) {
            setUserInitials(nameParts[0].substring(0, 2).toUpperCase())
          } else {
            setUserInitials(name.substring(0, 2).toUpperCase())
          }
        } else if (profile.user && profile.user.email) {
          // Fallback to email if name not available
          const emailName = profile.user.email.split('@')[0]
          const name = emailName.split('.').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
          setUserName(name)
          setUserInitials(name.substring(0, 2).toUpperCase())
        } else {
          setUserName('User')
          setUserInitials('U')
        }
      } catch (error) {
        console.error('Error loading user info:', error)
        // Fallback to 'User' if API call fails
        setUserName('User')
        setUserInitials('U')
      }
    }

    // Load immediately
    loadUserInfo()
    
    // Refresh user info when navigating to profile (user might have updated their profile)
    if (activeView === 'Profile') {
      const interval = setInterval(loadUserInfo, 2000) // Refresh every 2 seconds when on profile page
      return () => clearInterval(interval)
    }
  }, [activeView])

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownElement = document.querySelector('.profile-dropdown')
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        dropdownElement &&
        !dropdownElement.contains(event.target)
      ) {
        setShowDropdown(false)
      }
    }

    const updateDropdownPosition = () => {
      if (showDropdown && profileRef.current) {
        const rect = profileRef.current.getBoundingClientRect()
        const dropdownHeight = 120
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        
        let topPosition
        if (spaceBelow < dropdownHeight + 12 && spaceAbove > dropdownHeight + 12) {
          topPosition = rect.top - dropdownHeight - 12
        } else {
          topPosition = Math.min(rect.bottom + 12, window.innerHeight - dropdownHeight - 20)
        }
        
        setDropdownPosition({
          top: topPosition,
          right: window.innerWidth - rect.right
        })
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', updateDropdownPosition, true)
      window.addEventListener('resize', updateDropdownPosition)
      updateDropdownPosition()
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
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
    <header className="header">
      <div className="header-left">
        <button 
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${isSidebarOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <div className="logo">
          <img 
            src="/logo.png" 
            alt="Aarohaa Wellness Logo" 
            className="logo-icon"
            onError={(e) => {
              console.error('Logo failed to load:', e.target.src)
              e.target.style.display = 'none'
            }}
          />
          <span className="logo-text">Aarohaa Wellness</span>
        </div>
      </div>
      {activeView !== 'Profile' && (
        <div className="header-center">
          <div className="coins-display">
            <span className="coins-icon">💰</span>
            <span className="coins-text">1,250 AAH Coins</span>
          </div>
        </div>
      )}
      <div className="header-right">
        <div 
          className="user-profile-container" 
          ref={dropdownRef}
          data-open={showDropdown}
        >
          <div 
            ref={profileRef}
            className="user-profile"
            onClick={() => {
              if (!showDropdown && profileRef.current) {
                const rect = profileRef.current.getBoundingClientRect()
                const dropdownHeight = 120
                const spaceBelow = window.innerHeight - rect.bottom
                const spaceAbove = rect.top
                
                let topPosition
                if (spaceBelow < dropdownHeight + 12 && spaceAbove > dropdownHeight + 12) {
                  topPosition = rect.top - dropdownHeight - 12
                } else {
                  topPosition = Math.min(rect.bottom + 12, window.innerHeight - dropdownHeight - 20)
                }
                
                setDropdownPosition({
                  top: topPosition,
                  right: window.innerWidth - rect.right
                })
              }
              setShowDropdown(!showDropdown)
            }}
          >
            <div className="user-avatar">{userInitials}</div>
            <span className="user-name">{userName}</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          {showDropdown && (
            <div 
              className="profile-dropdown"
              style={{
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`
              }}
            >
              <div className="dropdown-item" onClick={handleProfileClick}>
                <span className="dropdown-icon">👤</span>
                <span>Profile</span>
              </div>
              <div className="dropdown-item" onClick={handleSignOut}>
                <span className="dropdown-icon">🚪</span>
                <span>Sign Out</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
