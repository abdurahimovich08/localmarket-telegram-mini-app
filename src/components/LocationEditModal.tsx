import { useState, useEffect } from 'react'
import { XMarkIcon, MapPinIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface LocationEditModalProps {
  isOpen: boolean
  onClose: () => void
  initialLocation?: { latitude: number; longitude: number } | null
  initialAddress?: string
  onSave: (location: { latitude: number; longitude: number; address?: string }) => void
}

export default function LocationEditModal({
  isOpen,
  onClose,
  initialLocation,
  initialAddress,
  onSave
}: LocationEditModalProps) {
  const [mode, setMode] = useState<'text' | 'map'>('text')
  const [addressInput, setAddressInput] = useState(initialAddress || '')
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(initialLocation || null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  )

  useEffect(() => {
    if (isOpen && initialLocation) {
      setMapCenter({ lat: initialLocation.latitude, lng: initialLocation.longitude })
      setSelectedLocation(initialLocation)
    }
  }, [isOpen, initialLocation])

  // Geocoding - manzildan koordinatalar olish
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      
      if (!apiKey) {
        alert('Google Maps API key topilmadi. Iltimos, .env fayliga VITE_GOOGLE_MAPS_API_KEY qo\'shing.')
        return null
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=uz`
      )
      
      if (!response.ok) {
        console.error('Geocoding API error:', response.status, response.statusText)
        return null
      }

      const data = await response.json()
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return { lat: location.lat, lng: location.lng }
      } else if (data.status === 'REQUEST_DENIED') {
        alert('Google Maps API key not valid yoki quota tugagan. Iltimos, API key\'ni tekshiring.')
        return null
      } else if (data.status === 'ZERO_RESULTS') {
        alert('Manzil topilmadi. Iltimos, boshqa manzil kiriting.')
        return null
      }
      
      return null
    } catch (error) {
      console.error('Geocoding error:', error)
      alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
      return null
    }
  }

  const handleTextModeSave = async () => {
    if (!addressInput.trim()) {
      alert('Iltimos, manzilni kiriting')
      return
    }

    const coords = await geocodeAddress(addressInput)
    if (coords) {
      setSelectedLocation({ latitude: coords.lat, longitude: coords.lng })
      onSave({ latitude: coords.lat, longitude: coords.lng, address: addressInput })
      onClose()
    } else {
      alert('Manzil topilmadi. Iltimos, boshqa manzil kiriting')
    }
  }

  const handleMapModeSave = () => {
    if (selectedLocation) {
      // Reverse geocoding - koordinatalardan manzil olish
      reverseGeocode(selectedLocation.latitude, selectedLocation.longitude).then(address => {
        onSave({ 
          latitude: selectedLocation.latitude, 
          longitude: selectedLocation.longitude, 
          address: address || undefined 
        })
        onClose()
      })
    }
  }

  // Reverse geocoding
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      
      if (!apiKey) {
        console.warn('Google Maps API key topilmadi')
        return null
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=uz`
      )
      
      if (!response.ok) {
        console.error('Reverse geocoding API error:', response.status, response.statusText)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Lokatsiyani o'zgartirish</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              mode === 'text'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yozish
          </button>
          <button
            onClick={() => setMode('map')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              mode === 'map'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Xarita
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {mode === 'text' ? (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manzil
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="Masalan: Toshkent, Chilonzor tumani"
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <button
                onClick={handleTextModeSave}
                className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Saqlash
              </button>
            </div>
          ) : (
            <div className="relative h-96">
              {/* Google Maps iframe */}
              {mapCenter ? (
                <>
                  {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${mapCenter.lat},${mapCenter.lng}&zoom=15&language=uz`}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100">
                      <div className="text-center p-4">
                        <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 font-medium mb-1">Google Maps API key topilmadi</p>
                        <p className="text-gray-500 text-sm">Iltimos, .env fayliga VITE_GOOGLE_MAPS_API_KEY qo'shing</p>
                      </div>
                    </div>
                  )}
                  {/* Marker overlay - user can click to select location */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 bg-primary rounded-full border-4 border-white shadow-lg transform -translate-y-4">
                      <MapPinIcon className="w-full h-full text-white" />
                    </div>
                  </div>
                  {/* Instructions */}
                  <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 pointer-events-auto">
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      Xaritada joyni tanlang
                    </p>
                    <p className="text-xs text-gray-500">
                      Xaritani surib, marker'ni kerakli joyga qo'ying
                    </p>
                    <button
                      onClick={() => {
                        // Get current map center (approximate)
                        if (mapCenter) {
                          setSelectedLocation({ latitude: mapCenter.lat, longitude: mapCenter.lng })
                        }
                      }}
                      className="mt-2 w-full py-2 px-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                    >
                      Bu joyni tanlash
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="text-center">
                    <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Xarita yuklanmoqda...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === 'map' && (
          <div className="p-4 border-t">
            <button
              onClick={handleMapModeSave}
              disabled={!selectedLocation}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Saqlash
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
