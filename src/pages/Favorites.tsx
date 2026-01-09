import { useEffect, useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { getFavorites, removeFavorite } from '../lib/supabase'
import type { Favorite } from '../types'
import ListingCard from '../components/ListingCard'
import BottomNav from '../components/BottomNav'

export default function Favorites() {
  const { user } = useUser()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) return

      setLoading(true)
      try {
        const data = await getFavorites(user.telegram_user_id)
        setFavorites(data)
      } catch (error) {
        console.error('Error loading favorites:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [user])

  const handleToggleFavorite = async (listingId: string) => {
    if (!user) return

    try {
      await removeFavorite(user.telegram_user_id, listingId)
      setFavorites((prev) => prev.filter((f) => f.listing_id !== listingId))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Saved Items</h1>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">❤️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h2>
          <p className="text-gray-600 text-center">
            Save items you're interested in by tapping the heart icon
          </p>
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {favorites.map((favorite) => (
              favorite.listing && (
                <ListingCard
                  key={favorite.favorite_id}
                  listing={favorite.listing}
                  isFavorite={true}
                  onToggleFavorite={() => handleToggleFavorite(favorite.listing_id)}
                />
              )
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
