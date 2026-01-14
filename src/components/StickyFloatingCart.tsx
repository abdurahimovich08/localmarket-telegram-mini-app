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
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-slide-up">
      <button
        onClick={() => navigate('/cart')}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between transform hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBagIcon className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium opacity-90">Savatga o'tish</div>
            <div className="text-lg font-bold">
              {totalItems} ta mahsulot • {totalPrice.toLocaleString()} so'm
            </div>
          </div>
        </div>
        <div className="text-2xl">→</div>
      </button>
    </div>
  )
}
