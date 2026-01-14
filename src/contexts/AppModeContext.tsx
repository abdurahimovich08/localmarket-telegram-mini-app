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

    // If no ctx param and we're not on a store/service detail page, 
    // and we're not on home page in branded mode, reset to marketplace
    const path = location.pathname
    if (!ctx && path !== '/' && !path.startsWith('/store/') && !path.startsWith('/service/')) {
      // Only reset if we're navigating away from branded pages
      if (mode.kind !== 'marketplace') {
        // Don't auto-reset on navigation - let user control via "Back to Marketplace" button
        // setMode({ kind: 'marketplace' })
      }
    }
  }, [location.search, location.pathname, navigate]) // Only depend on location changes, not mode

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
