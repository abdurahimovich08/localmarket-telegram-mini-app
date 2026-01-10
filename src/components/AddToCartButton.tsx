import { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import { addToCart, removeFromCart, isInCart, getCart } from '../lib/supabase'
import { ShoppingBagIcon, CheckIcon } from '@heroicons/react/24/outline'
import { ShoppingBagIcon as ShoppingBagIconSolid } from '@heroicons/react/24/solid'

interface AddToCartButtonProps {
  listingId: string
  className?: string
  showIcon?: boolean
  onAdd?: () => void
  onRemove?: () => void
}

export default function AddToCartButton({
  listingId,
  className = '',
  showIcon = true,
  onAdd,
  onRemove,
}: AddToCartButtonProps) {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [inCart, setInCart] = useState(false)

  useEffect(() => {
    const checkCartStatus = async () => {
      if (!user) {
        setInCart(false)
        return
      }

      try {
        const status = await isInCart(user.telegram_user_id, listingId)
        setInCart(status)
      } catch (error) {
        console.error('Error checking cart status:', error)
      }
    }

    checkCartStatus()
  }, [user, listingId])

  const handleToggleCart = async () => {
    if (!user) {
      alert('Iltimos, avval tizimga kiring')
      return
    }

    setIsLoading(true)
    try {
      if (inCart) {
        // Remove from cart - need to get cart_item_id first
        const cart = await getCart(user.telegram_user_id)
        const cartItem = cart.find((item) => item.listing_id === listingId)
        if (cartItem) {
          await removeFromCart(user.telegram_user_id, cartItem.cart_item_id)
          setInCart(false)
          onRemove?.()
        }
      } else {
        // Add to cart
        await addToCart(user.telegram_user_id, listingId, 1)
        setInCart(true)
        onAdd?.()
      }
    } catch (error) {
      console.error('Error toggling cart:', error)
      alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggleCart}
      disabled={isLoading}
      className={`
        flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
        ${inCart
          ? 'bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100'
          : 'bg-primary text-white hover:bg-primary/90'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
      ) : (
        <>
          {showIcon && (
            <>
              {inCart ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <ShoppingBagIcon className="w-5 h-5" />
              )}
            </>
          )}
          <span>{inCart ? 'Savatchada' : 'Savatchaga Qo\'shish'}</span>
        </>
      )}
    </button>
  )
}
