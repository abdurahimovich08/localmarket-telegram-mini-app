import { useNavigate } from 'react-router-dom'
import type { Listing } from '../types'
import PremiumProductCard from './PremiumProductCard'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { trackCrossSellClick } from '../lib/storeAnalytics'

interface CrossSellSectionProps {
  listings: Listing[]
  title?: string
  maxItems?: number
  currentListingId?: string
  currentCategory?: string
  storeId?: string
  userId?: number
}

export default function CrossSellSection({ 
  listings, 
  title = "Bu do'konda ko'p sotiladiganlar",
  maxItems = 4,
  currentListingId,
  currentCategory,
  storeId,
  userId
}: CrossSellSectionProps) {
  const navigate = useNavigate()

  // ✅ CROSS-SELL RELEVANCY: Smart algorithm
  // Priority: Same category > Discounted + Top sold > Top sold > Random
  const getRelevantItems = () => {
    // Exclude current listing
    const filtered = listings.filter(l => l.listing_id !== currentListingId)
    
    // 1. Same category + discounted + top sold
    const sameCategoryDiscounted = filtered
      .filter(l => {
        const hasDiscount = l.old_price && l.price && l.old_price > l.price
        return currentCategory && l.category === currentCategory && hasDiscount
      })
      .sort((a, b) => {
        const aScore = (a.favorite_count || 0) + (a.view_count || 0)
        const bScore = (b.favorite_count || 0) + (b.view_count || 0)
        return bScore - aScore
      })
    
    if (sameCategoryDiscounted.length >= maxItems) {
      return sameCategoryDiscounted.slice(0, maxItems)
    }

    // 2. Same category + top sold
    const sameCategory = filtered
      .filter(l => currentCategory && l.category === currentCategory)
      .sort((a, b) => {
        const aScore = (a.favorite_count || 0) + (a.view_count || 0)
        const bScore = (b.favorite_count || 0) + (b.view_count || 0)
        return bScore - aScore
      })
    
    if (sameCategory.length >= maxItems) {
      return sameCategory.slice(0, maxItems)
    }

    // 3. Discounted + top sold (any category)
    const discountedTop = filtered
      .filter(l => {
        const hasDiscount = l.old_price && l.price && l.old_price > l.price
        return hasDiscount
      })
      .sort((a, b) => {
        const aScore = (a.favorite_count || 0) + (a.view_count || 0)
        const bScore = (b.favorite_count || 0) + (b.view_count || 0)
        return bScore - aScore
      })
    
    // Combine same category + discounted top
    const combined = [...sameCategory, ...discountedTop]
      .filter((item, index, self) => self.findIndex(i => i.listing_id === item.listing_id) === index)
      .slice(0, maxItems)
    
    if (combined.length >= maxItems) {
      return combined
    }

    // 4. Top sold (any category)
    const topSold = filtered
      .sort((a, b) => {
        const aScore = (a.favorite_count || 0) + (a.view_count || 0)
        const bScore = (b.favorite_count || 0) + (b.view_count || 0)
        return bScore - aScore
      })
      .slice(0, maxItems)
    
    return topSold
  }

  const relevantItems = getRelevantItems()

  if (relevantItems.length === 0) return null

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4 px-4">
        <SparklesIcon className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 px-4">
        {relevantItems.map((listing) => (
          <div
            key={listing.listing_id}
            onClick={() => {
              // ✅ Track cross-sell click
              if (storeId) {
                trackCrossSellClick(storeId, listing.listing_id, userId)
              }
            }}
          >
            <PremiumProductCard
              listing={listing}
              onAddToCart={() => {
                // Add to cart logic
                console.log('Add to cart:', listing.listing_id)
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
