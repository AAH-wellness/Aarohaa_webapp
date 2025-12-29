import React from 'react'
import './AdminSidebar.css'

const AdminSidebar = ({ activeView, setActiveView, isMobileOpen, onCloseSidebar }) => {
  const menuItems = [
    { icon: '📊', label: 'Dashboard' },
    { icon: '👥', label: 'Users' },
    { icon: '🏥', label: 'Providers' },
    { icon: '📅', label: 'Appointments' },
    { icon: '💻', label: 'Sessions' },
    { icon: '📈', label: 'Analytics' },
    { icon: '📋', label: 'Audit Log' },
    { icon: '⚙️', label: 'Settings' },
  ]

  const handleItemClick = (label) => {
    setActiveView(label)
    if (onCloseSidebar) {
      onCloseSidebar()
    }
  }

  return (
    <aside className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      <h2 className="admin-sidebar-title">Admin Portal</h2>
      <nav className="admin-sidebar-nav">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={`admin-nav-item ${activeView === item.label ? 'active' : ''}`}
            onClick={() => handleItemClick(item.label)}
          >
            <span className="admin-nav-icon">{item.icon}</span>
            <span className="admin-nav-label">{item.label}</span>
            {activeView === item.label && <span className="admin-nav-indicator"></span>}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default AdminSidebar

