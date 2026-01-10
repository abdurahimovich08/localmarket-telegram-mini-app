import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { initTelegram } from '../lib/telegram'

interface BackButtonProps {
  onClick?: () => void
  className?: string
  fallbackPath?: string
}

export default function BackButton({ onClick, className = '', fallbackPath = '/' }: BackButtonProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [canGoBack, setCanGoBack] = useState(false)

  // Hide back button on home page
  if (location.pathname === '/') {
    return null
  }

  useEffect(() => {
    // Check if we can go back in history
    // React Router keeps its own history stack
    setCanGoBack(true) // Assume we can always go back (React Router manages history)

    // Telegram WebApp BackButton API integration (if available)
    const webApp = initTelegram()
    if (webApp?.BackButton) {
      try {
        // Show Telegram back button
        webApp.BackButton.show()
        
        // Handle Telegram back button click
        const handleTelegramBack = () => {
          handleBack()
        }
        webApp.BackButton.onClick(handleTelegramBack)
        
        // Cleanup
        return () => {
          try {
            webApp.BackButton.offClick(handleTelegramBack)
            webApp.BackButton.hide()
          } catch (error) {
            // Ignore errors during cleanup
            console.warn('Error cleaning up Telegram BackButton:', error)
          }
        }
      } catch (error) {
        // Telegram BackButton might not be available in all versions
        console.warn('Telegram BackButton not available:', error)
      }
    }
  }, [location.pathname])

  const handleBack = () => {
    if (onClick) {
      onClick()
      return
    }

    // Always try navigate(-1) first (React Router history)
    // This will work correctly with React Router's history stack
    try {
      navigate(-1)
    } catch (error) {
      // If navigate(-1) fails, fallback to home
      console.warn('Navigate back failed, using fallback:', error)
      navigate(fallbackPath)
    }
  }

  return (
    <button
      onClick={handleBack}
      className={`p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
      aria-label="Orqaga"
    >
      <ArrowLeftIcon className="w-6 h-6" />
    </button>
  )
}
