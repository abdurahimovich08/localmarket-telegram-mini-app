import { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import { useSearchParams } from 'react-router-dom'
import { getListings } from '../lib/supabase'
import { requestLocation } from '../lib/telegram'
import { sortListings } from '../lib/sorting'
import { trackUserSearch, trackListingView } from '../lib/tracking'
import type { Listing } from '../types'
import ListingCard from '../components/ListingCard'
import SearchFilters, { type SearchFilters as SearchFiltersType } from '../components/SearchFilters'
import CartIcon from '../components/CartIcon'
import BottomNav from '../components/BottomNav'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function Search() {
  const { user } = useUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialCategory = searchParams.get('category') || undefined
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFiltersType>({
    category: initialCategory as any,
    radius: user?.search_radius_miles || 10,
  })

  useEffect(() => {
    let isMounted = true

    const loadListings = async () => {
      setLoading(true)
      try {
        // Track search if query exists
        if (searchQuery.trim() && user?.telegram_user_id) {
          trackUserSearch(
            user.telegram_user_id,
            searchQuery.trim(),
            initialCategory,
            0 // Will be updated after results
          )
        }

        // Request location (will use cache if available)
        const location = await requestLocation()
        
        if (!isMounted) return

        // Get listings with filters
        const data = await getListings({
          search: searchQuery || undefined,
          category: filters.category || initialCategory,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          condition: filters.condition,
          radius: filters.radius || user?.search_radius_miles || 10,
          userLat: location?.latitude,
          userLon: location?.longitude,
          recentOnly: filters.recentOnly,
          boostedOnly: filters.boostedOnly,
        })
        
        if (!isMounted) return

        // Sort with advanced algorithm
        const sorted = await sortListings(
          data,
          user?.telegram_user_id,
          user?.search_radius_miles || 10
        )
        
        if (isMounted) {
          setListings(sorted)
        }
      } catch (error) {
        console.error('Error loading listings:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const debounceTimer = setTimeout(() => {
      loadListings()
    }, 300)

    return () => {
      isMounted = false
      clearTimeout(debounceTimer)
    }
  }, [searchQuery, filters, user?.search_radius_miles, user?.telegram_user_id])

  const handleListingClick = (listing: Listing) => {
    // Track view
    if (user?.telegram_user_id) {
      trackListingView(user.telegram_user_id, listing.listing_id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <CartIcon />
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qidiruv... (masalan: kamaz, kmz, машин, kuchmas mulk)"
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
        
        {/* Filters */}
        <SearchFilters filters={filters} onFiltersChange={setFilters} />
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? 'Natijalar topilmadi' : 'Qidiruvni boshlang'}
          </h2>
          <p className="text-gray-600 text-center">
            {searchQuery
              ? 'Boshqa kalit so\'zlarni sinab ko\'ring yoki filtrlarni tekshiring'
              : 'Mahallangizdagi buyumlarni qidiring'}
          </p>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            {listings.length} {listings.length === 1 ? 'natija' : 'natija'} topildi
            {initialCategory && (
              <span className="ml-2 text-primary">
                • {listings.find(l => l.category === initialCategory) ? 'Kategoriya' : ''}
              </span>
            )}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {listings.map((listing) => (
              <div
                key={listing.listing_id}
                onClick={() => {
                  handleListingClick(listing)
                  window.location.href = `/listing/${listing.listing_id}`
                }}
                className="cursor-pointer"
              >
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
