/**
 * Unified Review Form Component
 * 
 * Dynamically generates form fields based on category schema
 * Works for BOTH products and services
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { uploadImages } from '../lib/imageUpload'
import { compressDataUrls } from '../lib/imageCompression'
import { createListing, createService } from '../lib/supabase'
import { useEntityMutations } from '../hooks/useEntityMutations'
import { validateAndNormalizeTags } from '../lib/tagUtils'
import type { UnifiedAIOutput, CategorySchema, FieldSchema } from '../schemas/categories/types'
import { validateRequiredFields } from '../schemas/categories'
import { saveTaxonomySelection } from '../services/SellerMemory'
import { CLOTHING_TAXONOMY } from '../taxonomy/clothing.uz'
import LogoUploader from './LogoUploader'
import PortfolioUploader from './PortfolioUploader'
import BackButton from './BackButton'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface UnifiedReviewFormProps {
  data: UnifiedAIOutput
  schema: CategorySchema
  onBack?: () => void
  editMode?: boolean
  existingId?: string
}

export default function UnifiedReviewForm({
  data,
  schema,
  onBack,
  editMode = false,
  existingId,
}: UnifiedReviewFormProps) {
  const navigate = useNavigate()
  const { user } = useUser()
  
  // Form state - merge AI data with schema defaults
  const [formData, setFormData] = useState<{
    core: Record<string, any>
    attributes: Record<string, any>
  }>({
    core: { ...data.core },
    attributes: { ...data.attributes },
  })

  // Images
  const [photos, setPhotos] = useState<string[]>([]) // For products
  const [logo, setLogo] = useState<string | null>(null) // For services
  const [portfolio, setPortfolio] = useState<string[]>([]) // For services

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use entity mutations for products, direct call for services (backward compatibility)
  const { create: createListingMutation, isLoading: isCreatingListing } = useEntityMutations('listing', {
    onSuccess: (listing) => {
      if (listing) {
        setIsSaving(false)
        navigate('/')
      }
    },
    onError: (error) => {
      setError(`E'lon yaratilmadi: ${error.message}`)
      setIsSaving(false)
    },
  })

  // Validate form data
  const validation = validateRequiredFields(schema, formData)
  const canSubmit = validation.valid && user && (
    schema.entityType === 'product' 
      ? photos.length > 0 
      : logo !== null
  )

  // Render field input based on field schema
  const renderField = (field: FieldSchema) => {
    const value = field.key in formData.core 
      ? formData.core[field.key]
      : formData.attributes[field.key] ?? field.defaultValue

    const updateValue = (newValue: any) => {
      if (field.key in formData.core) {
        setFormData(prev => ({
          ...prev,
          core: { ...prev.core, [field.key]: newValue }
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          attributes: { ...prev.attributes, [field.key]: newValue }
        }))
      }
    }

    // Check if field should be visible (dependsOn)
    if (field.dependsOn) {
      const dependsValue = field.dependsOn.field in formData.core
        ? formData.core[field.dependsOn.field]
        : formData.attributes[field.dependsOn.field]
      
      if (dependsValue !== field.dependsOn.value) {
        return null
      }
    }

    const isRequired = field.required
    const hasError = isRequired && (value === undefined || value === null || value === '')

    return (
      <div key={field.key} className="bg-white rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        
        {field.description && (
          <p className="text-xs text-gray-500 mb-2">{field.description}</p>
        )}

        {field.type === 'string' && (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateValue(e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.validation?.maxLength}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasError ? 'border-red-300' : 'border-gray-300'
            }`}
            required={isRequired}
          />
        )}

        {field.type === 'number' && (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => updateValue(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasError ? 'border-red-300' : 'border-gray-300'
            }`}
            required={isRequired}
          />
        )}

        {field.type === 'boolean' && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value ?? false}
              onChange={(e) => updateValue(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700">Ha</span>
          </label>
        )}

        {field.type === 'enum' && field.enumOptions && (
          <select
            value={value || ''}
            onChange={(e) => updateValue(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasError ? 'border-red-300' : 'border-gray-300'
            }`}
            required={isRequired}
          >
            <option value="">Tanlang...</option>
            {field.enumOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}

        {field.type === 'multi_select' && field.enumOptions && (
          <div className="space-y-2">
            {field.enumOptions.map(option => {
              const selected = Array.isArray(value) && value.includes(option)
              return (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      const current = Array.isArray(value) ? value : []
                      if (e.target.checked) {
                        updateValue([...current, option])
                      } else {
                        updateValue(current.filter(v => v !== option))
                      }
                    }}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              )
            })}
          </div>
        )}

        {field.type === 'array' && (
          <input
            type="text"
            value={Array.isArray(value) ? value.join(', ') : ''}
            onChange={(e) => {
              const items = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              updateValue(items)
            }}
            placeholder={field.placeholder}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasError ? 'border-red-300' : 'border-gray-300'
            }`}
            required={isRequired}
          />
        )}

        {hasError && (
          <p className="text-xs text-red-600 mt-1">Bu maydon majburiy</p>
        )}
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Foydalanuvchi ma\'lumotlari yuklanmoqda. Iltimos, kuting...')
      return
    }

    if (!canSubmit) {
      setError('Iltimos, barcha majburiy maydonlarni to\'ldiring')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (schema.entityType === 'product') {
        // Product creation
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

        // Compress and upload images
        const compressedFiles = await compressDataUrls(photos, {}, 'listing')
        const photoUrls = await uploadImages(compressedFiles)

        // Merge taxonomy context into attributes if available
        // Ensure we preserve existing attributes and merge context
        const finalAttributes = {
          ...formData.attributes, // Existing attributes from form
        }
        
        // Add taxonomy data from context (for clothing category)
        if (data.context?.taxonomy) {
          finalAttributes.taxonomy = data.context.taxonomy
          finalAttributes.tags = data.context.tags || []
          finalAttributes.clothing_type = data.context.taxonomy.labelUz
        }
        
        // Ensure attributes is not empty object
        if (Object.keys(finalAttributes).length === 0) {
          finalAttributes._empty = true // Placeholder to ensure JSONB is not null
        }

        // Create listing with attributes
        await createListingMutation({
          seller_telegram_id: user.telegram_user_id,
          title: formData.core.title,
          description: formData.core.description,
          price: formData.core.is_free ? undefined : formData.core.price,
          is_free: formData.core.is_free || false,
          category: schema.category as any,
          condition: formData.core.condition,
          photos: photoUrls,
          neighborhood: formData.core.neighborhood,
          latitude: formData.core.latitude,
          longitude: formData.core.longitude,
          old_price: formData.core.old_price,
          stock_qty: formData.core.stock_qty,
          status: 'active',
          is_boosted: false,
          // Store attributes in JSONB (includes taxonomy if available)
          attributes: finalAttributes,
        })
      } else {
        // Service creation
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

        // Upload logo
        let logoUrl: string | null = null
        if (logo) {
          if (logo.startsWith('data:')) {
            const logoFile = dataUrlToFile(logo, 'logo.jpg')
            const logoUrls = await uploadImages([logoFile])
            logoUrl = logoUrls[0]
          } else {
            logoUrl = logo
          }
        }

        // Upload portfolio
        let portfolioUrls: string[] = []
        if (portfolio.length > 0) {
          const portfolioFiles = portfolio
            .filter(img => img.startsWith('data:'))
            .map((img, index) => dataUrlToFile(img, `portfolio-${index}.jpg`))
          
          if (portfolioFiles.length > 0) {
            const uploadedUrls = await uploadImages(portfolioFiles)
            portfolioUrls = uploadedUrls
          }
          
          const existingUrls = portfolio.filter(img => !img.startsWith('data:'))
          portfolioUrls = [...existingUrls, ...portfolioUrls]
        }

        // Validate tags
        const tags = formData.core.tags || data.serviceFields?.tags || []
        const validatedTags = validateAndNormalizeTags(tags)

        const serviceId = await createService({
          title: formData.core.title,
          description: formData.core.description,
          category: formData.core.category || schema.category,
          priceType: formData.core.priceType || data.serviceFields?.priceType || 'fixed',
          price: formData.core.price || data.serviceFields?.price || '',
          tags: validatedTags,
          logo_url: logoUrl,
          portfolio_images: portfolioUrls,
          provider_telegram_id: user.telegram_user_id,
        })

        if (serviceId) {
          navigate(`/service/${serviceId}`)
        } else {
          setError('Xizmatni saqlashda xatolik yuz berdi')
        }
      }
    } catch (err) {
      console.error('Error saving:', err)
      setError('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
      setIsSaving(false)
    }
  }

  // Separate core fields from attribute fields
  const coreFields = schema.fields.filter(f => 
    ['title', 'description', 'price', 'is_free', 'condition', 'neighborhood', 'old_price', 'stock_qty', 
     'priceType', 'price', 'tags', 'category'].includes(f.key)
  )
  const attributeFields = schema.fields.filter(f => !coreFields.includes(f))

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
            {editMode ? 'Tahrirlash' : 'Ko\'rib Chiqish'}
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

        {!validation.valid && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              Quyidagi maydonlar to'ldirilmagan: {validation.missing.join(', ')}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          {schema.entityType === 'product' ? (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rasmlar * (kamida 1 ta)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {photos.length < 10 && (
                  <button
                    type="button"
                    onClick={() => {
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
                            setPhotos(prev => [...prev, result])
                          }
                          reader.readAsDataURL(file)
                        })
                      }
                      input.click()
                    }}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                  >
                    <span className="text-2xl">+</span>
                    <span className="text-xs">Rasm</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <LogoUploader
                  logo={logo}
                  onLogoChange={setLogo}
                  required={true}
                />
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <PortfolioUploader
                  portfolio={portfolio}
                  onPortfolioChange={setPortfolio}
                  maxImages={4}
                />
              </div>
            </>
          )}

          {/* Core Fields */}
          {coreFields.map(field => renderField(field))}

          {/* Attribute Fields */}
          {attributeFields.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-4">
                Qo'shimcha ma'lumotlar ({schema.displayName})
              </h3>
              <div className="space-y-4">
                {attributeFields.map(field => renderField(field))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pb-4">
            <button
              type="submit"
              disabled={isSaving || !canSubmit || isCreatingListing}
              className={`w-full py-4 rounded-lg font-medium transition-colors ${
                isSaving || !canSubmit || isCreatingListing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark'
              }`}
            >
              {isSaving || isCreatingListing 
                ? 'Saqlanmoqda...' 
                : editMode 
                  ? 'Yangilash' 
                  : 'Saqlash'
              }
            </button>
            {!canSubmit && (
              <p className="text-sm text-red-600 mt-2 text-center">
                {schema.entityType === 'product' 
                  ? 'Iltimos, kamida bitta rasm yuklang'
                  : 'Iltimos, logo rasmini yuklang'
                }
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
