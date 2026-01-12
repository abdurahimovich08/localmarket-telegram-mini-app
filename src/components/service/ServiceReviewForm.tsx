import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import { uploadImages, uploadToSupabase } from '../../lib/imageUpload'
import { createService, updateService } from '../../lib/supabase'
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline'
import type { ServiceData } from '../../services/GeminiService'
import { sendMessage, startChatSession } from '../../services/GeminiService'
import { validateAndNormalizeTags, sanitizeAITags, TAG_RULES } from '../../lib/tagUtils'
import LogoUploader from '../LogoUploader'
import PortfolioUploader from '../PortfolioUploader'
import type { Service } from '../../types'

interface ServiceReviewFormProps {
  data: ServiceData
  onBack?: () => void
  editMode?: boolean
  serviceId?: string
  existingService?: Service
}

export default function ServiceReviewForm({ 
  data, 
  onBack, 
  editMode = false,
  serviceId,
  existingService 
}: ServiceReviewFormProps) {
  const navigate = useNavigate()
  const { user } = useUser()
  const [formData, setFormData] = useState<ServiceData>(data)
  const [logo, setLogo] = useState<string | null>(null)
  const [portfolio, setPortfolio] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFixingTags, setIsFixingTags] = useState(false)

  // Load existing service data in edit mode
  useEffect(() => {
    if (editMode && existingService) {
      setLogo(existingService.logo_url || existingService.image_url || null)
      setPortfolio(existingService.portfolio_images || [])
    }
  }, [editMode, existingService])

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

  // Note: validateAndNormalizeTags is now imported from lib/tagUtils.ts

  // AI tag correction function
  const handleFixTags = async () => {
    if (formData.tags.length === 0 || isFixingTags) return

    setIsFixingTags(true)
    setError(null)

    try {
      // Create a prompt for AI to fix tags
      const prompt = `Quyidagi teglarni to'g'irlab ber. Qoidalar:
1. FAQAT lotin alifbosi (a-z), kichik harflar
2. 3-7 ta teg (eng muhimlarini tanla)
3. Bir xil teg ikki marta bo'lmasin
4. Har bir teg bitta so'z yoki qisqa ibora (2-3 so'z)

Teglar: ${formData.tags.join(', ')}

FAQAT JSON formatda javob qaytar:
{
  "tags": ["tag1", "tag2", "tag3"]
}`

      const chatSession = await startChatSession()
      const response = await sendMessage(chatSession, prompt)

      // Try to parse JSON from response
      const text = response.message || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.tags && Array.isArray(parsed.tags)) {
            const fixedTags = validateAndNormalizeTags(parsed.tags)
            setFormData({ ...formData, tags: fixedTags })
          } else {
            throw new Error('Invalid response format')
          }
        } catch (e) {
          // If JSON parsing fails, try to extract tags from text
          const tagMatches = text.match(/"tags":\s*\[(.*?)\]/s)
          if (tagMatches) {
            const tagsStr = tagMatches[1]
            const extractedTags = tagsStr.match(/"([^"]+)"/g)?.map(t => t.replace(/"/g, '')) || []
            // Use sanitizeAITags for strict validation of AI output
            const fixedTags = sanitizeAITags(extractedTags)
            setFormData({ ...formData, tags: fixedTags })
          } else {
            throw new Error('Could not extract tags from AI response')
          }
        }
      } else {
        throw new Error('AI did not return valid JSON')
      }
    } catch (error) {
      console.error('Error fixing tags:', error)
      setError('Teglarni to\'g\'irlashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
    } finally {
      setIsFixingTags(false)
    }
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

    if (!logo) {
      setError('Iltimos, logo rasmini yuklang')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Upload logo
      let logoUrl: string | null = null
      if (logo) {
        // Check if logo is a data URL (new upload) or URL (existing)
        if (logo.startsWith('data:')) {
          const logoFile = dataUrlToFile(logo, 'logo.jpg')
          const logoUrls = await uploadImages([logoFile])
          logoUrl = logoUrls[0]
        } else {
          // Logo is already a URL, use it directly
          logoUrl = logo
        }
      }

      // Upload portfolio images
      let portfolioUrls: string[] = []
      if (portfolio.length > 0) {
        const portfolioFiles = portfolio
          .filter(img => img.startsWith('data:')) // Only upload new images (data URLs)
          .map((img, index) => dataUrlToFile(img, `portfolio-${index}.jpg`))
        
        if (portfolioFiles.length > 0) {
          const uploadedUrls = await uploadImages(portfolioFiles)
          portfolioUrls = uploadedUrls
        }
        
        // Keep existing URLs (those that don't start with 'data:')
        const existingUrls = portfolio.filter(img => !img.startsWith('data:'))
        portfolioUrls = [...existingUrls, ...portfolioUrls]
      }

      if (editMode && serviceId) {
        // Update existing service
        // Ensure tags are validated before saving
        const validatedTags = validateAndNormalizeTags(formData.tags)
        const updatedService = await updateService(serviceId, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          price_type: formData.priceType,
          price: formData.price.trim(),
          tags: validatedTags,
          logo_url: logoUrl,
          portfolio_images: portfolioUrls,
          image_url: logoUrl, // Backward compatibility
        })

        if (updatedService) {
          navigate(`/service/${serviceId}`)
        } else {
          setError('Xizmatni yangilashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
        }
      } else {
        // Create new service
        // Ensure tags are validated before saving
        const validatedTags = validateAndNormalizeTags(formData.tags)
        const newServiceId = await createService({
          ...formData,
          tags: validatedTags,
          logo_url: logoUrl,
          portfolio_images: portfolioUrls,
          provider_telegram_id: user.telegram_user_id,
        })

        if (newServiceId) {
          navigate(`/service/${newServiceId}`)
        } else {
          setError('Xizmatni saqlashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
        }
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
          <h1 className="flex-1 text-center font-semibold text-gray-900">
            {editMode ? 'Xizmatni Tahrirlash' : 'Xizmatni Ko\'rib Chiqish'}
          </h1>
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
          {/* Logo Upload */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <LogoUploader
              logo={logo}
              onLogoChange={setLogo}
              required={true}
            />
          </div>

          {/* Portfolio Upload */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <PortfolioUploader
              portfolio={portfolio}
              onPortfolioChange={setPortfolio}
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
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Teglar (vergul bilan ajrating)
                      </label>
                      <button
                        type="button"
                        onClick={handleFixTags}
                        disabled={isFixingTags || formData.tags.length === 0}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-primary hover:text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <SparklesIcon className="w-4 h-4" />
                        {isFixingTags ? 'To\'g\'irlanmoqda...' : '✨ Teglarni to\'g\'irlash'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.tags.join(', ')}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        const tags = inputValue.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                        // Apply validation: lowercase, remove duplicates, limit to 7
                        const validatedTags = validateAndNormalizeTags(tags)
                        setFormData({ ...formData, tags: validatedTags })
                      }}
                      placeholder="Masalan: dasturlash, web, frontend"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {formData.tags.length}/{TAG_RULES.MAX} ta teg (lotin alifbosi, kichik harflar)
                      </p>
                      {formData.tags.length > TAG_RULES.MAX && (
                        <p className="text-xs text-red-600">Maksimum {TAG_RULES.MAX} ta teg!</p>
                      )}
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => {
                                const newTags = formData.tags.filter((_, i) => i !== index)
                                setFormData({ ...formData, tags: newTags })
                              }}
                              className="ml-1 hover:text-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

          {/* Submit Button */}
          <div className="pb-4">
            <button
              type="submit"
              disabled={isSaving || !logo}
              className={`w-full py-4 rounded-lg font-medium transition-colors ${
                isSaving || !logo
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark'
              }`}
            >
              {isSaving ? 'Saqlanmoqda...' : editMode ? 'Xizmatni Yangilash' : 'Xizmatni Saqlash'}
            </button>
            {!logo && (
              <p className="text-sm text-red-600 mt-2 text-center">Iltimos, logo rasmini yuklang</p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
