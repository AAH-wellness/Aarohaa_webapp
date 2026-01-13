import React from 'react'

const ProviderCardSkeleton = () => {
  return (
    <div className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar Skeleton */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gray-200"></div>
        </div>

        {/* Info Skeleton */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Name Skeleton */}
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          
          {/* Title Skeleton */}
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          
          {/* Rating Skeleton */}
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          
          {/* Chips Skeleton */}
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          </div>
          
          {/* Bio Skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="flex-shrink-0 flex items-start sm:items-center">
          <div className="h-11 bg-gray-200 rounded-xl w-40"></div>
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

