import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getListings } from '../lib/supabase'
import { requestLocation } from '../lib/telegram'
import { sortListings, getPersonalizedListings, getDealsOfDay } from '../lib/sorting'
import { getEnhancedPersonalizedListings } from '../lib/recommendations'
import { trackListingView, trackUserSearch } from '../lib/tracking'
import type { Listing } from '../types'
import ListingCard from '../components/ListingCard'
import CategoryCarousel from '../components/CategoryCarousel'
import CartIcon from '../components/CartIcon'
import BottomNav from '../components/BottomNav'
import { MagnifyingGlassIcon, PlusCircleIcon, QrCodeIcon } from '@heroicons/react/24/outline'

type TabType = 'personalized' | 'deals'

export default function Home() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [personalizedListings, setPersonalizedListings] = useState<Listing[]>([])
  const [dealsListings, setDealsListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('personalized')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadListings = async () => {
      setLoading(true)
      try {
        // Request location (will use cache if available)
        const location = await requestLocation()

        if (!isMounted) return

        // Load listings with limit for performance (50 for initial load)
        const allListings = await getListings({
          radius: user?.search_radius_miles || 10,
          userLat: location?.latitude,
          userLon: location?.longitude,
          limit: 50 // Limit initial load for faster performance
        })

        if (!isMounted) return

        // Sort with advanced algorithm (only first 50)
        const sorted = await sortListings(
          allListings,
          user?.telegram_user_id,
          user?.search_radius_miles || 10
        )

        // Get enhanced personalized listings (search + view history) - limit to 30
        const personalized = user?.telegram_user_id
          ? await getEnhancedPersonalizedListings(sorted, user.telegram_user_id, 30)
          : await getPersonalizedListings(sorted, user?.telegram_user_id, user?.search_radius_miles || 10, 30)

        // Get deals of the day - limit to 20
        const deals = getDealsOfDay(sorted, 20)

        if (isMounted) {
          setListings(sorted)
          setPersonalizedListings(personalized)
          setDealsListings(deals)
        }
      } catch (error) {
        console.error('Error loading listings:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadListings()

    return () => {
      isMounted = false
    }
  }, [user?.search_radius_miles, user?.telegram_user_id])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Track search
      if (user?.telegram_user_id) {
        trackUserSearch(user.telegram_user_id, searchQuery.trim())
      }
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/search')
    }
  }

  const handleListingClick = (listing: Listing) => {
    // Track view
    if (user?.telegram_user_id) {
      trackListingView(user.telegram_user_id, listing.listing_id)
    }
    // Navigate to listing detail
    navigate(`/listing/${listing.listing_id}`)
  }

  const displayedListings = activeTab === 'personalized' ? personalizedListings : dealsListings

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Search */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-3 space-y-3">
          {/* Top Row: Logo + Actions */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">LocalMarket</h1>
            <div className="flex items-center gap-2 relative z-50">
              <CartIcon />
              <Link
                to="/create"
                className="p-2 text-primary hover:text-primary/80 transition-colors relative z-50"
                title="E'lon Yaratish"
              >
                <PlusCircleIcon className="w-6 h-6" />
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Qidiruv..."
              className="w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={handleSearch}
                className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                title="QR Scanner"
              >
                <QrCodeIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Carousel */}
      <CategoryCarousel />

      {/* Tabs: Siz uchun / Kun narxlari */}
      <div className="bg-white border-b border-gray-200 sticky top-[140px] z-30">
        <div className="flex">
          <button
            onClick={() => setActiveTab('personalized')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'personalized'
                ? 'text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Siz uchun
            {activeTab === 'personalized' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'deals'
                ? 'text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kun narxlari
            {activeTab === 'deals' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
            )}
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">E'lonlar yuklanmoqda...</p>
          </div>
        </div>
      ) : displayedListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">
            {activeTab === 'personalized' ? '🎯' : '💰'}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {activeTab === 'personalized' 
              ? 'Hali tavsiyalar yo\'q' 
              : 'Hozircha aksiyalar yo\'q'}
          </h2>
          <p className="text-gray-600 text-center mb-6">
            {activeTab === 'personalized'
              ? 'Bir nechta e\'lon ko\'rib, qidiruv qiling. Biz sizga mos tavsiyalar beramiz!'
              : 'Tez orada aksiya va bepul e\'lonlar paydo bo\'ladi.'}
          </p>
          <Link
            to="/create"
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            E'lon Yaratish
          </Link>
        </div>
      ) : (
        <div className="p-4">
          {/* Results count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {displayedListings.length} {displayedListings.length === 1 ? 'natija' : 'natija'} ko'rsatilmoqda
            </p>
            {activeTab === 'personalized' && personalizedListings.length > 0 && (
              <span className="text-xs text-primary bg-blue-50 px-2 py-1 rounded-full">
                Sizga mos
              </span>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-4">
            {displayedListings.map((listing) => (
              <div
                key={listing.listing_id}
                onClick={() => handleListingClick(listing)}
              >
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>

          {/* Show all listings if personalized/deals are less */}
          {activeTab === 'personalized' && displayedListings.length < listings.length && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setActiveTab('personalized')}
                className="text-primary hover:underline text-sm font-medium"
              >
                Barcha e'lonlarni ko'rish ({listings.length})
              </button>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
