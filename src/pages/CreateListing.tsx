import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { createListing } from '../lib/supabase'
import { requestLocation, initTelegram } from '../lib/telegram'
import { CATEGORIES, CONDITIONS, type ListingCategory, type ListingCondition } from '../types'
import { uploadImages } from '../lib/imageUpload'
import BottomNav from '../components/BottomNav'
import { ArrowLeftIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function CreateListing() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [isFree, setIsFree] = useState(false)
  const [category, setCategory] = useState<ListingCategory>('other')
  const [condition, setCondition] = useState<ListingCondition>('good')
  const [neighborhood, setNeighborhood] = useState('')
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    const webApp = initTelegram()
    if (webApp) {
      // Set up Main Button
      webApp.MainButton.setText('Post Listing')
      webApp.MainButton.show()
      
      const handleMainButtonClick = () => {
        console.log('MainButton clicked')
        handleSubmit()
      }
      
      webApp.MainButton.onClick(handleMainButtonClick)

      // Back Button is not supported in version 6.0, using header back button instead
      // webApp.BackButton.show()
      // webApp.BackButton.onClick(() => navigate(-1))

      // Request location
      requestLocation().then((loc) => {
        if (loc) {
          setLocation(loc)
        }
      })

      return () => {
        webApp.MainButton.offClick(handleMainButtonClick)
        webApp.MainButton.hide()
        // BackButton is not supported in version 6.0
        // webApp.BackButton.hide()
      }
    }
  }, [handleSubmit, navigate, user])

  useEffect(() => {
    const webApp = initTelegram()
    if (webApp) {
      // Enable/disable Main Button based on form validity
      const isValid = user && title.trim().length > 0 && description.trim().length > 0 && photos.length > 0
      if (isValid) {
        webApp.MainButton.enable()
      } else {
        webApp.MainButton.disable()
      }
    }
  }, [user, title, description, photos])

  // If no user, show message but allow form to be visible
  // User will get error when trying to submit

  const handlePhotoUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files) return

      Array.from(files).slice(0, 10 - photos.length).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setPhotos((prev) => [...prev, result])
        }
        reader.readAsDataURL(file)
      })
    }
    input.click()
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = useCallback(async () => {
    if (!user) {
      alert('Foydalanuvchi ma\'lumotlari yuklanmoqda. Iltimos, kuting...')
      return
    }

    if (!title.trim() || !description.trim() || photos.length === 0) {
      alert('Iltimos, barcha majburiy maydonlarni to\'ldiring (sarlavha, tavsif va kamida bitta rasm)')
      return
    }

    setLoading(true)
    try {
      // Upload photos
      console.log('Starting photo upload...')
      const photoFiles = photos.map((dataUrl, index) => {
        // Convert data URL to File object
        const arr = dataUrl.split(',')
        const mime = arr[0].match(/:(.*?);/)?.[1]
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n)
        }
        return new File([u8arr], `photo-${Date.now()}-${index}.jpg`, { type: mime || 'image/jpeg' })
      })

      console.log(`Uploading ${photoFiles.length} photos...`)
      const photoUrls = await uploadImages(photoFiles)
      console.log('Photos uploaded:', photoUrls)

      console.log('Creating listing...')
      const listing = await createListing({
        seller_telegram_id: user.telegram_user_id,
        title: title.trim(),
        description: description.trim(),
        price: isFree ? undefined : parseFloat(price) || 0,
        is_free: isFree,
        category,
        condition,
        photos: photoUrls,
        neighborhood: neighborhood.trim() || undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
        status: 'active',
        is_boosted: false
      })

      if (listing) {
        console.log('Listing created successfully:', listing.listing_id)
        // Navigate to home page after successful creation
        navigate('/')
      } else {
        alert('E\'lon yaratilmadi. Iltimos, brauzer konsolini tekshiring.')
      }
    } catch (error: any) {
      console.error('Error creating listing:', error)
      const errorMessage = error?.message || 'Unknown error occurred'
      alert(`E'lon yaratilmadi: ${errorMessage}. Iltimos, brauzer konsolini tekshiring.`)
    } finally {
      setLoading(false)
    }
  }, [user, title, description, photos, category, condition, price, isFree, neighborhood, location, navigate])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center font-semibold text-gray-900">E'lon Yaratish</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {!user && (
        <div className="mx-4 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ Foydalanuvchi ma'lumotlari yuklanmoqda. Iltimos, biroz kuting yoki sahifani yangilang.
          </p>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rasmlar (10 tagacha) *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            {photos.length < 10 && (
              <button
                onClick={handlePhotoUpload}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
              >
                <PhotoIcon className="w-8 h-8 mb-1" />
                <span className="text-xs">Rasm Qo'shish</span>
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Nima sotmoqchisiz?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">{title.length}/80</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Mahsulotingizni tasvirlang..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Bepul</span>
            </label>
            {!isFree && (
              <div className="flex-1 flex items-center gap-2">
                <span className="text-gray-600">$</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategoriya
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ListingCategory)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.emoji} {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Holati
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as ListingCondition)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {CONDITIONS.map((cond) => (
              <option key={cond.value} value={cond.value}>
                {cond.label}
              </option>
            ))}
          </select>
        </div>

        {/* Neighborhood */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mahalla (ixtiyoriy)
          </label>
          <input
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Masalan: Yunusobod, Chilonzor"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">E'lon yaratilmoqda...</p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
