import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getCartCount } from '../lib/supabase'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'

export default function CartIcon() {
  const { user } = useUser()
  const [count, setCount] = useState(0)

  useEffect(() => {
    const loadCartCount = async () => {
      if (!user) {
        setCount(0)
        return
      }

      try {
        const cartCount = await getCartCount(user.telegram_user_id)
        setCount(cartCount)
      } catch (error) {
        console.error('Error loading cart count:', error)
      }
    }

    loadCartCount()

    // Refresh count every 5 seconds
    const interval = setInterval(loadCartCount, 5000)

    return () => clearInterval(interval)
  }, [user])

  return (
    <Link
      to="/cart"
      className="relative p-2 text-gray-700 hover:text-primary transition-colors"
    >
      <ShoppingBagIcon className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
