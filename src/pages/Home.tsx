import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getListings } from '../lib/supabase'
import { requestLocation } from '../lib/telegram'
import type { Listing } from '../types'
import ListingCard from '../components/ListingCard'
import BottomNav from '../components/BottomNav'
import { MagnifyingGlassIcon, FunnelIcon, PlusCircleIcon } from '@heroicons/react/24/outline'

export default function Home() {
  const { user } = useUser()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true)
      try {
        // Request location
        const location = await requestLocation()

        // Load listings
        const data = await getListings({
          radius: user?.search_radius_miles || 10,
          userLat: location?.latitude,
          userLon: location?.longitude
        })
        setListings(data)
      } catch (error) {
        console.error('Error loading listings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadListings()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">LocalMarket</h1>
            <div className="flex items-center gap-2">
              <Link
                to="/create"
                className="p-2 text-primary hover:text-primary/80 transition-colors"
                title="Create Listing"
              >
                <PlusCircleIcon className="w-6 h-6" />
              </Link>
              <Link
                to="/search"
                className="p-2 text-gray-600 hover:text-primary transition-colors"
              >
                <MagnifyingGlassIcon className="w-6 h-6" />
              </Link>
              <button className="p-2 text-gray-600 hover:text-primary transition-colors">
                <FunnelIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading listings...</p>
          </div>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h2>
          <p className="text-gray-600 text-center mb-6">
            Be the first to post something in your neighborhood!
          </p>
          <Link
            to="/create"
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Create Listing
          </Link>
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.listing_id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
