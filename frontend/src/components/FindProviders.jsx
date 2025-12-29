import React from 'react'
import './FindProviders.css'

const FindProviders = ({ onBookSession }) => {
  const providers = [
    {
      value: 'dr-maya-patel',
      initials: 'DM',
      name: 'Dr. Maya Patel',
      title: 'Licensed Therapist',
      rating: 4.9,
      reviews: 127,
      price: 3,
      description: 'Specializes in anxiety, stress management, and mindfulness practices.',
    },
    {
      value: 'john-kumar',
      initials: 'JK',
      name: 'John Kumar',
      title: 'Wellness Coach',
      rating: 4.8,
      reviews: 89,
      price: 2,
      description: 'Nutrition, fitness, and lifestyle optimization expert.',
    },
    {
      value: 'sarah-rodriguez',
      initials: 'SR',
      name: 'Sarah Rodriguez',
      title: 'Meditation Teacher',
      rating: 4.9,
      reviews: 156,
      price: 1.5,
      description: 'Mindfulness meditation and spiritual wellness guidance.',
    },
  ]

  const handleBookSession = (providerValue) => {
    if (onBookSession) {
      onBookSession(providerValue)
    }
  }

  return (
    <div className="find-providers">
      <h1 className="providers-title">Find Wellness Professionals</h1>
      <div className="providers-grid">
        {providers.map((provider, index) => (
          <div key={index} className="provider-card">
            <div className="provider-header">
              <div className="provider-avatar">{provider.initials}</div>
              <div className="provider-info">
                <h3 className="provider-name">{provider.name}</h3>
                <p className="provider-title">{provider.title}</p>
              </div>
              <div className="provider-price">${provider.price}/min</div>
            </div>
            <div className="provider-rating">
              <span className="rating-star">★</span>
              <span className="rating-value">{provider.rating}</span>
              <span className="rating-reviews">({provider.reviews} reviews)</span>
            </div>
            <p className="provider-description">{provider.description}</p>
            <button 
              className="provider-button"
              onClick={() => handleBookSession(provider.value)}
            >
              Book Session
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FindProviders
