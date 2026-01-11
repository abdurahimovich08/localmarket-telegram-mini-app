import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import { uploadToSupabase } from '../../lib/imageUpload'
import { createService } from '../../lib/supabase'
import { PhotoIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import type { ServiceData } from '../../services/GeminiService'

interface ServiceReviewFormProps {
  data: ServiceData
  onBack?: () => void
}

export default function ServiceReviewForm({ data, onBack }: ServiceReviewFormProps) {
  const navigate = useNavigate()
  const { user } = useUser()
  const [formData, setFormData] = useState<ServiceData>(data)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Foydalanuvchi ma\'lumotlari yuklanmoqda. Iltimos, kuting...')
      return
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Iltimos, sarlavha va tavsifni to\'ldiring')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Upload image if provided
      let imageUrl: string | null = null
      if (imageFile) {
        // Upload to services folder in Supabase storage
        imageUrl = await uploadToSupabase(imageFile, 'listings', 'services')
      }

      // Save service to database
      const serviceId = await createService({
        ...formData,
        image_url: imageUrl,
        provider_telegram_id: user.telegram_user_id,
      })

      if (serviceId) {
        navigate(`/service/${serviceId}`)
      } else {
        setError('Xizmatni saqlashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
      }
    } catch (err) {
      console.error('Error saving service:', err)
      setError('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
          )}
          <h1 className="flex-1 text-center font-semibold text-gray-900">Xizmatni Ko'rib Chiqish</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asosiy rasm (Portfolio/Avatar) *
            </label>
            {imagePreview ? (
              <div className="relative w-full rounded-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleImageUpload}
                className="w-full rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                style={{ aspectRatio: '16/9', minHeight: '120px' }}
              >
                <PhotoIcon className="w-12 h-12 mb-2" />
                <span className="text-sm">Rasm yuklash</span>
              </button>
            )}
          </div>

          {/* Title */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sarlavha *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={100}
              placeholder="Xizmat sarlavhasi"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100</p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tavsif *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
              rows={6}
              placeholder="Xizmat haqida batafsil ma'lumot..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500</p>
          </div>

          {/* Category */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategoriya *
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                value={formData.priceType}
                onChange={(e) => setFormData({ ...formData, priceType: e.target.value as 'fixed' | 'hourly' | 'negotiable' })}
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
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
              value={formData.tags.join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                setFormData({ ...formData, tags })
              }}
              placeholder="Masalan: dasturlash, web, frontend"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
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
              disabled={isSaving || !imageFile}
              className={`w-full py-4 rounded-lg font-medium transition-colors ${
                isSaving || !imageFile
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark'
              }`}
            >
              {isSaving ? 'Saqlanmoqda...' : 'Xizmatni Saqlash'}
            </button>
            {!imageFile && (
              <p className="text-sm text-red-600 mt-2 text-center">Iltimos, asosiy rasmni yuklang</p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
