import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getListings, getListing } from '../lib/supabase'
import { getSimilarListings } from '../lib/recommendations'
import { getRecommendationsForListing, RecommendationScore } from '../lib/smartRecommendations'
import { trackListingView } from '../lib/tracking'
import { useUser } from '../contexts/UserContext'
import { requestLocation } from '../lib/telegram'
import type { Listing } from '../types'
import ListingCard from './ListingCard'
import { SparklesIcon } from '@heroicons/react/24/outline'

interface SimilarListingsProps {
  listing: Listing
}

export default function SimilarListings({ listing }: SimilarListingsProps) {
  const { user } = useUser()
  const navigate = useNavigate()
  const [similarListings, setSimilarListings] = useState<Listing[]>([])
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([])
  const [loading, setLoading] = useState(true)
  const [useSmartRecommendations, setUseSmartRecommendations] = useState(true)

  useEffect(() => {
    const loadSimilarListings = async () => {
      setLoading(true)
      try {
        // First, try smart recommendations (tag-based)
        const smartRecs = await getRecommendationsForListing(listing.listing_id, 6)
        
        if (smartRecs.length >= 3) {
          // Use smart recommendations
          setRecommendations(smartRecs)
          
          // Load full listing data for recommended items
          const recommendedListings = await Promise.all(
            smartRecs.map(async (rec) => {
              const listingData = await getListing(rec.listing_id)
              return listingData
            })
          )
          
          setSimilarListings(recommendedListings.filter((l): l is Listing => l !== null))
          setUseSmartRecommendations(true)
        } else {
          // Fallback to traditional similar listings
          setUseSmartRecommendations(false)
          
          // Get location for distance calculation
          const location = await requestLocation()

          // Get all active listings in same category
          const allListings = await getListings({
            category: listing.category,
            radius: user?.search_radius_miles || 50, // Wider radius for similar items
            userLat: location?.latitude,
            userLon: location?.longitude,
          })

          // Get similar listings
          const similar = await getSimilarListings(listing, allListings, 6)
          setSimilarListings(similar)
          setRecommendations([])
        }
      } catch (error) {
        console.error('Error loading similar listings:', error)
        // Fallback to traditional method on error
        try {
          setUseSmartRecommendations(false)
          const location = await requestLocation()
          const allListings = await getListings({
            category: listing.category,
            radius: user?.search_radius_miles || 50,
            userLat: location?.latitude,
            userLon: location?.longitude,
          })
          const similar = await getSimilarListings(listing, allListings, 6)
          setSimilarListings(similar)
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    loadSimilarListings()
  }, [listing.listing_id, listing.category, user?.search_radius_miles])

  const handleListingClick = (similarListing: Listing) => {
    // Track view
    if (user?.telegram_user_id) {
      trackListingView(user.telegram_user_id, similarListing.listing_id, similarListing.subcategory_id)
    }
    navigate(`/listing/${similarListing.listing_id}`)
  }

  // Get recommendation reason for a listing
  const getRecommendationReason = (listingId: string): string | null => {
    const rec = recommendations.find(r => r.listing_id === listingId)
    if (rec && rec.reasons.length > 0) {
      return rec.reasons[0] // Show first reason
    }
    return null
  }

  if (loading || similarListings.length === 0) {
    return null // Don't show if no similar listings
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200 py-6 px-4">
      <div className="flex items-center gap-2 mb-4">
        {useSmartRecommendations && (
          <SparklesIcon className="w-5 h-5 text-primary" />
        )}
        <h2 className="text-lg font-semibold text-gray-900">
          {useSmartRecommendations ? 'Sizga tavsiya etilgan' : 'O\'xshash E\'lonlar'}
        </h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {similarListings.map((similarListing) => {
          const reason = getRecommendationReason(similarListing.listing_id)
          
          return (
            <div
              key={similarListing.listing_id}
              onClick={() => handleListingClick(similarListing)}
              className="cursor-pointer group"
            >
              <div className="relative">
                <ListingCard listing={similarListing} />
                {reason && (
                  <div className="absolute -bottom-2 left-2 right-2 bg-primary/90 backdrop-blur-sm 
                                  text-white text-xs py-1 px-2 rounded-full text-center
                                  opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    {reason}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {useSmartRecommendations && (
        <p className="text-xs text-gray-500 mt-4 text-center">
          ✨ Tag va brend asosida tanlangan
        </p>
      )}
    </div>
  )
}
