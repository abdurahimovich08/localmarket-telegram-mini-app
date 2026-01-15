/**
 * Seller Memory Banner Component
 * 
 * Shows "Netflix-level" UX: "Avvalgidek krossovka joylaysizmi?"
 * 
 * Appears when user has previous taxonomy selection history
 */

import { useEffect, useState } from 'react'
import { getLastTaxonomy, type LastTaxonomy } from '../../services/SellerMemory'
import { CLOTHING_TAXONOMY } from '../../taxonomy/clothing.uz'
import type { TaxonNode } from '../../taxonomy/clothing.uz'
import { trackEvent } from '../../lib/tracking'

interface SellerMemoryBannerProps {
  userId: string
  onSelect: (leaf: TaxonNode) => void
  onDismiss: () => void
}

export default function SellerMemoryBanner({
  userId,
  onSelect,
  onDismiss,
}: SellerMemoryBannerProps) {
  const [lastTaxonomy, setLastTaxonomy] = useState<LastTaxonomy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check localStorage for dismissal
    const dismissed = localStorage.getItem(`seller_memory_dismissed_${userId}`)
    if (dismissed === 'true') {
      setIsDismissed(true)
      setIsLoading(false)
      return
    }

    // Load last taxonomy
    const loadLastTaxonomy = async () => {
      try {
        const taxonomy = await getLastTaxonomy(userId)
        setLastTaxonomy(taxonomy)
      } catch (error) {
        console.error('Error loading last taxonomy:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLastTaxonomy()
  }, [userId])

  // Don't show if dismissed, loading, or no history
  if (isLoading || isDismissed || !lastTaxonomy) {
    return null
  }

  // Find taxonomy node
  const taxonomyNode = CLOTHING_TAXONOMY.find(
    (node) => node.id === lastTaxonomy.leaf_id
  )

  if (!taxonomyNode) {
    return null
  }

  const handleSelect = () => {
    trackEvent('seller_memory_select', {
      taxonomy_leaf_id: lastTaxonomy.leaf_id,
      taxonomy_path: lastTaxonomy.path_uz,
      source: 'banner',
    })

    // Haptic feedback
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light')
    }

    onSelect(taxonomyNode)
  }

  const handleDismiss = () => {
    // Save dismissal to localStorage
    localStorage.setItem(`seller_memory_dismissed_${userId}`, 'true')
    setIsDismissed(true)

    trackEvent('seller_memory_dismiss', {
      taxonomy_leaf_id: lastTaxonomy.leaf_id,
    })

    onDismiss()
  }

  return (
    <div className="mx-4 mt-4 mb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎯</span>
            <h3 className="font-semibold text-gray-900 text-sm">
              Avvalgidek {lastTaxonomy.path_uz} joylaysizmi?
            </h3>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Oxirgi marta siz {lastTaxonomy.path_uz} sotgan edingiz
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSelect}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors active:scale-98"
            >
              Ha, avvalgidek
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Boshqa tanlash
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Yopish"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
