import React, { useState, useRef, useEffect } from 'react'
import './AdminHeader.css'

const AdminHeader = ({ onSignOut, activeView, setActiveView, onToggleSidebar, isSidebarOpen }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [adminInfo, setAdminInfo] = useState({ name: 'Administrator', email: '' })
  const dropdownRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    // Get logged-in admin user details
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    const userData = JSON.parse(localStorage.getItem('userData') || '{}')
    
    setAdminInfo({
      name: currentUser.name || userData.fullName || 'Administrator',
      email: currentUser.email || userData.email || ''
    })
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownElement = document.querySelector('.admin-profile-dropdown')
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

  const handleToggleDropdown = () => {
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
  }

  const handleProfileClick = () => {
    setShowDropdown(false)
    if (setActiveView) {
      setActiveView('Profile')
    }
  }

  const handleSignOut = () => {
    setShowDropdown(false)
    if (onSignOut) {
      onSignOut()
    }
  }

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button 
          className="admin-mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
        >
          <span className={`admin-hamburger ${isSidebarOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <div className="admin-logo">
          <img 
            src="/logo.png" 
            alt="Aarohaa Wellness Logo" 
            className="admin-logo-icon"
            onError={(e) => {
              console.error('Logo failed to load:', e.target.src)
              e.target.style.display = 'none'
            }}
          />
          <span className="admin-logo-text">Aarohaa Wellness</span>
          <span className="admin-badge">Admin</span>
        </div>
      </div>
      <div className="admin-header-right">
        <div className="admin-user-profile-container" ref={dropdownRef}>
          <div 
            ref={profileRef}
            className="admin-user-profile"
            onClick={handleToggleDropdown}
          >
            <div className="admin-user-avatar">
              {adminInfo.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{adminInfo.name}</span>
              <span className="admin-user-role">System Admin</span>
            </div>
            <span className="admin-dropdown-arrow">▼</span>
          </div>
          {showDropdown && (
            <div 
              className="admin-profile-dropdown"
              style={{
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`
              }}
            >
              <div className="admin-dropdown-item" onClick={handleProfileClick}>
                <span className="admin-dropdown-icon">👤</span>
                <span>Profile</span>
              </div>
              <div className="admin-dropdown-item" onClick={handleSignOut}>
                <span className="admin-dropdown-icon">🚪</span>
                <span>Sign Out</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default AdminHeader

