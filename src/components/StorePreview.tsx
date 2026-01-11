import type { Store, Listing } from '../types'
import { CheckBadgeIcon, StarIcon, BellIcon } from '@heroicons/react/24/outline'
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid'

interface StorePreviewProps {
  store: Partial<Store> & { 
    name: string
    category: Store['category']
    owner?: Store['owner']
  }
  listings?: Listing[]
  isPreview?: boolean
}

export default function StorePreview({ store, listings = [], isPreview = true }: StorePreviewProps) {
  const storeUsername = store.owner?.username || `store_${store.store_id?.slice(0, 8) || 'new'}`
  const storeRating = store.owner?.rating_average || 0
  const isSubscribed = store.is_subscribed || false

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP BANNER - YouTube style (reduced height) */}
      {store.banner_url ? (
        <div className="relative w-full h-40 md:h-48 overflow-hidden bg-gray-100">
          <img 
            src={store.banner_url} 
            alt={store.name}
            className="w-full h-full object-cover object-center"
          />
        </div>
      ) : (
        <div className="relative w-full h-40 md:h-48 bg-gradient-to-r from-primary to-primary-dark overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xl md:text-2xl font-bold">{store.name || 'Store Name'}</span>
          </div>
        </div>
      )}

      {/* STORE IDENTITY BLOCK */}
      <div className="bg-white border-b border-gray-200 px-4 pb-4">
        <div className="flex items-start gap-4 -mt-12">
          {/* Logo */}
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-primary/20 flex items-center justify-center">
              <span className="text-3xl text-primary font-bold">
                {store.name?.[0]?.toUpperCase() || 'S'}
              </span>
            </div>
          )}

          {/* Store Info */}
          <div className="flex-1 pt-2">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{store.name || 'Store Name'}</h2>
              {store.is_verified && (
                <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
              )}
              {isPreview && !store.is_verified && (
                <CheckBadgeIcon className="w-5 h-5 text-gray-400" title="Store faollashgach verified badge chiqadi" />
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">@{storeUsername}</p>
            
            {/* Rating and Products Count */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                {storeRating > 0 ? (
                  <>
                    <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold text-gray-900">{storeRating.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-500">—</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">{listings.length}</span>
                <span className="text-sm text-gray-600">mahsulot</span>
              </div>
            </div>
          </div>
        </div>

        {/* DESCRIPTION BLOCK */}
        {store.description && (
          <div className="mt-4">
            <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-3">
              {store.description}
            </p>
          </div>
        )}

        {/* SUBSCRIBE BUTTON (disabled in preview) */}
        {isPreview ? (
          <button
            disabled
            className="mt-4 w-full py-3 px-4 rounded-lg font-semibold bg-gray-200 text-gray-500 cursor-not-allowed flex items-center justify-center gap-2"
            title="Preview rejimida faollashmaydi"
          >
            <BellIcon className="w-5 h-5" />
            Obuna bo'lish
          </button>
        ) : (
          <button
            className={`mt-4 w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              isSubscribed
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {isSubscribed ? (
              <>
                <BellIconSolid className="w-5 h-5" />
                Obuna bo'lingan 🔔
              </>
            ) : (
              <>
                <BellIcon className="w-5 h-5" />
                Obuna bo'lish
              </>
            )}
          </button>
        )}

        {isPreview && (
          <p className="mt-2 text-xs text-gray-500 text-center">
            Preview rejimi - Store faollashgach ishlaydi
          </p>
        )}
      </div>

      {/* NAVIGATION TABS (disabled in preview) */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto scrollbar-hide">
          <button
            disabled={isPreview}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              isPreview 
                ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                : 'border-primary text-primary'
            }`}
          >
            Mahsulotlar ({listings.length})
          </button>
          <button
            disabled={isPreview}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              isPreview 
                ? 'border-transparent text-gray-400 cursor-not-allowed' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Aksiyalar (0)
          </button>
          <button
            disabled={isPreview}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              isPreview 
                ? 'border-transparent text-gray-400 cursor-not-allowed' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Postlar (0)
          </button>
        </div>
      </div>
    </div>
  )
}
