import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { createStore, getUserStore } from '../lib/supabase'
import { uploadImages } from '../lib/imageUpload'
import { CATEGORIES, type ListingCategory } from '../types'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import StorePreview from '../components/StorePreview'
import BannerCropper from '../components/BannerCropper'
import { PhotoIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline'
import { initTelegram } from '../lib/telegram'
import type { Store } from '../types'

export default function CreateStore() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [existingStore, setExistingStore] = useState<{ store_id: string; name: string } | null>(null)
  const [checkingStore, setCheckingStore] = useState(true)
  
  // Store data
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ListingCategory>('other')
  const [logo, setLogo] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [bannerToCrop, setBannerToCrop] = useState<string | null>(null)

  // Check if user already has a store
  useEffect(() => {
    const checkExistingStore = async () => {
      if (user) {
        setCheckingStore(true)
        const store = await getUserStore(user.telegram_user_id)
        if (store) {
          setExistingStore({ store_id: store.store_id, name: store.name })
        }
        setCheckingStore(false)
      }
    }
    checkExistingStore()
  }, [user])

  // Prepare preview store object
  const previewStore: Partial<Store> & { name: string; category: ListingCategory } = {
    name: name || 'Store Name',
    description: description || undefined,
    category,
    logo_url: logo || undefined,
    banner_url: banner || undefined,
    owner: user || undefined,
    subscriber_count: 0,
    is_verified: false,
    is_active: false
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

  const handleImageUpload = (type: 'logo' | 'banner') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (type === 'logo') {
          setLogo(result)
        } else {
          // Banner uchun cropping oynasini ochamiz
          setBannerToCrop(result)
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleBannerCrop = (croppedImageDataUrl: string) => {
    setBanner(croppedImageDataUrl)
    setBannerToCrop(null)
  }

  const handleBannerCropCancel = () => {
    setBannerToCrop(null)
  }

  const handleSubmit = useCallback(async () => {
    if (existingStore) {
      alert('Sizda allaqachon do\'kon mavjud. Bitta foydalanuvchi faqat bitta do\'kon yarata oladi.')
      navigate(`/store/${existingStore.store_id}`)
      return
    }
    
    if (!user) {
      alert('Foydalanuvchi ma\'lumotlari yuklanmoqda. Iltimos, kuting...')
      return
    }

    if (!name.trim() || !description.trim()) {
      alert('Iltimos, do\'kon nomi va tavsifini to\'ldiring')
      return
    }

    if (!logo || !banner) {
      alert('Iltimos, do\'kon logosi va bannerini yuklang')
      return
    }

    setLoading(true)
    try {
      // Upload logo
      let logoUrl = ''
      if (logo) {
        const logoFile = dataUrlToFile(logo, 'logo.jpg')
        const logoUrls = await uploadImages([logoFile])
        logoUrl = logoUrls[0]
      }

      // Upload banner
      let bannerUrl = ''
      if (banner) {
        const bannerFile = dataUrlToFile(banner, 'banner.jpg')
        const bannerUrls = await uploadImages([bannerFile])
        bannerUrl = bannerUrls[0]
      }

      console.log('Creating store...')
      const store = await createStore({
        owner_telegram_id: user.telegram_user_id,
        name: name.trim(),
        description: description.trim(),
        category,
        logo_url: logoUrl,
        banner_url: bannerUrl
      })

      if (store) {
        console.log('Store created successfully:', store.store_id)
        navigate(`/store/${store.store_id}`)
      } else {
        alert('Do\'kon yaratilmadi. Iltimos, brauzer konsolini tekshiring.')
      }
    } catch (error: unknown) {
      console.error('Error creating store:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Do'kon yaratilmadi: ${errorMessage}. Iltimos, brauzer konsolini tekshiring.`)
    } finally {
      setLoading(false)
    }
  }, [user, name, description, category, logo, banner, existingStore, navigate])

  const canSubmit = user && name.trim().length > 0 && description.trim().length > 0 && logo && banner

  useEffect(() => {
    const webApp = initTelegram()
    if (webApp && !showPreview) {
      webApp.MainButton.setText('Do\'kon Yaratish')
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

  if (checkingStore) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (existingStore) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center px-4 py-3">
            <BackButton />
            <h1 className="flex-1 text-center font-semibold text-gray-900">Do'kon Yaratish</h1>
            <div className="w-10"></div>
          </div>
        </header>
        <div className="p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sizda allaqachon do'kon mavjud</h2>
            <p className="text-gray-600 mb-4">{existingStore.name}</p>
            <button
              onClick={() => navigate(`/store/${existingStore.store_id}`)}
              className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Do'konni Ko'rish
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
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
        <StorePreview store={previewStore} isPreview={true} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center font-semibold text-gray-900">Do'kon Yaratish</h1>
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

      {/* LIVE PREVIEW (Mobile: top, Desktop: side-by-side) */}
      <div className="md:grid md:grid-cols-2 md:gap-4">
        {/* PREVIEW COLUMN */}
        <div className="md:sticky md:top-14 md:h-[calc(100vh-56px)] md:overflow-y-auto">
          <div className="p-4 bg-gray-100 md:bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <StorePreview store={previewStore} isPreview={true} />
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner * (16:9 nisbat)
              </label>
              {banner ? (
                <div className="relative w-full rounded-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
                  <img src={banner} alt="Banner" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setBanner(null)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleImageUpload('banner')}
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                  style={{ aspectRatio: '16/9', minHeight: '120px' }}
                >
                  <PhotoIcon className="w-12 h-12 mb-2" />
                  <span className="text-sm">Banner yuklash</span>
                </button>
              )}
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo * (dumaloq)
              </label>
              {logo ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                  <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setLogo(null)}
                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleImageUpload('logo')}
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
              disabled={!canSubmit || loading}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                canSubmit && !loading
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Do'kon yaratilmoqda...</p>
          </div>
        </div>
      )}

      {/* Banner Cropper Modal */}
      {bannerToCrop && (
        <BannerCropper
          imageSrc={bannerToCrop}
          onCrop={handleBannerCrop}
          onCancel={handleBannerCropCancel}
          aspectRatio={16 / 9}
        />
      )}

      <BottomNav />
    </div>
  )
}
