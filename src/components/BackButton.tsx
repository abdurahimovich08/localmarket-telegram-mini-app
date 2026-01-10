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

  const handleBack = () => {
    if (onClick) {
      onClick()
      return
    }

    // Use React Router's navigate(-1) to go back in history
    // This respects the browser/React Router history stack
    // If no history, it will stay on current page (which is fine)
    const canGoBack = window.history.length > 1
    
    if (canGoBack) {
      navigate(-1)
    } else {
      // If no history, navigate to home
      navigate(fallbackPath)
    }
  }

  useEffect(() => {
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
  }, [location.pathname, navigate, onClick])

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
