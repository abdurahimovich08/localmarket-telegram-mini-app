import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getListings } from '../lib/supabase'
import { getSimilarListings } from '../lib/recommendations'
import { trackListingView } from '../lib/tracking'
import { useUser } from '../contexts/UserContext'
import { requestLocation } from '../lib/telegram'
import type { Listing } from '../types'
import ListingCard from './ListingCard'

interface SimilarListingsProps {
  listing: Listing
}

export default function SimilarListings({ listing }: SimilarListingsProps) {
  const { user } = useUser()
  const navigate = useNavigate()
  const [similarListings, setSimilarListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSimilarListings = async () => {
      setLoading(true)
      try {
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
      } catch (error) {
        console.error('Error loading similar listings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSimilarListings()
  }, [listing.listing_id, listing.category, user?.search_radius_miles])

  const handleListingClick = (similarListing: Listing) => {
    // Track view
    if (user?.telegram_user_id) {
      trackListingView(user.telegram_user_id, similarListing.listing_id)
    }
    navigate(`/listing/${similarListing.listing_id}`)
  }

  if (loading || similarListings.length === 0) {
    return null // Don't show if no similar listings
  }

  return (
    <div className="bg-gray-50 border-t border-gray-200 py-6 px-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        O'xshash E'lonlar
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {similarListings.map((similarListing) => (
          <div
            key={similarListing.listing_id}
            onClick={() => handleListingClick(similarListing)}
            className="cursor-pointer"
          >
            <ListingCard listing={similarListing} />
          </div>
        ))}
      </div>
    </div>
  )
}
