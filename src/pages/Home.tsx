import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { supabase } from '../lib/supabase'
import { getStores } from '../lib/supabase'
import { sortListings, getPersonalizedListings, getDealsOfDay } from '../lib/sorting'
import { getEnhancedPersonalizedListings } from '../lib/recommendations'
import { trackListingView, trackUserSearch } from '../lib/tracking'
import type { Listing, Store } from '../types'
import ListingCard from '../components/ListingCard'
import ListingCardEbay from '../components/ListingCardEbay'
import Pagination from '../components/Pagination'
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
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('personalized')
  const [searchQuery, setSearchQuery] = useState('')
  // CRITICAL: Pagination state is only in React state, NEVER in localStorage
  // This ensures fresh data every time user loads the page
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    let isMounted = true
    let refreshInterval: NodeJS.Timeout | null = null

    const loadListings = async (forceRefresh = false) => {
      // Don't show loading spinner on refresh to avoid flickering
      if (!forceRefresh) {
        setLoading(true)
      }
      try {
        // CRITICAL: Barcha e'lonlarni olamiz, hech qanday filter yo'q
        // Database allaqachon "Hamma uchun ochiq" - frontend ham ochiq bo'lishi kerak
        // Joylashuv filtri (radius, userLat, userLon) OLIB TASHLANDI
        // Seller filtri OLIB TASHLANDI
        
        const { data, error } = await supabase
          .from('listings')
          .select(`
            *,
            seller:users!seller_telegram_id(telegram_user_id, first_name, username, profile_photo_url)
          `)
          .eq('status', 'active') // Faqat faol e'lonlar
          .order('is_boosted', { ascending: false }) // Targ'ib qilinganlar birinchi
          .order('created_at', { ascending: false }) // Eng yangisi tepada
          .limit(100) // Performance uchun limit

        if (error) {
          console.error('Error fetching listings:', error)
          return
        }

        if (!isMounted) return

        const allListings = data || []

        console.log("Barcha e'lonlar yuklandi:", allListings.length, "ta")

        // Sort with advanced algorithm (only first 50)
        const sorted = await sortListings(
          allListings,
          user?.telegram_user_id,
          100 // Max radius (barcha e'lonlar)
        )

        // Get enhanced personalized listings (search + view history) - limit to 30
        const personalized = user?.telegram_user_id
          ? await getEnhancedPersonalizedListings(sorted, user.telegram_user_id, 30)
          : await getPersonalizedListings(sorted, user?.telegram_user_id, 100, 30)

        // Get deals of the day - limit to 20
        const deals = getDealsOfDay(sorted, 20)

        if (isMounted) {
          setListings(sorted)
          setPersonalizedListings(personalized)
          setDealsListings(deals)
        }

        // Load random stores
        const randomStores = await getStores(3, user?.telegram_user_id)
        if (isMounted) {
          setStores(randomStores)
        }
      } catch (error) {
        console.error('Error loading listings:', error)
      } finally {
        if (isMounted && !forceRefresh) {
          setLoading(false)
        }
      }
    }

    // Initial load
    loadListings()

    // Refresh listings every 30 seconds when page is visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        loadListings(true) // Force refresh without loading spinner
      }
    }

    // Refresh when page becomes visible (user switches back to tab)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Refresh every 30 seconds if page is visible
    refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && isMounted) {
        loadListings(true) // Silent refresh
      }
    }, 30000) // 30 seconds

    // Refresh on window focus (user switches back to app)
    const handleFocus = () => {
      if (isMounted) {
        loadListings(true) // Silent refresh
      }
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      isMounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [user?.telegram_user_id]) // search_radius_miles dependency olib tashlandi - endi kerak emas

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
    // Track view with subcategory_id for granular recommendations
    if (user?.telegram_user_id) {
      trackListingView(user.telegram_user_id, listing.listing_id, listing.subcategory_id)
    }
    // Navigate to listing detail
    navigate(`/listing/${listing.listing_id}`)
  }

  const displayedListings = activeTab === 'personalized' ? personalizedListings : dealsListings
  
  // Pagination logic - IMPORTANT: Use client-side pagination only for UI
  // The actual data is already sorted by created_at DESC from database
  // This ensures new listings appear first even when paginated
  const totalPages = Math.ceil(displayedListings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedListings = displayedListings.slice(startIndex, endIndex)
  
  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

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

      {/* Stores Section */}
      {stores.length > 0 && (
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="px-4 mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Do'konlar</h2>
          </div>
          <div className="px-4 overflow-x-auto">
            <div className="flex gap-4">
              {stores.map((store) => (
                <div
                  key={store.store_id}
                  onClick={() => navigate(`/store/${store.store_id}`)}
                  className="flex-shrink-0 w-64 bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  {store.banner_url ? (
                    <div className="relative w-full h-20 overflow-hidden">
                      <img
                        src={store.banner_url}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-20 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                  )}
                  <div className="p-3 relative">
                    <div className="flex items-start gap-3">
                      {store.logo_url ? (
                        <img
                          src={store.logo_url}
                          alt={store.name}
                          className="w-12 h-12 rounded-full border-2 border-white -mt-6 bg-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-white -mt-6 bg-primary/20 flex items-center justify-center">
                          <span className="text-lg text-primary font-semibold">
                            {store.name[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-medium text-gray-900 truncate">{store.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {store.subscriber_count} obunachi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

          {/* List (eBay-style) */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {paginatedListings.map((listing) => (
              <div
                key={listing.listing_id}
                onClick={() => handleListingClick(listing)}
              >
                <ListingCardEbay listing={listing} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={displayedListings.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}

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
