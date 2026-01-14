import { useNavigate } from 'react-router-dom'
import type { Listing } from '../types'
import PremiumProductCard from './PremiumProductCard'
import { SparklesIcon } from '@heroicons/react/24/outline'

interface CrossSellSectionProps {
  listings: Listing[]
  title?: string
  maxItems?: number
}

export default function CrossSellSection({ 
  listings, 
  title = "Bu do'konda ko'p sotiladiganlar",
  maxItems = 4
}: CrossSellSectionProps) {
  const navigate = useNavigate()

  // Get most popular items (by favorite_count or view_count)
  const popularItems = [...listings]
    .sort((a, b) => {
      const aScore = (a.favorite_count || 0) + (a.view_count || 0)
      const bScore = (b.favorite_count || 0) + (b.view_count || 0)
      return bScore - aScore
    })
    .slice(0, maxItems)

  if (popularItems.length === 0) return null

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4 px-4">
        <SparklesIcon className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 px-4">
        {popularItems.map((listing) => (
          <PremiumProductCard
            key={listing.listing_id}
            listing={listing}
            onAddToCart={() => {
              // Add to cart logic
              console.log('Add to cart:', listing.listing_id)
            }}
          />
        ))}
      </div>
    </div>
  )
}
