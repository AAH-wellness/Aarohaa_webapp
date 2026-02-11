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
      <div className="admin-sidebar-legal">
        <a href="/terms" className="admin-sidebar-legal-link">Terms of Service</a>
        <a href="/privacy" className="admin-sidebar-legal-link">Privacy Policy</a>
        <a href="/cookies" className="admin-sidebar-legal-link">Cookie Policy</a>
        <a href="/disclaimer" className="admin-sidebar-legal-link">Disclaimer</a>
        <span className="admin-sidebar-legal-copyright">© Aarohaa Wellness</span>
      </div>
    </aside>
  )
}

export default AdminSidebar

