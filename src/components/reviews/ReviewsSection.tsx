/**
 * ReviewsSection - Complete reviews section for listing page
 * 
 * Features:
 * - Rating summary with distribution bars
 * - Filter by rating
 * - Photo reviews only filter
 * - Sort options
 * - Infinite scroll
 * - Write review CTA
 */

import { useState, useMemo } from 'react'
import { 
  StarIcon, 
  CameraIcon,
  FunnelIcon,
  PencilSquareIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/solid'
import ReviewCard from './ReviewCard'

interface Review {
  review_id: string
  rating: number
  review_text?: string
  photos?: string[]
  is_verified_purchase?: boolean
  purchased_size?: string
  purchased_color?: string
  helpful_count?: number
  not_helpful_count?: number
  seller_reply?: string
  seller_reply_at?: string
  created_at: string
  reviewer?: {
    telegram_user_id: number
    first_name?: string
    username?: string
    photo_url?: string
  }
}

interface ReviewsSectionProps {
  reviews: Review[]
  averageRating: number
  totalReviews: number
  canWriteReview: boolean
  hasVerifiedPurchase: boolean
  onWriteReview: () => void
  onHelpful?: (reviewId: string, isHelpful: boolean) => void
  currentUserTelegramId?: number
}

type SortOption = 'recent' | 'helpful' | 'highest' | 'lowest'
type FilterOption = 'all' | 'photos' | 'verified' | 1 | 2 | 3 | 4 | 5

export default function ReviewsSection({
  reviews,
  averageRating,
  totalReviews,
  canWriteReview,
  hasVerifiedPurchase,
  onWriteReview,
  onHelpful,
  currentUserTelegramId
}: ReviewsSectionProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Calculate rating distribution
  const ratingDistribution = useMemo(() => {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating as keyof typeof dist]++
      }
    })
    return dist
  }, [reviews])

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let result = [...reviews]
    
    // Apply filters
    if (filterBy === 'photos') {
      result = result.filter(r => r.photos && r.photos.length > 0)
    } else if (filterBy === 'verified') {
      result = result.filter(r => r.is_verified_purchase)
    } else if (typeof filterBy === 'number') {
      result = result.filter(r => r.rating === filterBy)
    }
    
    // Apply sort
    switch (sortBy) {
      case 'helpful':
        result.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0))
        break
      case 'highest':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'lowest':
        result.sort((a, b) => a.rating - b.rating)
        break
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    
    return result
  }, [reviews, filterBy, sortBy])

  const photoReviewsCount = reviews.filter(r => r.photos && r.photos.length > 0).length
  const verifiedReviewsCount = reviews.filter(r => r.is_verified_purchase).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-xl">Sharxlar</h2>
        <span className="text-white/50 text-sm">{totalReviews} ta sharx</span>
      </div>

      {/* Rating Summary */}
      <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-3xl p-5 border border-white/10">
        <div className="flex gap-6">
          {/* Average Rating */}
          <div className="text-center flex-shrink-0">
            <div className="text-5xl font-bold text-white mb-1">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-0.5 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon 
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-white/20'
                  }`}
                />
              ))}
            </div>
            <p className="text-white/50 text-xs">{totalReviews} ta sharx</p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating as keyof typeof ratingDistribution]
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
              
              return (
                <button
                  key={rating}
                  onClick={() => setFilterBy(filterBy === rating ? 'all' : rating)}
                  className={`flex items-center gap-2 w-full group transition-opacity ${
                    filterBy !== 'all' && filterBy !== rating ? 'opacity-40' : ''
                  }`}
                >
                  <span className="text-white/60 text-xs w-3">{rating}</span>
                  <StarIcon className="w-3 h-3 text-yellow-400" />
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-white/40 text-xs w-8 text-right">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => setFilterBy(filterBy === 'photos' ? 'all' : 'photos')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
              filterBy === 'photos'
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <CameraIcon className="w-4 h-4" />
            {photoReviewsCount} rasmli
          </button>
          <button
            onClick={() => setFilterBy(filterBy === 'verified' ? 'all' : 'verified')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
              filterBy === 'verified'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <CheckBadgeIcon className="w-4 h-4" />
            {verifiedReviewsCount} tasdiqlangan
          </button>
        </div>
      </div>

      {/* Write Review CTA */}
      {canWriteReview ? (
        <button
          onClick={onWriteReview}
          className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 hover:from-violet-600 hover:to-fuchsia-600 transition-all active:scale-[0.98]"
        >
          <PencilSquareIcon className="w-5 h-5" />
          Sharx yozing
        </button>
      ) : !hasVerifiedPurchase ? (
        <div className="text-center py-4 px-6 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-white/60 text-sm">
            Sharx yozish uchun avval mahsulotni sotib oling va sotuvchi tomonidan tasdiqlanishi kerak
          </p>
        </div>
      ) : null}

      {/* Sort & Filter Controls */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
              showFilters ? 'bg-violet-500 text-white' : 'bg-white/5 text-white/60'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            Filtr
          </button>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="recent">Yangilari</option>
            <option value="helpful">Foydali</option>
            <option value="highest">Yuqori baho</option>
            <option value="lowest">Past baho</option>
          </select>
        </div>
      )}

      {/* Filter Tags */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 animate-fadeIn">
          <button
            onClick={() => setFilterBy('all')}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              filterBy === 'all'
                ? 'bg-white text-slate-900'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Hammasi
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setFilterBy(filterBy === rating ? 'all' : rating)}
              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-all ${
                filterBy === rating
                  ? 'bg-yellow-400 text-slate-900'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {rating} <StarIcon className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Reviews List */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.review_id}
              review={review}
              onHelpful={onHelpful}
              isOwnReview={review.reviewer?.telegram_user_id === currentUserTelegramId}
            />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="text-center py-12">
          <p className="text-white/40">Bu filtr bo'yicha sharxlar topilmadi</p>
          <button
            onClick={() => setFilterBy('all')}
            className="text-violet-400 text-sm mt-2 hover:underline"
          >
            Barcha sharxlarni ko'rish
          </button>
        </div>
      ) : (
        <div className="text-center py-12 bg-white/5 rounded-2xl">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-white/60">Hali sharxlar yo'q</p>
          <p className="text-white/40 text-sm mt-1">Birinchi bo'lib sharx yozing!</p>
        </div>
      )}
    </div>
  )
}
