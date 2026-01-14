import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppMode } from '../contexts/AppModeContext'
import { getStore, getService } from '../lib/supabase'
import type { Store, Service } from '../types'
import { ArrowLeftIcon, ShareIcon } from '@heroicons/react/24/outline'
import BottomNav from './BottomNav'

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
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back to Marketplace button */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={resetAppMode}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Bozorga qaytish"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {mode.kind === 'store' ? (store as Store).name : (service as Service).title}
            </h1>
          </div>
          <button
            onClick={handleShare}
            className="p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Ulashish"
          >
            <ShareIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Store/Service Identity Block (same design as StoreDetail) */}
      {mode.kind === 'store' && store && (
        <div className="bg-white border-b border-gray-200">
          {store.banner_url ? (
            <div className="relative w-full h-40 overflow-hidden bg-gray-100">
              <img 
                src={store.banner_url} 
                alt={store.name}
                className="w-full h-full object-cover object-center"
              />
            </div>
          ) : (
            <div className="relative w-full h-40 bg-gradient-to-r from-primary to-primary-dark overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xl font-bold">{store.name}</span>
              </div>
            </div>
          )}

          <div className="px-4 pb-4 relative z-10">
            <div className="flex flex-row items-start">
              {store.logo_url ? (
                <div className="-mt-12 w-20 h-20 rounded-full border-4 border-white overflow-hidden shadow-lg flex-shrink-0 bg-white">
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="-mt-12 w-20 h-20 rounded-full border-4 border-white shadow-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl text-primary font-bold">
                    {store.name[0].toUpperCase()}
                  </span>
                </div>
              )}

              <div className="ml-3 mt-2 flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{store.name}</h2>
                {store.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{store.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {mode.kind === 'service' && service && (
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 py-4">
            <div className="flex items-start gap-3">
              {service.logo_url ? (
                <img
                  src={service.logo_url}
                  alt={service.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl">🛠</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{service.title}</h2>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{service.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="pb-20">
        {children}
      </div>

      {/* Scoped Navigation - Only show in branded mode */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary transition-colors"
          >
            <span className="text-xl">📦</span>
            <span className="text-xs mt-1">Katalog</span>
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary transition-colors"
          >
            <span className="text-xl">🛒</span>
            <span className="text-xs mt-1">Buyurtma</span>
          </button>
          <button
            onClick={() => {
              if (mode.kind === 'store') {
                navigate(`/store/${mode.storeId}`)
              } else if (mode.kind === 'service') {
                navigate(`/service/${mode.serviceId}`)
              }
            }}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary transition-colors"
          >
            <span className="text-xl">ℹ️</span>
            <span className="text-xs mt-1">Ma'lumot</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
