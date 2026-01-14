import { useEffect, useState } from 'react'

interface SkeletonLoadingProps {
  type?: 'store' | 'product' | 'list'
  count?: number
}

export default function SkeletonLoading({ type = 'product', count = 6 }: SkeletonLoadingProps) {
  if (type === 'store') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Hero Skeleton */}
        <div className="relative">
          <div className="w-full h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
          <div className="px-4 pb-6 relative -mt-20">
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-28 h-28 bg-gray-200 rounded-2xl animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex gap-4 mt-3">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Skeleton */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="aspect-square bg-gray-200 animate-pulse"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-1/4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Product grid skeleton
  return (
    <div className="grid grid-cols-2 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="aspect-square bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
          <div className="p-4 space-y-2">
            <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-2/3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
