import { useState, useEffect } from 'react'
import { MapPinIcon, PencilIcon } from '@heroicons/react/24/outline'
import { requestLocation } from '../lib/telegram'
import LocationEditModal from './LocationEditModal'

interface LocationDisplayProps {
  onLocationChange?: (location: { latitude: number; longitude: number; address?: string }) => void
  initialAddress?: string
  className?: string
}

export default function LocationDisplay({ 
  onLocationChange, 
  initialAddress,
  className = '' 
}: LocationDisplayProps) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [address, setAddress] = useState<string>(initialAddress || '')
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  // Avtomatik lokatsiyani aniqlash
  useEffect(() => {
    const fetchLocation = async () => {
      setLoading(true)
      try {
        const loc = await requestLocation()
        if (loc) {
          setLocation(loc)
          // Reverse geocoding - koordinatalardan manzil olish
          const addr = await reverseGeocode(loc.latitude, loc.longitude)
          if (addr) {
            setAddress(addr)
            onLocationChange?.({ ...loc, address: addr })
          } else {
            setAddress(`${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`)
            onLocationChange?.({ ...loc })
          }
        }
      } catch (error) {
        console.error('Error fetching location:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLocation()
  }, [])

  // Reverse geocoding - koordinatalardan manzil olish
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      
      if (!apiKey) {
        console.warn('Google Maps API key topilmadi. Faqat koordinatalar ko\'rsatiladi.')
        return null
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=uz`
      )
      
      if (!response.ok) {
        console.error('Geocoding API error:', response.status, response.statusText)
        return null
      }

      const data = await response.json()
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formatted_address
      } else if (data.status === 'REQUEST_DENIED') {
        console.error('Google Maps API key not valid or quota exceeded')
        return null
      }
      
      return null
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return null
    }
  }

  const handleLocationUpdate = (newLocation: { latitude: number; longitude: number; address?: string }) => {
    setLocation({ latitude: newLocation.latitude, longitude: newLocation.longitude })
    if (newLocation.address) {
      setAddress(newLocation.address)
    }
    onLocationChange?.(newLocation)
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-white/70 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span className="text-sm">Lokatsiya aniqlanmoqda...</span>
      </div>
    )
  }

  return (
    <>
      <div 
        onClick={() => setShowEditModal(true)}
        className={`flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      >
        <MapPinIcon className={`w-4 h-4 flex-shrink-0 ${className.includes('text-gray') ? 'text-gray-600' : 'text-white/80'}`} />
        <span className={`text-sm truncate ${className.includes('text-gray') ? 'text-gray-900' : 'text-white/90'}`}>
          {address || (location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Lokatsiya topilmadi')}
        </span>
        <PencilIcon className={`w-4 h-4 flex-shrink-0 ${className.includes('text-gray') ? 'text-gray-500' : 'text-white/60'}`} />
      </div>

      {showEditModal && (
        <LocationEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          initialLocation={location}
          initialAddress={address}
          onSave={handleLocationUpdate}
        />
      )}
    </>
  )
}
