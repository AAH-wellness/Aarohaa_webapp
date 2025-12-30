import React, { useMemo } from 'react'
import './Sidebar.css'

// Define all menu items outside component (constant)
const ALL_MENU_ITEMS = [
  { icon: '👥', label: 'Find Providers' },
  { icon: '📅', label: 'My Appointments' },
  { icon: '💻', label: 'Active Session', requiresAppointment: true },
  { icon: '🧘', label: 'Wellness Activities' },
  { icon: '📚', label: 'Courses & Content' },
  { icon: '💬', label: 'Support' },
]

const Sidebar = ({ activeView, setActiveView, isMobileOpen, onCloseSidebar, hasBookedSession = false }) => {
  // Filter menu items based on hasBookedSession
  const menuItems = useMemo(() => {
    return ALL_MENU_ITEMS.filter(item => {
      if (item.requiresAppointment) {
        return hasBookedSession === true
      }
      return true
    })
  }, [hasBookedSession])

  const handleItemClick = (label) => {
    setActiveView(label)
    if (onCloseSidebar) {
      onCloseSidebar()
    }
  }

  return (
    <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      <h2 className="sidebar-title">Dashboard</h2>
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={`nav-item ${activeView === item.label ? 'active' : ''}`}
            onClick={() => handleItemClick(item.label)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
        <div className="sidebar-coins-display">
          <span className="sidebar-coins-icon">💰</span>
          <span className="sidebar-coins-text">1,250 AAH Coins</span>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
