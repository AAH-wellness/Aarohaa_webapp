import React, { useState, useRef, useEffect } from 'react'
import './Header.css'

const Header = ({ onNavigateToProfile, onSignOut, activeView, onToggleSidebar, isSidebarOpen }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [userName, setUserName] = useState('User')
  const [userInitials, setUserInitials] = useState('U')
  const dropdownRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    // Get user name from localStorage
    const loadUserInfo = () => {
      try {
        // First try to get from currentUser
        let currentUser = null
        try {
          const currentUserStr = localStorage.getItem('currentUser')
          if (currentUserStr) {
            currentUser = JSON.parse(currentUserStr)
          }
        } catch (e) {
          console.error('Error parsing currentUser:', e)
        }

        // Then try userData
        let userData = null
        try {
          const userDataStr = localStorage.getItem('userData')
          if (userDataStr) {
            userData = JSON.parse(userDataStr)
          }
        } catch (e) {
          console.error('Error parsing userData:', e)
        }

        // Prioritize name from currentUser, fallback to userData, then email
        let name = null
        
        if (currentUser && currentUser.name) {
          name = currentUser.name
        } else if (userData && userData.fullName) {
          name = userData.fullName
        } else if (userData && userData.name) {
          name = userData.name
        } else if (currentUser && currentUser.email) {
          // Format name from email
          const emailName = currentUser.email.split('@')[0]
          name = emailName.split('.').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        } else if (userData && userData.email) {
          // Format name from email
          const emailName = userData.email.split('@')[0]
          name = emailName.split('.').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        } else {
          name = 'User'
        }

        // Ensure name is not empty
        if (!name || name.trim() === '') {
          name = 'User'
        }

        const finalName = name.trim()
        setUserName(finalName)
        
        // Debug log (can be removed in production)
        if (process.env.NODE_ENV === 'development') {
          console.log('Header: Loaded user name:', finalName, { currentUser, userData })
        }
        
        // Generate initials
        const nameParts = name.trim().split(' ').filter(part => part.length > 0)
        if (nameParts.length >= 2) {
          setUserInitials((nameParts[0][0] + nameParts[1][0]).toUpperCase())
        } else if (nameParts.length === 1 && nameParts[0].length >= 2) {
          setUserInitials(nameParts[0].substring(0, 2).toUpperCase())
        } else {
          setUserInitials(name.substring(0, 2).toUpperCase())
        }
      } catch (error) {
        console.error('Error loading user info:', error)
        setUserName('User')
        setUserInitials('U')
      }
    }

    // Load immediately
    loadUserInfo()
    
    // Listen for storage changes to update name when user logs in/registers
    const handleStorageChange = (e) => {
      if (e.key === 'currentUser' || e.key === 'userData') {
        loadUserInfo()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically (for same-tab updates)
    const interval = setInterval(loadUserInfo, 500)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

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
