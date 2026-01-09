import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getListings } from '../lib/supabase'
import { requestLocation } from '../lib/telegram'
import type { Listing } from '../types'
import ListingCard from '../components/ListingCard'
import BottomNav from '../components/BottomNav'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function Search() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true)
      try {
        const location = await requestLocation()
        const data = await getListings({
          search: searchQuery || undefined,
          radius: user?.search_radius_miles || 10,
          userLat: location?.lat,
          userLon: location?.lon
        })
        setListings(data)
      } catch (error) {
        console.error('Error loading listings:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      loadListings()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, user])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No results found' : 'Start searching'}
          </h2>
          <p className="text-gray-600 text-center">
            {searchQuery
              ? 'Try different keywords or check your filters'
              : 'Search for items in your neighborhood'}
          </p>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Found {listings.length} {listings.length === 1 ? 'result' : 'results'}
          </p>
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
