import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getListings, updateListing } from '../lib/supabase'
import { getListingAnalytics, type ListingAnalytics } from '../lib/analytics'
import type { Listing } from '../types'
import ListingCard from '../components/ListingCard'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import { PlusIcon, PencilIcon, CheckIcon, EyeIcon, HeartIcon } from '@heroicons/react/24/outline'

export default function MyListings() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Record<string, ListingAnalytics>>({})

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }

    const loadListings = async () => {
      setLoading(true)
      try {
        // Get all listings for this user
        const data = await getListings()
        const myListings = data.filter((l) => l.seller_telegram_id === user.telegram_user_id)
        setListings(myListings)

        // Load analytics for each listing
        const analyticsMap: Record<string, ListingAnalytics> = {}
        for (const listing of myListings) {
          const listingAnalytics = await getListingAnalytics(listing.listing_id)
          if (listingAnalytics) {
            analyticsMap[listing.listing_id] = listingAnalytics
          }
        }
        setAnalytics(analyticsMap)
      } catch (error) {
        console.error('Error loading listings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadListings()
  }, [user, navigate])

  const handleMarkAsSold = async (listingId: string) => {
    try {
      await updateListing(listingId, { status: 'sold' })
      setListings((prev) =>
        prev.map((l) => (l.listing_id === listingId ? { ...l, status: 'sold' } : l))
      )
    } catch (error) {
      console.error('Error marking as sold:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <BackButton />
              <h1 className="text-xl font-bold text-gray-900">Mening E'lonlarim</h1>
            </div>
            <Link
              to="/create"
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="font-medium">Yangi</span>
            </Link>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hali e'lonlar yo'q</h2>
          <p className="text-gray-600 text-center mb-6">
            Birinchi e'loningizni yaratarak sotishni boshlang!
          </p>
          <Link
            to="/create"
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            E'lon Yaratish
          </Link>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {listings.map((listing) => (
            <div key={listing.listing_id} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <Link to={`/listing/${listing.listing_id}`}>
                <ListingCard listing={listing} />
              </Link>
              <div className="p-3 border-t border-gray-200">
                {/* Analytics */}
                {analytics[listing.listing_id] && (
                  <div className="flex items-center gap-4 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <EyeIcon className="w-4 h-4" />
                      <span className="font-medium">{analytics[listing.listing_id].total_views}</span>
                      <span className="text-xs">ko&apos;rish</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <HeartIcon className="w-4 h-4" />
                      <span className="font-medium">{analytics[listing.listing_id].favorite_count}</span>
                      <span className="text-xs">yoqtirish</span>
                    </div>
                    <div className="flex-1"></div>
                    <div className="text-xs text-gray-500">
                      {analytics[listing.listing_id].views_last_7_days} (7 kun)
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    listing.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : listing.status === 'sold'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {listing.status === 'active' ? 'Faol' : listing.status === 'sold' ? 'Sotilgan' : "O'chirilgan"}
                  </span>
                  <div className="flex-1"></div>
                  {listing.status === 'active' && (
                    <button
                      onClick={() => handleMarkAsSold(listing.listing_id)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-green-600 transition-colors"
                    >
                      <CheckIcon className="w-4 h-4" />
                      <span>Sotilgan Deb Belgilash</span>
                    </button>
                  )}
                  <Link
                    to={`/listing/${listing.listing_id}/edit`}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span>Tahrirlash</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
