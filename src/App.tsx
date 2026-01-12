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
import Cart from './pages/Cart'
import CreateStore from './pages/CreateStore'
import EditStore from './pages/EditStore'
import StoreDetail from './pages/StoreDetail'
import AIChatCreationPage from './pages/AIChatCreationPage'
import ServiceDetailsPage from './pages/ServiceDetailsPage'
import ServiceEdit from './pages/ServiceEdit'
import Dashboard from './pages/Dashboard'
import DashboardRank from './pages/DashboardRank'
import DashboardRecommendations from './pages/DashboardRecommendations'
import DashboardBenchmark from './pages/DashboardBenchmark'
import DashboardServiceDetail from './pages/DashboardServiceDetail'
import { UserContext } from './contexts/UserContext'
import Onboarding from './components/Onboarding'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('localmarket_onboarding_completed') === 'true'
    setShowOnboarding(!hasSeenOnboarding)
  }, [])

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

  // Show onboarding for new users
  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">LocalMarket yuklanmoqda...</p>
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
          <Route path="/cart" element={<Cart />} />
          <Route path="/create-store" element={<CreateStore />} />
          <Route path="/store/:id/edit" element={<EditStore />} />
          <Route path="/store/:id" element={<StoreDetail />} />
          <Route path="/create-service" element={<AIChatCreationPage />} />
          <Route path="/service/:id" element={<ServiceDetailsPage />} />
          <Route path="/service/:id/edit" element={<ServiceEdit />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/rank" element={<DashboardRank />} />
          <Route path="/dashboard/recommendations" element={<DashboardRecommendations />} />
          <Route path="/dashboard/benchmark" element={<DashboardBenchmark />} />
          <Route path="/dashboard/services/:id" element={<DashboardServiceDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UserContext.Provider>
  )
}

export default App
