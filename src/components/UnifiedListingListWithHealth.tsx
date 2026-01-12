/**
 * Unified Listing List with Health Score Component
 * Phase 2: Shows services and products with health score badges
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateUnifiedHealthScore, getUnifiedHealthScoreBadge } from '../lib/unifiedListingHealthScore'
import { getListingTypeBadge } from '../lib/unifiedListing'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import type { UnifiedListing } from '../types/unified'

interface UnifiedListingListWithHealthProps {
  listings: UnifiedListing[]
  navigate: (path: string) => void
}

export default function UnifiedListingListWithHealth({ listings, navigate }: UnifiedListingListWithHealthProps) {
  const [healthScores, setHealthScores] = useState<Record<string, any>>({})
  const [expandedListing, setExpandedListing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHealthScores = async () => {
      if (listings.length === 0) {
        setLoading(false)
        return
      }

      const scores: Record<string, any> = {}
      
      // Load health scores for all listings in parallel
      await Promise.all(
        listings.map(async (listing) => {
          try {
            const health = await calculateUnifiedHealthScore(listing)
            scores[listing.listing_id] = health
          } catch (error) {
            console.error(`Error loading health score for ${listing.listing_id}:`, error)
          }
        })
      )

      setHealthScores(scores)
      setLoading(false)
    }

    loadHealthScores()
  }, [listings])

  if (listings.length === 0) {
    return null
  }

  const getListingDetailPath = (listing: UnifiedListing): string => {
    switch (listing.type) {
      case 'service':
        return `/service/${listing.listing_id}`
      case 'product':
        return `/listing/${listing.listing_id}`
      case 'store_product':
        // Store products are also displayed on /listing/{id} route (same as products)
        return `/listing/${listing.listing_id}`
      default:
        return '/'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Faol listinglarim</h2>
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const health = healthScores[listing.listing_id]
            const badge = health ? getUnifiedHealthScoreBadge(health.score) : null
            const typeBadge = getListingTypeBadge(listing.type)

            return (
              <div
                key={listing.listing_id}
                className="rounded-lg border border-gray-200 hover:border-primary transition-colors"
              >
                <button
                  onClick={() => setExpandedListing(expandedListing === listing.listing_id ? null : listing.listing_id)}
                  className="w-full text-left p-4 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{typeBadge.emoji}</span>
                        <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                        {badge && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${badge.bgColor} ${badge.color}`}>
                            {badge.emoji} {health.score}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {listing.view_count || 0} ko'rish • {listing.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(getListingDetailPath(listing))
                        }}
                        className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        Batafsil
                      </button>
                      {expandedListing === listing.listing_id ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Health Breakdown */}
                {expandedListing === listing.listing_id && health && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-200">
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Conversion</span>
                          <span className="font-semibold">{health.factors.conversion.toFixed(1)}/{health.factors.conversion + health.factors.engagement + health.factors.completeness + health.factors.ranking}</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${(health.factors.conversion / 100) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Engagement</span>
                          <span className="font-semibold">{health.factors.engagement.toFixed(1)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${(health.factors.engagement / 30) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Completeness</span>
                          <span className="font-semibold">{health.factors.completeness.toFixed(1)}/20</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${(health.factors.completeness / 20) * 100}%` }}
                          />
                        </div>
                      </div>
                      {health.recommendations.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-1">Tavsiyalar:</p>
                          <ul className="space-y-1">
                            {health.recommendations.map((rec, i) => (
                              <li key={i} className="text-xs text-gray-600">• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
