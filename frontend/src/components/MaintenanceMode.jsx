import React from 'react'
import './MaintenanceMode.css'

const MaintenanceMode = () => {
  return (
    <div className="maintenance-mode">
      <div className="maintenance-container">
        <div className="maintenance-icon">🔧</div>
        <h1 className="maintenance-title">Platform Under Maintenance</h1>
        <p className="maintenance-message">
          We're currently performing scheduled maintenance to improve your experience.
          The platform will be back online shortly.
        </p>
        <div className="maintenance-details">
          <div className="maintenance-detail-item">
            <span className="detail-icon">⏰</span>
            <span className="detail-text">Expected completion: Soon</span>
          </div>
          <div className="maintenance-detail-item">
            <span className="detail-icon">📧</span>
            <span className="detail-text">Contact: admin@aarohaa.com</span>
          </div>
        </div>
        <div className="maintenance-animation">
          <div className="gear gear-1">⚙️</div>
          <div className="gear gear-2">⚙️</div>
          <div className="gear gear-3">⚙️</div>
        </div>
      </div>
    </div>
  )
}

export default MaintenanceMode




