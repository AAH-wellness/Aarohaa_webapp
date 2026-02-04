import React, { useState } from 'react'
import { Star, CheckCircle2 } from 'lucide-react'
import ProviderAvailabilityModal from './ProviderAvailabilityModal'
import './ProviderCard.css'

const ProviderCard = ({ provider, onBookSession, onNavigateToAppointments, getInitials }) => {
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  // Split specialty by comma or semicolon
  const specialties = provider.specialty
    ? provider.specialty.split(/[,;]/).map(s => s.trim()).filter(s => s)
    : []
  
  const displaySpecialties = specialties.slice(0, 3)
  const remainingCount = specialties.length - 3

  // Rating display logic
  const hasReviews = provider.reviewsCount > 0 && provider.rating > 0
  const rating = provider.rating ? provider.rating.toFixed(1) : '0.0'

  return (
    <div className="provider-card">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Left: Avatar */}
        <div className="flex-shrink-0">
          <div className="provider-card-avatar">
            {getInitials(provider.name)}
          </div>
        </div>

        {/* Middle: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="provider-card-name truncate">
                  {provider.name}
                </h3>
                {provider.verified && (
                  <div className="provider-card-verified" title="Verified Provider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="sr-only">Verified</span>
                  </div>
                )}
              </div>
              
              {/* Title */}
              <p className="text-sm text-gray-500 mb-3">
                {provider.title || provider.specialty || 'Wellness Professional'}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                {hasReviews ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                      <span className="text-sm font-semibold text-gray-900">{rating}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      ({provider.reviewsCount} {provider.reviewsCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="provider-card-new-badge">
                      New Provider
                    </span>
                    <span className="text-sm text-gray-500">No reviews yet</span>
                  </>
                )}
              </div>

              {/* Specialty Pills */}
              {displaySpecialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {displaySpecialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="provider-card-pill"
                    >
                      {specialty}
                    </span>
                  ))}
                  {remainingCount > 0 && (
                    <span className="provider-card-pill provider-card-pill--muted">
                      +{remainingCount} more
                    </span>
                  )}
                </div>
              )}

              {/* Bio Preview */}
              {provider.bio && (
                <p className="text-sm text-gray-600 max-w-xl overflow-hidden" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {provider.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: CTA Button */}
        <div className="flex-shrink-0 flex items-start sm:items-center">
          <button
            onClick={() => setShowAvailabilityModal(true)}
            className="provider-card-cta"
          >
            Book Session
          </button>
        </div>
      </div>

      {/* Availability Modal */}
      {showAvailabilityModal && (
        <ProviderAvailabilityModal
          provider={provider}
          onClose={() => setShowAvailabilityModal(false)}
          onBook={(booking) => {
            // Booking is handled in the modal, just close it
            setShowAvailabilityModal(false)
          }}
          onNavigateToAppointments={onNavigateToAppointments}
        />
      )}
    </div>
  )
}

export default ProviderCard

