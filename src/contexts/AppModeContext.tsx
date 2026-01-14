import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AppMode } from '../types'

interface AppModeContextType {
  mode: AppMode
  setAppMode: (mode: AppMode) => void
  resetAppMode: () => void
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined)

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>({ kind: 'marketplace' })
  const location = useLocation()
  const navigate = useNavigate()

  // Parse URL context on mount and when location changes
  useEffect(() => {
    const parseUrlContext = () => {
      const searchParams = new URLSearchParams(location.search)
      const ctx = searchParams.get('ctx')

      if (ctx) {
        // Parse ctx parameter: store:<ID> or service:<ID>
        const [type, id] = ctx.split(':')
        
        if (type === 'store' && id) {
          setMode({ kind: 'store', storeId: id })
          // Clean URL - remove ctx param after parsing
          const newSearch = new URLSearchParams(searchParams)
          newSearch.delete('ctx')
          const newSearchString = newSearch.toString()
          const newUrl = newSearchString 
            ? `${location.pathname}?${newSearchString}`
            : location.pathname
          navigate(newUrl, { replace: true })
          return
        }
        
        if (type === 'service' && id) {
          setMode({ kind: 'service', serviceId: id })
          // Clean URL - remove ctx param after parsing
          const newSearch = new URLSearchParams(searchParams)
          newSearch.delete('ctx')
          const newSearchString = newSearch.toString()
          const newUrl = newSearchString 
            ? `${location.pathname}?${newSearchString}`
            : location.pathname
          navigate(newUrl, { replace: true })
          return
        }
      }

      // If no ctx param, check if we're in a store/service detail page
      // and reset to marketplace mode if navigating away
      const path = location.pathname
      if (path.startsWith('/store/') && !path.includes('/edit')) {
        const storeId = path.split('/store/')[1]?.split('/')[0]
        if (storeId && mode.kind === 'store' && mode.storeId === storeId) {
          // Already in store mode for this store, keep it
          return
        }
      } else if (path.startsWith('/service/') && !path.includes('/edit')) {
        const serviceId = path.split('/service/')[1]?.split('/')[0]
        if (serviceId && mode.kind === 'service' && mode.serviceId === serviceId) {
          // Already in service mode for this service, keep it
          return
        }
      } else if (path === '/' && mode.kind !== 'marketplace') {
        // On home page but not in marketplace mode - could be intentional
        // Don't auto-reset, let user control via "Back to Marketplace" button
        return
      }
    }

    parseUrlContext()
  }, [location, navigate])

  const setAppMode = (newMode: AppMode) => {
    setMode(newMode)
  }

  const resetAppMode = () => {
    setMode({ kind: 'marketplace' })
    navigate('/')
  }

  return (
    <AppModeContext.Provider value={{ mode, setAppMode, resetAppMode }}>
      {children}
    </AppModeContext.Provider>
  )
}

export function useAppMode() {
  const context = useContext(AppModeContext)
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider')
  }
  return context
}
