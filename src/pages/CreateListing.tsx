import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { createListing, getSubcategories, getUserStore, type Subcategory } from '../lib/supabase'
import { requestLocation, initTelegram } from '../lib/telegram'
import { CATEGORIES, CONDITIONS, type ListingCategory, type ListingCondition } from '../types'
import { uploadImages } from '../lib/imageUpload'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import { PhotoIcon, XMarkIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'

type Step = 'photos' | 'category' | 'subcategory' | 'form'

export default function CreateListing() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [currentStep, setCurrentStep] = useState<Step>('photos')
  const [loading, setLoading] = useState(false)
  
  // Photos
  const [photos, setPhotos] = useState<string[]>([])
  
  // Category & Subcategory
  const [category, setCategory] = useState<ListingCategory | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [nestedSubcategories, setNestedSubcategories] = useState<Subcategory[]>([])
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)
  
  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [isFree, setIsFree] = useState(false)
  const [condition, setCondition] = useState<ListingCondition>('good')
  const [neighborhood, setNeighborhood] = useState('')
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [listingType, setListingType] = useState<'personal' | 'store'>('personal')
  const [userStore, setUserStore] = useState<{ store_id: string; name: string } | null>(null)

  // Load subcategories when category is selected
  useEffect(() => {
    if (category && currentStep === 'subcategory') {
      loadSubcategories()
    }
  }, [category, currentStep])

  // Load user store when component mounts
  useEffect(() => {
    const loadUserStore = async () => {
      if (user) {
        const store = await getUserStore(user.telegram_user_id)
        if (store) {
          setUserStore({ store_id: store.store_id, name: store.name })
        }
      }
    }
    loadUserStore()
  }, [user])

  const loadSubcategories = async () => {
    if (!category) return
    
    setLoadingSubcategories(true)
    try {
      const subs = await getSubcategories(category)
      setSubcategories(subs)
    } catch (error) {
      console.error('Error loading subcategories:', error)
    } finally {
      setLoadingSubcategories(false)
    }
  }

  const loadNestedSubcategories = async (parentSubcategoryId: string) => {
    if (!category) return
    
    setLoadingSubcategories(true)
    try {
      const nested = await getSubcategories(category, parentSubcategoryId)
      setNestedSubcategories(nested)
    } catch (error) {
      console.error('Error loading nested subcategories:', error)
    } finally {
      setLoadingSubcategories(false)
    }
  }

  const handleCategorySelect = (selectedCategory: ListingCategory) => {
    setCategory(selectedCategory)
    setCurrentStep('subcategory')
  }

  const handleSubcategorySelect = async (subcategory: Subcategory) => {
    // Check if this subcategory has nested subcategories
    const nested = await getSubcategories(category!, subcategory.subcategory_id)
    
    if (nested.length > 0) {
      // Show nested subcategories
      setSelectedSubcategory(subcategory)
      setNestedSubcategories(nested)
    } else {
      // No nested subcategories, proceed to form
      setSelectedSubcategory(subcategory)
      setCurrentStep('form')
    }
  }

  const handleNestedSubcategorySelect = (nestedSubcategory: Subcategory) => {
    setSelectedSubcategory(nestedSubcategory)
    setCurrentStep('form')
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

    if (!category) {
      alert('Iltimos, kategoriyani tanlang')
      return
    }

    setLoading(true)
    try {
      // Upload photos
      console.log('Starting photo upload...')
      const photoFiles = photos.map((dataUrl, index) => {
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
        is_boosted: false,
        subcategory_id: selectedSubcategory?.subcategory_id,
        store_id: listingType === 'store' && userStore ? userStore.store_id : undefined
      })

      if (listing) {
        console.log('Listing created successfully:', listing.listing_id)
        navigate('/')
      } else {
        alert('E\'lon yaratilmadi. Iltimos, brauzer konsolini tekshiring.')
      }
    } catch (error: unknown) {
      console.error('Error creating listing:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`E'lon yaratilmadi: ${errorMessage}. Iltimos, brauzer konsolini tekshiring.`)
    } finally {
      setLoading(false)
    }
  }, [user, title, description, photos, category, condition, price, isFree, neighborhood, location, selectedSubcategory, listingType, userStore, navigate])

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

  const canProceedFromPhotos = photos.length > 0
  const canProceedFromCategory = category !== null
  const canProceedFromSubcategory = selectedSubcategory !== null
  const canSubmitForm = user && title.trim().length > 0 && description.trim().length > 0 && photos.length > 0 && category !== null

  useEffect(() => {
    const webApp = initTelegram()
    if (webApp) {
      // Set up Main Button based on current step
      if (currentStep === 'form') {
        webApp.MainButton.setText('E\'lon Yaratish')
        webApp.MainButton.show()
        
        const handleMainButtonClick = () => {
          console.log('MainButton clicked')
          handleSubmit()
        }
        
        webApp.MainButton.onClick(handleMainButtonClick)

        // Enable/disable Main Button based on form validity
        if (canSubmitForm) {
          webApp.MainButton.enable()
        } else {
          webApp.MainButton.disable()
        }

        return () => {
          webApp.MainButton.offClick(handleMainButtonClick)
          webApp.MainButton.hide()
        }
      } else {
        webApp.MainButton.hide()
      }

      // Request location only once
      if (!location) {
        requestLocation().then((loc) => {
          if (loc) {
            setLocation(loc)
          }
        })
      }
    }
  }, [currentStep, canSubmitForm, handleSubmit, location])

  // Render based on current step
  if (currentStep === 'photos') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center px-4 py-3">
            <BackButton />
            <h1 className="flex-1 text-center font-semibold text-gray-900">Rasmlar</h1>
            <div className="w-10"></div>
          </div>
        </header>

        <div className="p-4">
          <div className="mb-4">
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

          <button
            onClick={() => setCurrentStep('category')}
            disabled={!canProceedFromPhotos}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              canProceedFromPhotos
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Keyingi qadam
            <ChevronRightIcon className="w-5 h-5 inline-block ml-2" />
          </button>
        </div>

        <BottomNav />
      </div>
    )
  }

  if (currentStep === 'category') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => setCurrentStep('photos')}
              className="p-2 -ml-2"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="flex-1 text-center font-semibold text-gray-900">Kategoriya Tanlash</h1>
            <div className="w-10"></div>
          </div>
        </header>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">E'lon uchun kategoriyani tanlang:</p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategorySelect(cat.value)}
                className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                <div className="text-3xl mb-2">{cat.emoji}</div>
                <div className="font-medium text-gray-900">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        <BottomNav />
      </div>
    )
  }

  if (currentStep === 'subcategory') {
    const displaySubcategories = nestedSubcategories.length > 0 ? nestedSubcategories : subcategories
    const showBackToParent = nestedSubcategories.length > 0

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => {
                if (showBackToParent) {
                  setNestedSubcategories([])
                  setSelectedSubcategory(null)
                } else {
                  setCurrentStep('category')
                }
              }}
              className="p-2 -ml-2"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="flex-1 text-center font-semibold text-gray-900">
              {showBackToParent ? selectedSubcategory?.name_uz : CATEGORIES.find(c => c.value === category)?.label}
            </h1>
            <div className="w-10"></div>
          </div>
        </header>

        <div className="p-4">
          {loadingSubcategories ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : displaySubcategories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Bu kategoriya uchun subkategoriyalar topilmadi
            </div>
          ) : (
            <div className="space-y-2">
              {displaySubcategories.map((sub) => (
                <button
                  key={sub.subcategory_id}
                  onClick={() => {
                    if (nestedSubcategories.length > 0) {
                      handleNestedSubcategorySelect(sub)
                    } else {
                      handleSubcategorySelect(sub)
                    }
                  }}
                  className="w-full p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors text-left flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">{sub.name_uz}</div>
                    {sub.description_uz && (
                      <div className="text-sm text-gray-500 mt-1">{sub.description_uz}</div>
                    )}
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    )
  }

  // Form step
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => setCurrentStep('subcategory')}
            className="p-2 -ml-2"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
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
        {/* Selected Category & Subcategory Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <span className="font-medium">Kategoriya:</span> {CATEGORIES.find(c => c.value === category)?.label}
          </div>
          {selectedSubcategory && (
            <div className="text-sm text-blue-800 mt-1">
              <span className="font-medium">Subkategoriya:</span> {selectedSubcategory.name_uz}
            </div>
          )}
        </div>

        {/* Listing Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kim nomidan? *
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50">
              <input
                type="radio"
                name="listingType"
                value="personal"
                checked={listingType === 'personal'}
                onChange={() => setListingType('personal')}
                className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Shaxsiy</div>
                <div className="text-sm text-gray-500">Shaxsiy hisobingizdan e'lon joylashtirish</div>
              </div>
            </label>
            {userStore ? (
              <label className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50">
                <input
                  type="radio"
                  name="listingType"
                  value="store"
                  checked={listingType === 'store'}
                  onChange={() => setListingType('store')}
                  className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Do'kon</div>
                  <div className="text-sm text-gray-500">{userStore.name} do'konidan e'lon joylashtirish</div>
                </div>
              </label>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200 opacity-60">
                <div className="font-medium text-gray-700">Do'kon</div>
                <div className="text-sm text-gray-500">Do'kon yaratish uchun profilga o'ting</div>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sarlavha *
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
            Tavsif *
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
            Narx
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
