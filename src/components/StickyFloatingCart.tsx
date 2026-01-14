import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getCart } from '../lib/supabase'
import type { CartItem } from '../types'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'

interface StickyFloatingCartProps {
  storeId?: string
}

export default function StickyFloatingCart({ storeId }: StickyFloatingCartProps) {
  const { user } = useUser()
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!user) {
      setCartItems([])
      setIsVisible(false)
      return
    }

    const loadCart = async () => {
      try {
        const items = await getCart(user.telegram_user_id)
        // Filter by store if storeId provided
        const filteredItems = storeId 
          ? items.filter(item => item.listing?.store_id === storeId)
          : items
        
        setCartItems(filteredItems)
        setIsVisible(filteredItems.length > 0)
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }

    loadCart()
    
    // Refresh every 5 seconds
    const interval = setInterval(loadCart, 5000)
    return () => clearInterval(interval)
  }, [user, storeId])

  if (!isVisible || cartItems.length === 0) return null

  // Calculate total
  const totalPrice = cartItems.reduce((sum, item) => {
    const price = item.listing?.price || 0
    return sum + (price * item.quantity)
  }, 0)

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div 
      className="fixed left-4 right-4 z-40 animate-slide-up"
      style={{
        bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' // Bottom nav height + safe area
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Cart Summary */}
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <ShoppingBagIcon className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium opacity-90">Savatda</div>
              <div className="text-lg font-bold">
                {totalItems} ta mahsulot • {totalPrice.toLocaleString()} so'm
              </div>
            </div>
          </div>
        </div>

        {/* ✅ 2 CTA Buttons */}
        <div className="p-3 flex gap-2">
          <button
            onClick={() => {
              // Track event
              if (storeId) {
                import('../lib/storeAnalytics').then(m => 
                  m.trackStoreEvent({
                    event_type: 'floating_cart_click',
                    store_id: storeId,
                    user_telegram_id: user?.telegram_user_id,
                    metadata: { action: 'continue_shopping' }
                  })
                )
              }
              // Scroll to top to continue shopping
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm"
          >
            Davom etish
          </button>
          <button
            onClick={() => {
              // Track event
              if (storeId) {
                import('../lib/storeAnalytics').then(m => 
                  m.trackStoreEvent({
                    event_type: 'checkout_start',
                    store_id: storeId,
                    user_telegram_id: user?.telegram_user_id,
                    metadata: { source: 'floating_cart' }
                  })
                )
              }
              navigate('/cart')
            }}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all transform active:scale-[0.98] text-sm"
          >
            Buyurtma berish
          </button>
        </div>
      </div>
    </div>
  )
}
