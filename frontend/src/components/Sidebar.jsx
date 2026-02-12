import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import './Sidebar.css'

const Sidebar = ({ activeView, setActiveView, isMobileOpen, onCloseSidebar, hasActiveSession }) => {
  const { theme } = useTheme()
  const menuItems = [
    { icon: '👥', label: 'Find Providers' },
    { icon: '📅', label: 'My Appointments' },
    { icon: '💻', label: 'Active Session' },
    { icon: '🧘', label: 'Wellness Activities' },
    { icon: '📚', label: 'Courses & Content' },
    { icon: '💬', label: 'Support' },
  ]

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
      <div className="sidebar-legal">
        <a href="/terms" className="sidebar-legal-link">Terms of Service</a>
        <a href="/privacy" className="sidebar-legal-link">Privacy Policy</a>
        <a href="/cookies" className="sidebar-legal-link">Cookie Policy</a>
        <a href="/disclaimer" className="sidebar-legal-link">Disclaimer</a>
        <span className="sidebar-legal-copyright">© Aarohaa Wellness</span>
      </div>
    </aside>
  )
}

export default Sidebar
