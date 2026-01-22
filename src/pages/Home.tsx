/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  🏪 HOME PAGE - Play Store Style Services Marketplace
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Play Store inspired design:
 * - Featured services at top
 * - Category sections with horizontal scrolling
 * - Trending services
 * - New services
 * - Search bar
 */

import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { useAppMode } from '../contexts/AppModeContext'
import { useUnifiedItems } from '../hooks/useUnifiedItems'
import { useNavigateWithCtx } from '../lib/preserveCtx'
import { trackUserSearch } from '../lib/tracking'
import UniversalCard from '../components/UniversalCard'
import { MagnifyingGlassIcon, PlusCircleIcon, SparklesIcon, FireIcon, StarIcon } from '@heroicons/react/24/outline'

// Service categories with emojis
const SERVICE_CATEGORIES = [
  { id: 'dasturlash', name: 'Dasturlash', emoji: '💻' },
  { id: 'dizayn', name: 'Dizayn', emoji: '🎨' },
  { id: 'marketing', name: 'Marketing', emoji: '📢' },
  { id: 'biznes', name: 'Biznes', emoji: '💼' },
  { id: 'yozuv', name: 'Yozuv & Kontent', emoji: '✍️' },
  { id: 'boshqa', name: 'Boshqa', emoji: '🔧' },
]

export default function Home() {
  const { user } = useUser()
  const { mode } = useAppMode()
  const navigate = useNavigate()
  const navigateWithCtx = useNavigateWithCtx()
  const [searchQuery, setSearchQuery] = useState('')
  const [featuredServices, setFeaturedServices] = useState<any[]>([])
  const [trendingServices, setTrendingServices] = useState<any[]>([])
  const [servicesByCategory, setServicesByCategory] = useState<Record<string, any[]>>({})

  // Only show services
  const filters = useMemo(() => ({
    itemType: 'service' as const,
    limit: 100,
  }), [])

  const { 
    data: allServices = [], 
    isLoading, 
    isError,
    error,
    refetch 
  } = useUnifiedItems(filters)

  // Filter to only services
  const services = useMemo(() => {
    return allServices.filter(item => item.type === 'service')
  }, [allServices])

  // Load featured, trending, and categorized services
  useEffect(() => {
    if (services.length === 0) return

    // Featured: Top viewed services (last 7 days)
    const featured = [...services]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10)
    setFeaturedServices(featured)

    // Trending: Most viewed in last 24 hours (simplified: recent + high views)
    const trending = [...services]
      .sort((a, b) => {
        const aScore = (b.viewCount || 0) + (new Date(b.createdAt).getTime() / 1000000)
        const bScore = (a.viewCount || 0) + (new Date(a.createdAt).getTime() / 1000000)
        return aScore - bScore
      })
      .slice(0, 10)
    setTrendingServices(trending)

    // Group by category
    const byCategory: Record<string, any[]> = {}
    services.forEach(service => {
      const category = service.category || 'boshqa'
      if (!byCategory[category]) {
        byCategory[category] = []
      }
      byCategory[category].push(service)
    })
    setServicesByCategory(byCategory)
  }, [services])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      if (user?.telegram_user_id) {
        trackUserSearch(user.telegram_user_id, searchQuery.trim())
      }
      navigateWithCtx(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigateWithCtx('/search')
    }
  }

  const handleServiceClick = (service: any) => {
    navigateWithCtx(`/service/${service.id}`)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
            </div>
            <div className="mt-3 h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </header>

        {/* Content Skeleton */}
        <div className="p-4 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-6 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
              <div className="flex gap-4 overflow-x-auto">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex-shrink-0 w-48">
                    <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                    <div className="mt-2 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="mt-1 h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900">
            Xatolik yuz berdi
          </h2>
          <p className="mb-6 text-gray-600">
            {error?.message || 'Ma\'lumotlarni yuklashda xatolik yuz berdi'}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Qayta urinib ko'ring
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER - Search & Create
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Xizmatlar</h1>
            <Link
              to="/create-service-unified"
              className="p-2 text-primary hover:text-primary/80 transition-colors"
              title="Xizmat Yaratish"
            >
              <PlusCircleIcon className="w-6 h-6" />
            </Link>
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
              placeholder="Xizmatlarni qidiring..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED SERVICES - Top Section
      ═══════════════════════════════════════════════════════════════════ */}
      {featuredServices.length > 0 && (
        <section className="bg-white border-b border-gray-200 py-4">
          <div className="px-4 mb-3 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Tavsiya etilgan</h2>
          </div>
          <div className="px-4 overflow-x-auto">
            <div className="flex gap-4 pb-2">
              {featuredServices.slice(0, 8).map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className="flex-shrink-0 w-48 cursor-pointer"
                >
                  <UniversalCard
                    data={service}
                    variant="marketplace"
                    layout="grid"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TRENDING SERVICES
      ═══════════════════════════════════════════════════════════════════ */}
      {trendingServices.length > 0 && (
        <section className="bg-white border-b border-gray-200 py-4">
          <div className="px-4 mb-3 flex items-center gap-2">
            <FireIcon className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Trendda</h2>
          </div>
          <div className="px-4 overflow-x-auto">
            <div className="flex gap-4 pb-2">
              {trendingServices.slice(0, 8).map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className="flex-shrink-0 w-48 cursor-pointer"
                >
                  <UniversalCard
                    data={service}
                    variant="marketplace"
                    layout="grid"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CATEGORY SECTIONS - Horizontal Scroll
      ═══════════════════════════════════════════════════════════════════ */}
      {SERVICE_CATEGORIES.map((category) => {
        const categoryServices = servicesByCategory[category.id] || []
        if (categoryServices.length === 0) return null

        return (
          <section key={category.id} className="bg-white border-b border-gray-200 py-4">
            <div className="px-4 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{category.emoji}</span>
                <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
              </div>
              {categoryServices.length > 4 && (
                <button
                  onClick={() => navigateWithCtx(`/search?category=${category.id}`)}
                  className="text-sm text-primary font-medium"
                >
                  Barchasini ko'rish →
                </button>
              )}
            </div>
            <div className="px-4 overflow-x-auto">
              <div className="flex gap-4 pb-2">
                {categoryServices.slice(0, 8).map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    className="flex-shrink-0 w-48 cursor-pointer"
                  >
                    <UniversalCard
                      data={service}
                      variant="marketplace"
                      layout="grid"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      {/* ═══════════════════════════════════════════════════════════════════
          NEW SERVICES - Latest
      ═══════════════════════════════════════════════════════════════════ */}
      {services.length > 0 && (
        <section className="bg-white border-b border-gray-200 py-4">
          <div className="px-4 mb-3 flex items-center gap-2">
            <StarIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Yangi xizmatlar</h2>
          </div>
          <div className="px-4 overflow-x-auto">
            <div className="flex gap-4 pb-2">
              {[...services]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 8)
                .map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    className="flex-shrink-0 w-48 cursor-pointer"
                  >
                    <UniversalCard
                      data={service}
                      variant="marketplace"
                      layout="grid"
                    />
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          EMPTY STATE
      ═══════════════════════════════════════════════════════════════════ */}
      {services.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">🛠️</div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900">
            Hozircha xizmatlar yo'q
          </h2>
          <p className="text-center mb-6 text-gray-600">
            Birinchi xizmatni siz yarating!
          </p>
          <Link
            to="/create-service-unified"
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Xizmat Yaratish
          </Link>
        </div>
      )}
    </div>
  )
}
