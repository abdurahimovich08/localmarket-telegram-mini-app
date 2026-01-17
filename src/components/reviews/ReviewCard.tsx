/**
 * ReviewCard - Individual review display
 * 
 * Beautiful card showing:
 * - Reviewer info with avatar
 * - Star rating
 * - Review photos (swipeable)
 * - Review text
 * - Verified purchase badge
 * - Helpful/not helpful buttons
 * - Seller reply
 */

import { useState } from 'react'
import { 
  StarIcon, 
  CheckBadgeIcon, 
  HandThumbUpIcon, 
  HandThumbDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid'
import { formatDistanceToNow } from 'date-fns'
import { uz } from 'date-fns/locale'

interface ReviewCardProps {
  review: {
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
  onHelpful?: (reviewId: string, isHelpful: boolean) => void
  isOwnReview?: boolean
}

export default function ReviewCard({ review, onHelpful, isOwnReview }: ReviewCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showFullText, setShowFullText] = useState(false)
  const [imageFullscreen, setImageFullscreen] = useState<string | null>(null)

  const hasPhotos = review.photos && review.photos.length > 0
  const isLongText = (review.review_text?.length || 0) > 200

  // Generate avatar color based on user id
  const avatarColor = review.reviewer?.telegram_user_id 
    ? `hsl(${review.reviewer.telegram_user_id % 360}, 70%, 50%)`
    : '#8B5CF6'

  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
      <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
        {/* Header */}
        <div className="p-4 flex items-start gap-3">
          {/* Avatar */}
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {review.reviewer?.photo_url ? (
              <img 
                src={review.reviewer.photo_url} 
                alt="" 
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(review.reviewer?.first_name)
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-medium">
                {review.reviewer?.first_name || 'Foydalanuvchi'}
              </span>
              {review.is_verified_purchase && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                  <CheckBadgeIcon className="w-3 h-3" />
                  Tasdiqlangan xarid
                </span>
              )}
            </div>
            
            {/* Rating & Date */}
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon 
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating ? 'text-yellow-400' : 'text-white/10'
                    }`}
                  />
                ))}
              </div>
              <span className="text-white/40 text-xs">
                {formatDistanceToNow(new Date(review.created_at), { 
                  addSuffix: true, 
                  locale: uz 
                })}
              </span>
            </div>

            {/* Variant */}
            {(review.purchased_size || review.purchased_color) && (
              <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                <span>Variant:</span>
                {review.purchased_color && (
                  <span className="px-2 py-0.5 bg-white/10 rounded">{review.purchased_color}</span>
                )}
                {review.purchased_size && (
                  <span className="px-2 py-0.5 bg-white/10 rounded">{review.purchased_size}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Photos */}
        {hasPhotos && (
          <div className="relative">
            <div 
              className="aspect-video bg-black/20 cursor-pointer"
              onClick={() => setImageFullscreen(review.photos![currentPhotoIndex])}
            >
              <img
                src={review.photos![currentPhotoIndex]}
                alt="Review photo"
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Photo Navigation */}
            {review.photos!.length > 1 && (
              <>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {review.photos!.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPhotoIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentPhotoIndex ? 'bg-white w-4' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
                
                {currentPhotoIndex > 0 && (
                  <button
                    onClick={() => setCurrentPhotoIndex(i => i - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                  </button>
                )}
                
                {currentPhotoIndex < review.photos!.length - 1 && (
                  <button
                    onClick={() => setCurrentPhotoIndex(i => i + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-white" />
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Review Text */}
        {review.review_text && (
          <div className="px-4 py-3">
            <p className={`text-white/80 text-sm leading-relaxed whitespace-pre-wrap ${
              !showFullText && isLongText ? 'line-clamp-3' : ''
            }`}>
              {review.review_text}
            </p>
            {isLongText && (
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="text-violet-400 text-sm mt-1 hover:underline"
              >
                {showFullText ? 'Yopish' : 'To\'liq o\'qish'}
              </button>
            )}
          </div>
        )}

        {/* Seller Reply */}
        {review.seller_reply && (
          <div className="mx-4 mb-4 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-violet-400 text-xs font-medium">Sotuvchi javobi</span>
            </div>
            <p className="text-white/70 text-sm">{review.seller_reply}</p>
          </div>
        )}

        {/* Actions */}
        {!isOwnReview && onHelpful && (
          <div className="px-4 pb-4 flex items-center gap-4">
            <span className="text-white/40 text-xs">Foydali bo'ldimi?</span>
            <button
              onClick={() => onHelpful(review.review_id, true)}
              className="flex items-center gap-1 text-white/50 hover:text-emerald-400 transition-colors"
            >
              <HandThumbUpIcon className="w-4 h-4" />
              <span className="text-xs">{review.helpful_count || 0}</span>
            </button>
            <button
              onClick={() => onHelpful(review.review_id, false)}
              className="flex items-center gap-1 text-white/50 hover:text-red-400 transition-colors"
            >
              <HandThumbDownIcon className="w-4 h-4" />
              <span className="text-xs">{review.not_helpful_count || 0}</span>
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      {imageFullscreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setImageFullscreen(null)}
        >
          <img
            src={imageFullscreen}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setImageFullscreen(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-xl">×</span>
          </button>
        </div>
      )}
    </>
  )
}
