import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { initTelegram, getTelegramUser } from './lib/telegram'
import { createOrUpdateUser, getUser, getUserReferralStore } from './lib/supabase'
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
import StoreManagement from './pages/StoreManagement'
import AIChatCreationPage from './pages/AIChatCreationPage'
import ServiceDetailsPage from './pages/ServiceDetailsPage'
import ServiceEdit from './pages/ServiceEdit'
import UnifiedAICreationPage from './pages/UnifiedAICreationPage'
import ClothingListingWizard from './components/ClothingListingWizard'
import ChooseCategoryUnified from './pages/ChooseCategoryUnified'
import Dashboard from './pages/Dashboard'
import DashboardRank from './pages/DashboardRank'
import DashboardRecommendations from './pages/DashboardRecommendations'
import DashboardBenchmark from './pages/DashboardBenchmark'
import DashboardServiceDetail from './pages/DashboardServiceDetail'
import { UserContext } from './contexts/UserContext'
import { AppModeProvider, useAppMode } from './contexts/AppModeContext'
import MarketplaceLayout from './components/MarketplaceLayout'
import BrandedLayout from './components/BrandedLayout'
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

        // Check if user came from referral (if no ctx in URL)
        // This allows auto-detection of store mode from database
        const urlParams = new URLSearchParams(window.location.search)
        if (!urlParams.get('ctx') && dbUser) {
          const referralStore = await getUserReferralStore(telegramUser.id)
          if (referralStore) {
            // User came from referral - can auto-set store mode if needed
            // But we'll let AppModeContext handle URL-based routing first
            console.log('User came from referral store:', referralStore.store_name)
          }
        }
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

  // Wrap in error boundary to catch any rendering errors
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        <AppModeProvider>
          <AppRoutes />
        </AppModeProvider>
      </BrowserRouter>
    </UserContext.Provider>
  )
}

// Separate component to use useAppMode hook
function AppRoutes() {
  const { mode } = useAppMode()
  
  // Determine which layout to use based on app mode
  const useBrandedLayout = mode.kind === 'store' || mode.kind === 'service'
  
  // Pages that should always use marketplace layout (admin, creation, etc.)
  const alwaysMarketplacePaths = [
    '/create',
    '/create-unified',
    '/my-listings',
    '/profile',
    '/favorites',
    '/search',
    '/create-store',
    '/store/:id/edit',
    '/create-service',
    '/create-service-unified',
    '/service/:id/edit',
    '/dashboard'
  ]
  
  // Layout wrapper that chooses layout based on route and app mode
  const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation()
    const path = location.pathname
    
    const isMarketplacePage = alwaysMarketplacePaths.some(marketplacePath => 
      path.startsWith(marketplacePath.replace('/:id', '').replace(':id?', ''))
    )
    
    // Use branded layout only on home and cart pages when in branded mode
    if (useBrandedLayout && (path === '/' || path === '/cart') && !isMarketplacePage) {
      return <BrandedLayout>{children}</BrandedLayout>
    }
    
    return <MarketplaceLayout>{children}</MarketplaceLayout>
  }

  return (
    <Routes>
      <Route path="/" element={<LayoutWrapper><Home /></LayoutWrapper>} />
      <Route path="/listing/:id" element={<LayoutWrapper><ListingDetail /></LayoutWrapper>} />
      <Route path="/create" element={<MarketplaceLayout><CreateListing /></MarketplaceLayout>} />
      <Route path="/my-listings" element={<MarketplaceLayout><MyListings /></MarketplaceLayout>} />
      <Route path="/profile/:id?" element={<MarketplaceLayout><Profile /></MarketplaceLayout>} />
      <Route path="/favorites" element={<MarketplaceLayout><Favorites /></MarketplaceLayout>} />
      <Route path="/search" element={<MarketplaceLayout><Search /></MarketplaceLayout>} />
      <Route path="/cart" element={<LayoutWrapper><Cart /></LayoutWrapper>} />
      <Route path="/create-store" element={<MarketplaceLayout><CreateStore /></MarketplaceLayout>} />
      <Route path="/store/:id/edit" element={<MarketplaceLayout><EditStore /></MarketplaceLayout>} />
      <Route path="/store/:id/manage" element={<MarketplaceLayout><StoreManagement /></MarketplaceLayout>} />
      <Route path="/store/:id" element={<MarketplaceLayout><StoreDetail /></MarketplaceLayout>} />
      <Route path="/create-service" element={<MarketplaceLayout><AIChatCreationPage /></MarketplaceLayout>} />
      {/* Unified AI Creation Routes */}
      <Route path="/create-unified" element={<MarketplaceLayout><ChooseCategoryUnified /></MarketplaceLayout>} />
      <Route path="/create-unified/chat" element={<MarketplaceLayout><UnifiedAICreationPage entityType="product" category="" /></MarketplaceLayout>} />
      <Route path="/create-clothing" element={<ClothingListingWizard />} />
      <Route path="/create-service-unified" element={<MarketplaceLayout><UnifiedAICreationPage entityType="service" category="service" /></MarketplaceLayout>} />
      <Route path="/service/:id" element={<MarketplaceLayout><ServiceDetailsPage /></MarketplaceLayout>} />
      <Route path="/service/:id/edit" element={<MarketplaceLayout><ServiceEdit /></MarketplaceLayout>} />
      <Route path="/dashboard" element={<MarketplaceLayout><Dashboard /></MarketplaceLayout>} />
      <Route path="/dashboard/rank" element={<MarketplaceLayout><DashboardRank /></MarketplaceLayout>} />
      <Route path="/dashboard/recommendations" element={<MarketplaceLayout><DashboardRecommendations /></MarketplaceLayout>} />
      <Route path="/dashboard/benchmark" element={<MarketplaceLayout><DashboardBenchmark /></MarketplaceLayout>} />
      <Route path="/dashboard/services/:id" element={<MarketplaceLayout><DashboardServiceDetail /></MarketplaceLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
