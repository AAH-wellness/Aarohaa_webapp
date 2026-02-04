import React from 'react'
import './ProviderCardSkeleton.css'

const ProviderCardSkeleton = () => {
  return (
    <div className="provider-card-skeleton">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar Skeleton */}
        <div className="flex-shrink-0">
          <div className="provider-card-skeleton-avatar"></div>
        </div>

        {/* Info Skeleton */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="provider-card-skeleton-line provider-card-skeleton-line--name"></div>
          <div className="provider-card-skeleton-line provider-card-skeleton-line--title"></div>
          <div className="provider-card-skeleton-line provider-card-skeleton-line--rating"></div>
          <div className="flex gap-2">
            <div className="provider-card-skeleton-chip"></div>
            <div className="provider-card-skeleton-chip provider-card-skeleton-chip--wide"></div>
            <div className="provider-card-skeleton-chip provider-card-skeleton-chip--narrow"></div>
          </div>
          <div className="space-y-2">
            <div className="provider-card-skeleton-line"></div>
            <div className="provider-card-skeleton-line provider-card-skeleton-line--short"></div>
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="flex-shrink-0 flex items-start sm:items-center">
          <div className="provider-card-skeleton-btn"></div>
        </div>
      </div>
    </div>
  )
}

const ProviderCardSkeletonList = ({ count = 6 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProviderCardSkeleton key={index} />
      ))}
    </div>
  )
}

export default ProviderCardSkeletonList

