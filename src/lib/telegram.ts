import WebApp from '@twa-dev/sdk'

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
      photo_url?: string
    }
    auth_date?: number
    hash?: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
  }
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  BackButton: {
    isVisible: boolean
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
  }
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText: (text: string) => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    showProgress: (leaveActive?: boolean) => void
    hideProgress: () => void
    setParams: (params: {
      text?: string
      color?: string
      text_color?: string
      is_active?: boolean
      is_visible?: boolean
    }) => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: Error | null, success: boolean) => void) => void
    getItem: (key: string, callback: (error: Error | null, value: string | null) => void) => void
    getItems: (keys: string[], callback: (error: Error | null, values: Record<string, string>) => void) => void
    removeItem: (key: string, callback?: (error: Error | null, success: boolean) => void) => void
    removeItems: (keys: string[], callback?: (error: Error | null, success: boolean) => void) => void
    getKeys: (callback: (error: Error | null, keys: string[]) => void) => void
  }
  ready: () => void
  expand: () => void
  close: () => void
  enableClosingConfirmation: () => void
  disableClosingConfirmation: () => void
  onEvent: (eventType: string, eventHandler: () => void) => void
  offEvent: (eventType: string, eventHandler: () => void) => void
  sendData: (data: string) => void
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void
  openTelegramLink: (url: string) => void
  openInvoice: (url: string, callback?: (status: string) => void) => void
  showPopup: (params: {
    title?: string
    message: string
    buttons?: Array<{
      id?: string
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
      text?: string
    }>
  }, callback?: (id: string) => void) => void
  showAlert: (message: string, callback?: () => void) => void
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
  showScanQrPopup: (params: {
    text?: string
  }, callback?: (data: string) => void) => void
  closeScanQrPopup: () => void
  readTextFromClipboard: (callback?: (text: string) => void) => void
  requestWriteAccess: (callback?: (granted: boolean) => void) => void
  requestContact: (callback?: (granted: boolean) => void) => void
}

// Initialize Telegram WebApp
export const initTelegram = () => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    WebApp.ready()
    WebApp.expand()
    return WebApp as unknown as TelegramWebApp
  }
  return null
}

// Get Telegram user data
export const getTelegramUser = (): TelegramWebApp['initDataUnsafe']['user'] | null => {
  const webApp = initTelegram()
  if (!webApp) {
    console.log('WebApp not initialized')
    return null
  }
  
  // Try multiple ways to get user data
  console.log('Trying to get user from webApp.initDataUnsafe:', webApp.initDataUnsafe)
  const user = webApp?.initDataUnsafe?.user
  if (user) {
    console.log('User found in webApp.initDataUnsafe:', user)
    return user
  }
  
  // Fallback: try to get from window object directly
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
    console.log('User found in window.Telegram.WebApp.initDataUnsafe')
    return (window as any).Telegram.WebApp.initDataUnsafe.user
  }
  
  // Try initData parsing
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
    try {
      const initData = (window as any).Telegram.WebApp.initData
      console.log('Found initData, trying to parse...')
      // Parse initData if needed (it's a URL-encoded string)
      const params = new URLSearchParams(initData)
      const userJson = params.get('user')
      if (userJson) {
        const parsedUser = JSON.parse(decodeURIComponent(userJson))
        console.log('Parsed user from initData:', parsedUser)
        return parsedUser
      }
    } catch (e) {
      console.warn('Failed to parse initData:', e)
    }
  }
  
  console.warn('No Telegram user data found in any location')
  return null
}

// Open Telegram chat with user
export const openTelegramChat = (username: string, message?: string) => {
  const webApp = initTelegram()
  if (!webApp) return
  
  const telegramUrl = username.startsWith('@')
    ? `https://t.me/${username.slice(1)}${message ? `?text=${encodeURIComponent(message)}` : ''}`
    : `https://t.me/${username}${message ? `?text=${encodeURIComponent(message)}` : ''}`
  
  webApp.openTelegramLink(telegramUrl)
}

// Share listing to Telegram
export const shareListing = (listingId: string, title: string, price?: number) => {
  const webApp = initTelegram()
  if (!webApp) return
  
  const priceText = price ? `$${price}` : 'Free'
  const message = `🏪 Check out this item on LocalMarket:\n\n${title}\n${priceText}\n\nView it here: ${window.location.origin}/listing/${listingId}`
  
  webApp.sendData(JSON.stringify({
    type: 'share',
    listing_id: listingId,
    message
  }))
}

// Request location
export const requestLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
  return new Promise((resolve) => {
    // Use browser geolocation API (LocationManager is not supported in version 6.0)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Location access denied or unavailable:', error.message)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
    } else {
      console.warn('Geolocation is not supported by this browser')
      resolve(null)
    }
  })
}

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Format distance for display
export const formatDistance = (miles: number): string => {
  if (miles < 0.1) return '< 0.1 mi'
  if (miles < 1) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}
