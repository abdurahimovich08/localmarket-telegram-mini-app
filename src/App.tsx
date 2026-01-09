import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { initTelegram, getTelegramUser } from './lib/telegram'
import { createOrUpdateUser, getUser } from './lib/supabase'
import type { User } from './types'
import Home from './pages/Home'
import ListingDetail from './pages/ListingDetail'
import CreateListing from './pages/CreateListing'
import MyListings from './pages/MyListings'
import Profile from './pages/Profile'
import Favorites from './pages/Favorites'
import Search from './pages/Search'
import { UserContext } from './contexts/UserContext'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Telegram WebApp
        const webApp = initTelegram()
        if (!webApp) {
          console.warn('Not running in Telegram WebApp')
          setLoading(false)
          return
        }

        // Get Telegram user data - wait a bit for Telegram to initialize
        await new Promise(resolve => setTimeout(resolve, 500))
        let telegramUser = getTelegramUser()
        
        // Retry if not found
        if (!telegramUser) {
          console.log('User not found, retrying...')
          await new Promise(resolve => setTimeout(resolve, 500))
          telegramUser = getTelegramUser()
        }
        
        if (!telegramUser) {
          console.error('No Telegram user data found after retries')
          console.log('WebApp state:', webApp)
          console.log('initDataUnsafe:', webApp?.initDataUnsafe)
          setLoading(false)
          return
        }
        
        console.log('Telegram user found:', telegramUser)

        // Check if user exists in database
        let dbUser = await getUser(telegramUser.id)

        // Create or update user if needed
        if (!dbUser) {
          dbUser = await createOrUpdateUser({
            telegram_user_id: telegramUser.id,
            username: telegramUser.username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            profile_photo_url: telegramUser.photo_url,
            search_radius_miles: 10,
            is_premium: false,
            rating_average: 0,
            total_reviews: 0,
            items_sold_count: 0,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          })
        } else {
          // Update last active
          await createOrUpdateUser({
            telegram_user_id: telegramUser.id,
            last_active: new Date().toISOString()
          })
        }

        setUser(dbUser)
      } catch (error) {
        console.error('Error initializing app:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading LocalMarket...</p>
        </div>
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/create" element={<CreateListing />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/profile/:id?" element={<Profile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/search" element={<Search />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UserContext.Provider>
  )
}

export default App
