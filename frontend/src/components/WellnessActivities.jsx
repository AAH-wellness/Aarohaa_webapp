import React from 'react'
import './WellnessActivities.css'

const WellnessActivities = () => {
  const activities = [
    {
      icon: '🧘',
      title: 'Daily Meditation',
      description: '10 minutes mindfulness practice',
      reward: 15,
      buttonText: 'Start Meditation',
    },
    {
      icon: '🚶',
      title: 'Walking Exercise',
      description: '30-minute outdoor walk',
      reward: 25,
      buttonText: 'Track Walk',
    },
    {
      icon: '📖',
      title: 'Gratitude Journal',
      description: "Write 3 things you're grateful for",
      reward: 10,
      buttonText: 'Open Journal',
    },
    {
      icon: '💧',
      title: 'Hydration Goal',
      description: 'Drink 8 glasses of water',
      reward: 5,
      buttonText: 'Log Water',
    },
  ]

  return (
    <div className="wellness-activities">
      <div className="activities-header">
        <h1 className="activities-title">Prescribed Wellness Activities</h1>
        <p className="activities-subtitle">
          Complete activities to earn AAH coins and improve your wellness!
        </p>
      </div>
      <div className="activities-grid">
        {activities.map((activity, index) => (
          <div key={index} className="activity-card">
            <div className="activity-icon">{activity.icon}</div>
            <h3 className="activity-title">{activity.title}</h3>
            <p className="activity-description">{activity.description}</p>
            <div className="activity-reward">
              Reward: {activity.reward} AAH Coins
            </div>
            <button className="activity-button">{activity.buttonText}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WellnessActivities


