import React from 'react'
import { Star, CheckCircle2 } from 'lucide-react'

const ProviderCard = ({ provider, onBookSession, getInitials }) => {
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
    <div className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 p-6">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Left: Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d0b6a8] to-[#c4a896] flex items-center justify-center text-green-800 font-bold text-xl shadow-sm">
            {getInitials(provider.name)}
          </div>
        </div>

        {/* Middle: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold text-green-900 truncate">
                  {provider.name}
                </h3>
                {provider.verified && (
                  <div className="flex items-center gap-1 text-green-600" title="Verified Provider">
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
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
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
                      className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
                    >
                      {specialty}
                    </span>
                  ))}
                  {remainingCount > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
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
            onClick={() => onBookSession(provider.id)}
            className="bg-green-800 hover:bg-green-900 text-white rounded-xl px-6 py-3 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] font-medium text-sm whitespace-nowrap w-full sm:w-auto"
          >
            Book Session
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProviderCard

