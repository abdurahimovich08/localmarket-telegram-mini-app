import { StarIcon, CheckCircleIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarIconOutline, ClockIcon } from '@heroicons/react/24/outline'
import type { Store } from '../types'
import TrustScoreTooltip from './TrustScoreTooltip'

interface StoreTrustScoreProps {
  store: Store
  averageResponseTime?: number // minutes
  className?: string
}

export default function StoreTrustScore({ 
  store, 
  averageResponseTime,
  className = '' 
}: StoreTrustScoreProps) {
  const rating = store.owner?.rating_average || 0
  const totalReviews = store.owner?.total_reviews || 0

  // Calculate response time badge
  const getResponseTimeBadge = () => {
    if (!averageResponseTime) return null
    
    if (averageResponseTime <= 5) {
      return { text: '⚡ 5 daqiqada javob', textColorClass: 'text-emerald-600', icon: 'fast' }
    } else if (averageResponseTime <= 30) {
      return { text: '✅ 30 daqiqada javob', textColorClass: 'text-blue-600', icon: 'medium' }
    } else if (averageResponseTime <= 60) {
      return { text: '⏰ 1 soatda javob', textColorClass: 'text-amber-600', icon: 'slow' }
    }
    return null
  }

  const responseBadge = getResponseTimeBadge()

  return (
    <div className={`bg-white rounded-xl p-4 border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-900">Ishonch ko'rsatkichlari</h3>
          <TrustScoreTooltip>
            <span></span>
          </TrustScoreTooltip>
        </div>
        {store.is_verified && (
          <div className="flex items-center gap-1 text-blue-600">
            <CheckCircleIcon className="w-4 h-4" />
            <span className="text-xs font-medium">Tasdiqlangan</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                i < Math.floor(rating) ? (
                  <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                ) : (
                  <StarIconOutline key={i} className="w-4 h-4 text-gray-300" />
                )
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
            {totalReviews > 0 && (
              <span className="text-xs text-gray-500">({totalReviews} sharh)</span>
            )}
          </div>
        )}

        {/* Response Time */}
        {responseBadge && (
          <div className={`flex items-center gap-2 ${responseBadge.textColorClass}`}>
            <ClockIcon className="w-4 h-4" />
            <span className="text-xs font-medium">{responseBadge.text}</span>
          </div>
        )}

        {/* Store Stats */}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          <div className="text-center">
            <div className="text-sm font-bold text-gray-900">{store.subscriber_count || 0}</div>
            <div className="text-xs text-gray-500">Obunachi</div>
          </div>
          {store.owner?.items_sold_count && store.owner.items_sold_count > 0 && (
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900">{store.owner.items_sold_count}</div>
              <div className="text-xs text-gray-500">Sotilgan</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
