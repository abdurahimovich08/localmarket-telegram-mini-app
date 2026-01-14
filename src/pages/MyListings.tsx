import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { useUnifiedItems } from '../hooks/useUnifiedItems'
import { useEntityMutations } from '../hooks/useEntityMutations'
import { getListingAnalytics, type ListingAnalytics } from '../lib/analytics'
import { useQueryClient } from '@tanstack/react-query'
import UniversalCard from '../components/UniversalCard'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import { PlusIcon, PencilIcon, CheckIcon, EyeIcon, HeartIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { UnifiedProduct } from '../types/unified'

export default function MyListings() {
  const navigate = useNavigate()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [analytics, setAnalytics] = useState<Record<string, ListingAnalytics>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // ✅ useUnifiedItems hook - faqat user'ning listing'lari (product va store_product)
  const { 
    data: unifiedItems = [], 
    isLoading, 
    error,
    refetch 
  } = useUnifiedItems({
    ownerId: user?.telegram_user_id,
    // itemType undefined = hamma listing'lar (product + store_product)
    // Service'lar uchun alohida sahifa bo'lishi mumkin
    enabled: !!user,
  })

  // Filter: faqat listing'lar (service'lar emas)
  const myListings = unifiedItems.filter(item => 
    item.type === 'product' || item.type === 'store_product'
  )

  // ✅ useEntityMutations hook - update va delete uchun
  const { update, remove, isLoading: isMutating, error: mutationError } = useEntityMutations('listing', {
    onSuccess: () => {
      setErrorMessage(null)
      // Query avtomatik invalidate qilinadi
      refetch()
    },
    onError: (error) => {
      setErrorMessage(error.message)
    },
  })

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }

    // Load analytics for each listing
    const loadAnalytics = async () => {
      const listingsOnly = unifiedItems.filter(item => 
        item.type === 'product' || item.type === 'store_product'
      )
      
      const analyticsMap: Record<string, ListingAnalytics> = {}
      for (const item of listingsOnly) {
        const listingAnalytics = await getListingAnalytics(item.id)
        if (listingAnalytics) {
          analyticsMap[item.id] = listingAnalytics
        }
      }
      setAnalytics(analyticsMap)
    }

    if (unifiedItems.length > 0) {
      loadAnalytics()
    }
  }, [unifiedItems, user, navigate])

  // ✅ Optimistic update: Mark as sold
  const handleMarkAsSold = async (itemId: string) => {
    try {
      setErrorMessage(null)
      // Optimistic update
      queryClient.setQueryData(['unified_items'], (old: UnifiedProduct[] = []) => {
        return old.map((item) => 
          item.id === itemId 
            ? { ...item, status: 'sold' as const }
            : item
        )
      })
      
      await update(itemId, { status: 'sold' })
    } catch (error: any) {
      // Rollback on error
      refetch()
      setErrorMessage(error.message || 'Xatolik yuz berdi')
    }
  }

  // ✅ Optimistic delete
  const handleDelete = async (itemId: string) => {
    if (!confirm('Bu e\'lonni o\'chirishni xohlaysizmi?')) {
      return
    }

    try {
      setErrorMessage(null)
      // Optimistic update - remove from cache immediately
      queryClient.setQueryData(['unified_items'], (old: UnifiedProduct[] = []) => {
        return old.filter((item) => item.id !== itemId)
      })
      
      await remove(itemId)
    } catch (error: any) {
      // Rollback on error
      refetch()
      setErrorMessage(error.message || 'O\'chirishda xatolik yuz berdi')
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

      {/* Error Message */}
      {errorMessage && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Xatolik yuz berdi</h2>
          <p className="text-gray-600 text-center mb-6">
            {error.message || 'E\'lonlarni yuklashda xatolik yuz berdi'}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Qayta Urinib Ko'ring
          </button>
        </div>
      ) : myListings.length === 0 ? (
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
          {myListings.map((item) => (
            <div key={item.stableId || item.id} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <Link to={item.detailUrl}>
                <UniversalCard
                  data={item}
                  variant="marketplace"
                  layout="grid"
                />
              </Link>
              <div className="p-3 border-t border-gray-200">
                {/* Analytics - faqat listing'lar uchun */}
                {analytics[item.id] && (item.type === 'product' || item.type === 'store_product') && (
                  <div className="flex items-center gap-4 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <EyeIcon className="w-4 h-4" />
                      <span className="font-medium">{analytics[item.id].total_views}</span>
                      <span className="text-xs">ko&apos;rish</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <HeartIcon className="w-4 h-4" />
                      <span className="font-medium">{analytics[item.id].favorite_count}</span>
                      <span className="text-xs">yoqtirish</span>
                    </div>
                    <div className="flex-1"></div>
                    <div className="text-xs text-gray-500">
                      {analytics[item.id].views_last_7_days} (7 kun)
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : item.status === 'sold'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {item.status === 'active' ? 'Faol' : item.status === 'sold' ? 'Sotilgan' : "O'chirilgan"}
                  </span>
                  <div className="flex-1"></div>
                  {item.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleMarkAsSold(item.id)}
                        disabled={isMutating}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-green-600 transition-colors disabled:opacity-50"
                      >
                        <CheckIcon className="w-4 h-4" />
                        <span>Sotilgan</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isMutating}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>O'chirish</span>
                      </button>
                    </>
                  )}
                  <Link
                    to={item.type === 'service' 
                      ? `/service/${item.id}/edit` 
                      : `/listing/${item.id}/edit`
                    }
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
