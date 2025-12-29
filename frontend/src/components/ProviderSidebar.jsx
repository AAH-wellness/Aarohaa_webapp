import React from 'react'
import './ProviderSidebar.css'

const ProviderSidebar = ({ activeView, setActiveView, isMobileOpen, onCloseSidebar }) => {
  const menuItems = [
    { icon: '📊', label: 'Dashboard' },
    { icon: '📅', label: 'My Schedule' },
    { icon: '💻', label: 'Active Sessions' },
    { icon: '💰', label: 'Earnings' },
    { icon: '👤', label: 'Profile' },
  ]

  const handleItemClick = (label) => {
    setActiveView(label)
    if (onCloseSidebar) {
      onCloseSidebar()
    }
  }

  return (
    <aside className={`provider-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      <h2 className="provider-sidebar-title">Provider Portal</h2>
      <nav className="provider-sidebar-nav">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={`provider-nav-item ${activeView === item.label ? 'active' : ''}`}
            onClick={() => handleItemClick(item.label)}
          >
            <span className="provider-nav-icon">{item.icon}</span>
            <span className="provider-nav-label">{item.label}</span>
            {activeView === item.label && <span className="provider-nav-indicator"></span>}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default ProviderSidebar

