import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getStore, updateStore, getStoreListings } from '../lib/supabase'
import { uploadImages } from '../lib/imageUpload'
import { CATEGORIES, type ListingCategory } from '../types'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import StorePreview from '../components/StorePreview'
import StoreBannerUploader from '../components/StoreBannerUploader'
import { PhotoIcon, XMarkIcon, EyeIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { initTelegram } from '../lib/telegram'
import type { Store } from '../types'

export default function EditStore() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [store, setStore] = useState<Store | null>(null)
  const [listings, setListings] = useState([])
  
  // Store data
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ListingCategory>('other')
  const [logo, setLogo] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [logoChanged, setLogoChanged] = useState(false)
  const [bannerChanged, setBannerChanged] = useState(false)

  // Load store data
  useEffect(() => {
    const loadStore = async () => {
      if (!id || !user) return

      setLoading(true)
      try {
        const storeData = await getStore(id, user.telegram_user_id)
        if (!storeData) {
          navigate('/')
          return
        }

        // Check if user is owner
        if (storeData.owner_telegram_id !== user.telegram_user_id) {
          navigate(`/store/${id}`)
          return
        }

        setStore(storeData)
        setName(storeData.name)
        setDescription(storeData.description || '')
        setCategory(storeData.category)
        setLogo(storeData.logo_url || null)
        setBanner(storeData.banner_url || null)

        // Load store listings for preview
        const storeListings = await getStoreListings(id)
        setListings(storeListings)
      } catch (error) {
        console.error('Error loading store:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    loadStore()
  }, [id, user, navigate])

  // Prepare preview store object
  const previewStore: Partial<Store> & { name: string; category: ListingCategory } = {
    ...store,
    name: name || store?.name || 'Store Name',
    description: description || store?.description || undefined,
    category,
    logo_url: logo || store?.logo_url || undefined,
    banner_url: banner || store?.banner_url || undefined,
  }

  const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime || 'image/jpeg' })
  }

  const handleLogoUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setLogo(result)
        setLogoChanged(true)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleBannerChange = (newBanner: string | null) => {
    setBanner(newBanner)
    setBannerChanged(true)
  }

  const handleSubmit = useCallback(async () => {
    if (!store || !user || !id) return

    if (!name.trim() || !description.trim()) {
      alert('Iltimos, do\'kon nomi va tavsifini to\'ldiring')
      return
    }

    setSaving(true)
    try {
      let logoUrl = store.logo_url
      let bannerUrl = store.banner_url

      // Upload logo if changed
      if (logoChanged && logo) {
        const logoFile = dataUrlToFile(logo, 'logo.jpg')
        const logoUrls = await uploadImages([logoFile])
        logoUrl = logoUrls[0]
      }

      // Upload banner if changed
      if (bannerChanged && banner) {
        const bannerFile = dataUrlToFile(banner, 'banner.jpg')
        const bannerUrls = await uploadImages([bannerFile])
        bannerUrl = bannerUrls[0]
      }

      console.log('Updating store...')
      const updatedStore = await updateStore(id, {
        name: name.trim(),
        description: description.trim(),
        category,
        logo_url: logoUrl,
        banner_url: bannerUrl
      })

      if (updatedStore) {
        console.log('Store updated successfully')
        navigate(`/store/${id}`)
      } else {
        alert('Do\'kon yangilanmadi. Iltimos, brauzer konsolini tekshiring.')
      }
    } catch (error: unknown) {
      console.error('Error updating store:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Do'kon yangilanmadi: ${errorMessage}. Iltimos, brauzer konsolini tekshiring.`)
    } finally {
      setSaving(false)
    }
  }, [store, user, id, name, description, category, logo, banner, logoChanged, bannerChanged, navigate])

  const canSubmit = name.trim().length > 0 && description.trim().length > 0

  useEffect(() => {
    const webApp = initTelegram()
    if (webApp && !showPreview) {
      webApp.MainButton.setText('Saqlash')
      webApp.MainButton.show()
      
      const handleMainButtonClick = () => {
        handleSubmit()
      }
      
      webApp.MainButton.onClick(handleMainButtonClick)

      if (canSubmit) {
        webApp.MainButton.enable()
      } else {
        webApp.MainButton.disable()
      }

      return () => {
        webApp.MainButton.offClick(handleMainButtonClick)
        webApp.MainButton.hide()
      }
    }
  }, [canSubmit, handleSubmit, showPreview])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!store) {
    return null
  }

  // Full screen preview
  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 -ml-2"
            >
              <BackButton />
            </button>
            <h1 className="flex-1 text-center font-semibold text-gray-900">Preview</h1>
            <div className="w-10"></div>
          </div>
        </header>
        <StorePreview store={previewStore} listings={listings} isPreview={false} />
      </div>
    )
  }

  const getStatusIcon = () => {
    if (store.is_active) {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />
    }
    return <ClockIcon className="w-5 h-5 text-yellow-500" />
  }

  const getStatusText = () => {
    if (store.is_active) {
      return 'Active'
    }
    return 'Pending'
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center font-semibold text-gray-900">Do'konni Tahrirlash</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* STORE STATUS SECTION */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Do'kon holati:</span>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-sm font-semibold text-gray-900">{getStatusText()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Verified:</span>
            {store.is_verified ? (
              <CheckCircleIcon className="w-5 h-5 text-blue-500" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Mahsulotlar soni: {listings.length} | Obunachilar: {store.subscriber_count}
        </div>
      </div>

      {/* LIVE PREVIEW + FORM */}
      <div className="md:grid md:grid-cols-2 md:gap-4">
        {/* PREVIEW COLUMN */}
        <div className="md:sticky md:top-[112px] md:h-[calc(100vh-112px)] md:overflow-y-auto">
          <div className="p-4 bg-gray-100 md:bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <StorePreview store={previewStore} listings={listings} isPreview={false} />
            </div>
          </div>
        </div>

        {/* FORM COLUMN */}
        <div className="p-4 space-y-6">
          {/* BASIC INFO SECTION */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Asosiy ma'lumotlar</h2>
            
            {/* Store Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Do'kon nomi *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder="Do'kon nomini kiriting"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">{name.length}/100</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategoriya *
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
          </div>

          {/* BRANDING SECTION */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Brending</h2>
            
            {/* Banner Upload */}
            <StoreBannerUploader
              banner={banner}
              onBannerChange={handleBannerChange}
              required={false}
            />

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo (dumaloq)
              </label>
              {logo ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                  <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setLogo(null)
                      setLogoChanged(true)
                    }}
                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogoUpload}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                >
                  <PhotoIcon className="w-8 h-8 mb-1" />
                  <span className="text-xs">Logo</span>
                </button>
              )}
            </div>
          </div>

          {/* DESCRIPTION SECTION */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tavsif</h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Do'kon haqida ma'lumot kiriting..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 pb-4">
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <EyeIcon className="w-5 h-5" />
              Preview
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                canSubmit && !saving
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>

      {saving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Do'kon yangilanmoqda...</p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
