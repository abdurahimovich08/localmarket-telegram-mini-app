import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppMode } from '../contexts/AppModeContext'
import { getStore, getService } from '../lib/supabase'
import type { Store, Service } from '../types'
import { ArrowLeftIcon, ShareIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
import BottomNav from './BottomNav'
import LocationDisplay from './LocationDisplay'

interface BrandedLayoutProps {
  children: ReactNode
}

/**
 * BrandedLayout - Layout for store/service branded mode
 * Shows store/service header, scoped navigation, no global marketplace features
 */
export default function BrandedLayout({ children }: BrandedLayoutProps) {
  const { mode, resetAppMode } = useAppMode()
  const navigate = useNavigate()
  const [store, setStore] = useState<Store | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEntity = async () => {
      setLoading(true)
      try {
        if (mode.kind === 'store') {
          const storeData = await getStore(mode.storeId)
          if (!storeData) {
            // Store not found, reset to marketplace
            resetAppMode()
            return
          }
          setStore(storeData)
        } else if (mode.kind === 'service') {
          const serviceData = await getService(mode.serviceId)
          if (!serviceData) {
            // Service not found, reset to marketplace
            resetAppMode()
            return
          }
          setService(serviceData)
        }
      } catch (error) {
        console.error('Error loading store/service:', error)
        resetAppMode()
      } finally {
        setLoading(false)
      }
    }

    if (mode.kind !== 'marketplace') {
      loadEntity()
    } else {
      // If marketplace mode, set loading to false immediately
      setLoading(false)
    }
  }, [mode, resetAppMode])

  const handleShare = () => {
    const webApp = (window as any).Telegram?.WebApp
    if (webApp) {
      if (mode.kind === 'store' && store) {
        const shareText = `🏪 ${store.name}\n\n${store.description || 'Do\'konni ko\'ring'}\n\n${window.location.origin}/?ctx=store:${store.store_id}`
        webApp.sendData(JSON.stringify({
          type: 'share',
          text: shareText
        }))
      } else if (mode.kind === 'service' && service) {
        const shareText = `🛠 ${service.title}\n\n${service.description}\n\n${window.location.origin}/?ctx=service:${service.service_id}`
        webApp.sendData(JSON.stringify({
          type: 'share',
          text: shareText
        }))
      }
    } else {
      // Fallback: copy to clipboard
      const url = mode.kind === 'store' 
        ? `${window.location.origin}/?ctx=store:${mode.storeId}`
        : `${window.location.origin}/?ctx=service:${mode.serviceId}`
      navigator.clipboard.writeText(url)
      alert('Link nusxalandi!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const entity = mode.kind === 'store' ? store : service

  if (!entity) {
    return null
  }

  return (
    <div className="min-h-screen gradient-purple-blue">
      {/* Sticky Header - Do'kon nomi va Share tugmasi */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-purple-600/90 border-b border-white/10 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={resetAppMode}
            className="p-2 -ml-2 text-white hover:text-white/80 transition-colors flex-shrink-0"
            title="Bozorga qaytish"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center font-bold text-white text-lg truncate px-2">
            {mode.kind === 'store' ? (store as Store).name : (service as Service).title}
          </h1>
          <button
            onClick={handleShare}
            className="p-2 -mr-2 text-white hover:text-white/80 transition-colors flex-shrink-0"
            title="Ulashish"
          >
            <ShareIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Location Display - Sticky header ostida (faqat store uchun) */}
        {mode.kind === 'store' && (
          <div className="px-4 pb-3">
            <LocationDisplay 
              onLocationChange={(location) => {
                // Location o'zgarganda kerakli amallar
                console.log('Location updated:', location)
              }}
              className="bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm"
            />
          </div>
        )}
      </header>

      {/* YOUTUBE STYLE STORE HEADER */}
      {mode.kind === 'store' && store && (
        <div className="relative">
          {/* Background Photo (YouTube Style) */}
          <div className="relative w-full h-48 md:h-64 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 overflow-hidden">
            {store.banner_url ? (
              <img
                src={store.banner_url}
                alt={store.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl text-white/30">🏪</span>
              </div>
            )}
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          </div>

          {/* Store Identity Block (YouTube Style) */}
          <div className="px-4 pb-4 relative -mt-16 z-10">
            <div className="flex flex-row items-end gap-4">
              {/* Logo - Circular avatar (overlaps banner) */}
              {store.logo_url ? (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white overflow-hidden shadow-xl flex-shrink-0 bg-white">
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl md:text-4xl text-white font-bold">
                    {store.name[0].toUpperCase()}
                  </span>
                </div>
              )}

              {/* Store Info - Logo yonida */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl md:text-2xl font-bold text-white leading-tight truncate">
                    {store.name}
                  </h2>
                  {store.is_verified && (
                    <CheckBadgeIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />
                  )}
                </div>
                
                {/* Username - Store nomi ostida */}
                {store.owner?.username && (
                  <p className="text-white/80 text-sm md:text-base">
                    @{store.owner.username}
                  </p>
                )}
              </div>
            </div>

            {/* DESCRIPTION BLOCK */}
            {store.description && (
              <div className="mt-3">
                <p className="text-sm text-white/90 whitespace-pre-line line-clamp-3">
                  {store.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {mode.kind === 'service' && service && (
        <div className="px-4 pt-4 pb-2">
          <div className="neumorphic-card p-4">
            <div className="flex items-start gap-3">
              {service.logo_url ? (
                <div className="w-16 h-16 rounded-lg border-2 border-white/30 overflow-hidden flex-shrink-0">
                  <img
                    src={service.logo_url}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🛠</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white mb-1">{service.title}</h2>
                <p className="text-sm text-white/80 line-clamp-2">{service.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="pb-24">
        {children}
      </div>

      {/* Scoped Navigation - Neumorphic */}
      <nav className="fixed bottom-0 left-0 right-0 neumorphic-nav z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16 px-4">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center flex-1 h-full transition-all"
          >
            <span className="text-2xl mb-1">📦</span>
            <span className="text-xs text-white font-medium">Katalog</span>
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="flex flex-col items-center justify-center flex-1 h-full transition-all"
          >
            <span className="text-2xl mb-1">🛒</span>
            <span className="text-xs text-white font-medium">Buyurtma</span>
          </button>
          <button
            onClick={() => {
              if (mode.kind === 'store') {
                navigate(`/store/${mode.storeId}`)
              } else if (mode.kind === 'service') {
                navigate(`/service/${mode.serviceId}`)
              }
            }}
            className="flex flex-col items-center justify-center flex-1 h-full transition-all"
          >
            <span className="text-2xl mb-1">ℹ️</span>
            <span className="text-xs text-white font-medium">Ma'lumot</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
