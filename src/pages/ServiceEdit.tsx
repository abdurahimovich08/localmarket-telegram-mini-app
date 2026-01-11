import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getService, updateService } from '../lib/supabase'
import { uploadImages } from '../lib/imageUpload'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import LogoUploader from '../components/LogoUploader'
import PortfolioUploader from '../components/PortfolioUploader'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import type { Service } from '../types'

export default function ServiceEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [service, setService] = useState<Service | null>(null)
  
  // Form data
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priceType, setPriceType] = useState<'fixed' | 'hourly' | 'negotiable'>('fixed')
  const [price, setPrice] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [logo, setLogo] = useState<string | null>(null)
  const [portfolio, setPortfolio] = useState<string[]>([])
  const [logoChanged, setLogoChanged] = useState(false)
  const [portfolioChanged, setPortfolioChanged] = useState(false)

  // Load service data
  useEffect(() => {
    const loadService = async () => {
      if (!id || !user) return

      setLoading(true)
      try {
        const serviceData = await getService(id)
        if (!serviceData) {
          navigate('/')
          return
        }

        // Check if user is owner
        if (serviceData.provider_telegram_id !== user.telegram_user_id) {
          navigate(`/service/${id}`)
          return
        }

        setService(serviceData)
        setTitle(serviceData.title)
        setDescription(serviceData.description)
        setCategory(serviceData.category)
        setPriceType(serviceData.price_type)
        setPrice(serviceData.price || '')
        setTags(serviceData.tags || [])
        setLogo(serviceData.logo_url || serviceData.image_url || null)
        setPortfolio(serviceData.portfolio_images || [])
      } catch (error) {
        console.error('Error loading service:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    loadService()
  }, [id, user, navigate])

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

  const handleLogoChange = (newLogo: string | null) => {
    setLogo(newLogo)
    setLogoChanged(true)
  }

  const handlePortfolioChange = (newPortfolio: string[]) => {
    setPortfolio(newPortfolio)
    setPortfolioChanged(true)
  }

  const handleSubmit = useCallback(async () => {
    if (!service || !user || !id) return

    if (!title.trim() || !description.trim()) {
      alert('Iltimos, sarlavha va tavsifni to\'ldiring')
      return
    }

    if (!logo) {
      alert('Iltimos, logo rasmini yuklang')
      return
    }

    setSaving(true)
    try {
      let logoUrl = service.logo_url || service.image_url || null
      let portfolioUrls = service.portfolio_images || []

      // Upload logo if changed
      if (logoChanged && logo) {
        const logoFile = dataUrlToFile(logo, 'logo.jpg')
        const logoUrls = await uploadImages([logoFile])
        logoUrl = logoUrls[0]
      }

      // Upload portfolio if changed
      if (portfolioChanged && portfolio.length > 0) {
        const portfolioFiles = portfolio.map((img, index) => dataUrlToFile(img, `portfolio-${index}.jpg`))
        portfolioUrls = await uploadImages(portfolioFiles)
      }

      console.log('Updating service...')
      const updatedService = await updateService(id, {
        title: title.trim(),
        description: description.trim(),
        category,
        price_type: priceType,
        price: price.trim(),
        tags,
        logo_url: logoUrl,
        portfolio_images: portfolioUrls,
        image_url: logoUrl, // Backward compatibility
      })

      if (updatedService) {
        console.log('Service updated successfully')
        navigate(`/service/${id}`)
      } else {
        alert('Xizmat yangilanmadi. Iltimos, brauzer konsolini tekshiring.')
      }
    } catch (error: unknown) {
      console.error('Error updating service:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Xizmat yangilanmadi: ${errorMessage}. Iltimos, brauzer konsolini tekshiring.`)
    } finally {
      setSaving(false)
    }
  }, [service, user, id, title, description, category, priceType, price, tags, logo, portfolio, logoChanged, portfolioChanged, navigate])

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && logo

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!service) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center font-semibold text-gray-900">Xizmatni Tahrirlash</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* Logo Upload */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <LogoUploader
              logo={logo}
              onLogoChange={handleLogoChange}
              required={true}
            />
          </div>

          {/* Portfolio Upload */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <PortfolioUploader
              portfolio={portfolio}
              onPortfolioChange={handlePortfolioChange}
              maxImages={4}
            />
          </div>

          {/* Title */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sarlavha *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Xizmat sarlavhasi"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tavsif *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={6}
              placeholder="Xizmat haqida batafsil ma'lumot..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
          </div>

          {/* Category */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategoriya *
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Kategoriya"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Price Type and Price */}
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Narx turi *
              </label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as 'fixed' | 'hourly' | 'negotiable')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="fixed">Belgilangan narx</option>
                <option value="hourly">Soatlik</option>
                <option value="negotiable">Kelishiladi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Narx *
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Masalan: 100000 so'm yoki Soatlik 50000 so'm"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teglar (vergul bilan ajrating)
            </label>
            <input
              type="text"
              value={tags.join(', ')}
              onChange={(e) => {
                const newTags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                setTags(newTags)
              }}
              placeholder="Masalan: dasturlash, web, frontend"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pb-4">
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className={`w-full py-4 rounded-lg font-medium transition-colors ${
                canSubmit && !saving
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saqlanmoqda...' : 'Xizmatni Saqlash'}
            </button>
            {!logo && (
              <p className="text-sm text-red-600 mt-2 text-center">Iltimos, logo rasmini yuklang</p>
            )}
          </div>
        </form>
      </div>

      {saving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Xizmat yangilanmoqda...</p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
