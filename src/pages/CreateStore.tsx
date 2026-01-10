import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { createStore } from '../lib/supabase'
import { uploadImages } from '../lib/imageUpload'
import { CATEGORIES, type ListingCategory } from '../types'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { initTelegram } from '../lib/telegram'

export default function CreateStore() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  
  // Store data
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ListingCategory>('other')
  const [logo, setLogo] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
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
  }, [user, name, description, category, logo, banner, navigate])

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
          setBanner(result)
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const canSubmit = user && name.trim().length > 0 && description.trim().length > 0 && logo && banner

  useEffect(() => {
    const webApp = initTelegram()
    if (webApp) {
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
  }, [canSubmit, handleSubmit])

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

      <div className="p-4 space-y-6">
        {/* Banner Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Banner *
          </label>
          {banner ? (
            <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100">
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
              className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
            >
              <PhotoIcon className="w-12 h-12 mb-2" />
              <span className="text-sm">Banner yuklash</span>
            </button>
          )}
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo *
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

        {/* Store Name */}
        <div>
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
            placeholder="Do'kon haqida ma'lumot kiriting..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
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

      <BottomNav />
    </div>
  )
}
