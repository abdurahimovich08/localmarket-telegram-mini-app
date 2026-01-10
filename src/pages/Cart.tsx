import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getCart, removeFromCart, clearCart } from '../lib/supabase'
import { openTelegramChat } from '../lib/telegram'
import type { CartItem } from '../types'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import { TrashIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function Cart() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCart = async () => {
      if (!user) return

      setLoading(true)
      try {
        const data = await getCart(user.telegram_user_id)
        setCartItems(data)
      } catch (error) {
        console.error('Error loading cart:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCart()
  }, [user])

  const handleRemoveItem = async (cartItemId: string) => {
    if (!user) return

    try {
      await removeFromCart(user.telegram_user_id, cartItemId)
      setCartItems((prev) => prev.filter((item) => item.cart_item_id !== cartItemId))
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  const handleClearCart = async () => {
    if (!user) return
    if (!confirm('Barcha mahsulotlarni olib tashlamoqchimisiz?')) return

    try {
      await clearCart(user.telegram_user_id)
      setCartItems([])
    } catch (error) {
      console.error('Error clearing cart:', error)
    }
  }

  const handleCheckout = () => {
    if (!user || cartItems.length === 0) return

    // Group items by seller
    const itemsBySeller: Record<number, CartItem[]> = {}
    cartItems.forEach((item) => {
      if (item.listing?.seller_telegram_id) {
        const sellerId = item.listing.seller_telegram_id
        if (!itemsBySeller[sellerId]) {
          itemsBySeller[sellerId] = []
        }
        itemsBySeller[sellerId].push(item)
      }
    })

    // Open chat with each seller
    Object.entries(itemsBySeller).forEach(([sellerId, items]) => {
      const seller = items[0].listing?.seller
      if (seller?.username) {
        const itemNames = items.map((item) => item.listing?.title).join(', ')
        const totalPrice = items.reduce((sum, item) => {
          const price = item.listing?.price || 0
          return sum + price * item.quantity
        }, 0)
        
        const message = `Salom! Men sizning savatchangizda quyidagi mahsulotlarni sotib olmoqchiman:\n\n${itemNames}\n\nJami: ${totalPrice.toLocaleString()} so'm\n\nBu mahsulotlar hali ham mavjudmi?`
        openTelegramChat(seller.username, message)
      }
    })
  }

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.listing?.price || 0
      return sum + price * item.quantity
    }, 0)
  }

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-xl font-bold text-gray-900">Savatcha</h1>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Tozalash
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <ShoppingBagIcon className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Savatcha bo'sh</h2>
          <p className="text-gray-600 text-center mb-6">
            Savatchangizga mahsulotlar qo'shing
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Mahsulotlar Qidirish
          </button>
        </div>
      ) : (
        <>
          <div className="p-4 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.cart_item_id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  {item.listing?.photos && item.listing.photos.length > 0 && (
                    <img
                      src={item.listing.photos[0]}
                      alt={item.listing.title}
                      className="w-20 h-20 object-cover rounded-lg"
                      onClick={() => navigate(`/listing/${item.listing_id}`)}
                    />
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-gray-900 mb-1 truncate cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/listing/${item.listing_id}`)}
                    >
                      {item.listing?.title || 'Mahsulot'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Miqdori: {item.quantity}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {item.listing?.is_free
                        ? 'Bepul'
                        : `${((item.listing?.price || 0) * item.quantity).toLocaleString()} so'm`}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.cart_item_id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="sticky bottom-20 bg-white border-t border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700">Jami mahsulotlar:</span>
              <span className="font-semibold">{itemCount} ta</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900">Jami summa:</span>
              <span className="text-2xl font-bold text-primary">
                {calculateTotal().toLocaleString()} so'm
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              💬 Sotuvchiga Yozish
            </button>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  )
}
