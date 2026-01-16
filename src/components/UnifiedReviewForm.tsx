/**
 * Unified Review Form Component
 * 
 * Dynamically generates form fields based on category schema
 * Works for BOTH products and services
 */

import { useState, useEffect, useRef } from 'react'
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
import LocationDisplay from './LocationDisplay'
import InlineAIAssistant from './InlineAIAssistant'
import BannerCropper from './BannerCropper'
import { ArrowLeftIcon, ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface UnifiedReviewFormProps {
  data: UnifiedAIOutput
  schema: CategorySchema
  onBack?: () => void
  editMode?: boolean
  existingId?: string
  taxonomyContext?: {
    taxonomy: { 
      id: string
      pathUz: string
      audience: string
      segment: string
      labelUz: string
      audienceUz?: string
      segmentUz?: string
      leafUz?: string
    }
    taxonomyNode?: any
    tags: string[]
  } | null
}

export default function UnifiedReviewForm({
  data,
  schema,
  onBack,
  editMode = false,
  existingId,
  taxonomyContext,
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
  const [imageToCrop, setImageToCrop] = useState<{ dataUrl: string; index: number } | null>(null) // For image cropping
  
  // Color input state
  const [colorInput, setColorInput] = useState('')
  
  // Product details state
  const [productDetails, setProductDetails] = useState({
    brand: data?.attributes?.brand || '',
    country_of_origin: data?.attributes?.country_of_origin || '',
    year: data?.attributes?.year || '',
    material: data?.attributes?.material || '',
    purpose: data?.attributes?.purpose || ''
  })
  
  // AI tag generation state
  const [isGeneratingTags, setIsGeneratingTags] = useState(false)
  const [generatedTags, setGeneratedTags] = useState<string[]>([])

  // Location state
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Collapse/expand state for sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    title: true,
    description: true,
    price: true,
    priceType: false,
    condition: false,
    location: false,
    stock: false
  })
  
  // Section refs for auto-scroll
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  
  // Calculate discount percentage automatically
  const discountPercent = formData.attributes.discount_original_price && formData.core.price
    ? Math.round((1 - formData.core.price / formData.attributes.discount_original_price) * 100)
    : 0
  
  // Calculate savings amount
  const savingsAmount = formData.attributes.discount_original_price && formData.core.price
    ? formData.attributes.discount_original_price - formData.core.price
    : 0
  
  // Format number with thousand separators
  const formatPrice = (value: number | undefined | null): string => {
    if (!value && value !== 0) return ''
    return value.toLocaleString('uz-UZ')
  }
  
  // Parse price input (remove spaces)
  const parsePriceInput = (value: string): number | undefined => {
    const cleaned = value.replace(/\s/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? undefined : parsed
  }
  
  // Toggle section
  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }
  
  // Auto-advance to next section
  const scrollToSection = (sectionKey: string) => {
    const section = sectionRefs.current[sectionKey]
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Expand if collapsed
      if (!expandedSections[sectionKey]) {
        setTimeout(() => {
          setExpandedSections(prev => ({ ...prev, [sectionKey]: true }))
        }, 300)
      }
    }
  }
  
  // Calculate total stock
  const totalStock = formData.attributes.stock_by_size_color
    ? Object.values(formData.attributes.stock_by_size_color).reduce((sum: number, qty: any) => sum + (Number(qty) || 0), 0)
    : 0
  
  // Get top stock variants (for summary)
  const topStockVariants = formData.attributes.stock_by_size_color
    ? Object.entries(formData.attributes.stock_by_size_color)
        .filter(([_, qty]) => Number(qty) > 0)
        .sort(([_, a], [__, b]) => Number(b) - Number(a))
        .slice(0, 3)
        .map(([key, qty]) => {
          const [size, color] = key.split('_')
          return { size, color, qty: Number(qty) }
        })
    : []
  
  // Get sizes and colors for stock section (must be defined before sections.filter)
  const sizes = formData.attributes.sizes || []
  const colors = formData.attributes.colors || []
  
  // Section definitions for progress
  const sections = [
    { key: 'title', label: 'Maxsulot taxonomiyasi', icon: '📝' },
    { key: 'description', label: 'Tavsif', icon: '📄' },
    { key: 'price', label: 'Narx', icon: '💰' },
    { key: 'priceType', label: 'Narx uslubi', icon: '💳' },
    { key: 'condition', label: 'Holati', icon: '✨' },
    { key: 'location', label: 'Joylashuv', icon: '📍' },
    ...(schema.category === 'clothing' ? [{ key: 'stock', label: 'Mavjud Miqdor', icon: '📦' }] : [])
  ]
  
  // Calculate progress
  const completedSections = sections.filter(section => {
    if (section.key === 'title') return !!formData.core.title
    if (section.key === 'description') return !!formData.core.description
    if (section.key === 'price') return !!formData.core.price || formData.core.is_free
    if (section.key === 'priceType') return true // Always available
    if (section.key === 'condition') return !!formData.core.condition
    if (section.key === 'location') return !!location || !!formData.core.neighborhood
    if (section.key === 'stock') return sizes.length > 0 && colors.length > 0
    return false
  }).length
  
  const progressPercent = (completedSections / sections.length) * 100
  const currentSectionIndex = sections.findIndex(s => !expandedSections[s.key] || (s.key === 'title' && !formData.core.title)) || 0

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
          <div className="relative">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => updateValue(e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.validation?.maxLength}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                hasError ? 'border-red-300' : 'border-gray-300'
              }`}
              required={isRequired}
            />
            {schema.category === 'clothing' && taxonomyContext && (
              <InlineAIAssistant
                fieldKey={field.key}
                fieldLabel={field.label}
                currentValue={value}
                schema={schema}
                taxonomyContext={taxonomyContext}
                onSuggestion={(suggestion) => {
                  if (typeof suggestion === 'string') {
                    updateValue(suggestion)
                  }
                }}
              />
            )}
          </div>
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
            {field.enumOptions.map(option => {
              // Map enum values to Uzbek labels
              const labelMap: Record<string, Record<string, string>> = {
                condition: {
                  'yangi': 'Yangi',
                  'yangi_kabi': 'Yangi kabi',
                  'yaxshi': 'Yaxshi',
                  'o\'rtacha': 'O\'rtacha',
                  'eski': 'Eski',
                  'new': 'Yangi',
                  'like_new': 'Yangi kabi',
                  'good': 'Yaxshi',
                  'fair': 'O\'rtacha',
                  'poor': 'Eski'
                },
                season: {
                  'bahor': 'Bahor',
                  'yoz': 'Yoz',
                  'kuz': 'Kuz',
                  'qish': 'Qish',
                  'yil_davomida': 'Yil davomida',
                  'spring': 'Bahor',
                  'summer': 'Yoz',
                  'autumn': 'Kuz',
                  'winter': 'Qish',
                  'all_season': 'Yil davomida'
                }
              }
              const label = labelMap[field.key]?.[option] || option
              return <option key={option} value={option}>{label}</option>
            })}
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
          finalAttributes.clothing_type = data.context.taxonomy.labelUz
          
          // Auto-fill gender from taxonomy
          const taxonomyGender = data.context.taxonomy.audience
          const genderMap: Record<string, string> = {
            'erkaklar': 'men',
            'ayollar': 'women',
            'bolalar': 'kids',
            'unisex': 'unisex'
          }
          if (taxonomyGender) {
            const mappedGender = genderMap[taxonomyGender.toLowerCase()]
            if (mappedGender) {
              finalAttributes.gender = mappedGender
            }
          }
          
          // Rebuild tags with entity IDs from processed attributes
          const { buildTagsFromSelection } = await import('../taxonomy/clothing.utils')
          const enrichedTags = buildTagsFromSelection(
            data.context.taxonomyNode || {} as any,
            finalAttributes // Includes brand_id, country_id, etc.
          )
          finalAttributes.tags = enrichedTags
        }
        
        // Add discount percentage if discount available
        if (finalAttributes.discount_available && finalAttributes.discount_original_price && formData.core.price) {
          finalAttributes.discount_percent = Math.round((1 - formData.core.price / finalAttributes.discount_original_price) * 100)
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
          neighborhood: location?.address || formData.core.neighborhood,
          latitude: location?.latitude || formData.core.latitude,
          longitude: location?.longitude || formData.core.longitude,
          // old_price and stock_qty moved to attributes
          old_price: formData.attributes.discount_original_price || formData.core.old_price,
          stock_qty: formData.attributes.stock_by_size_color ? Object.values(formData.attributes.stock_by_size_color).reduce((sum: number, qty: any) => sum + (Number(qty) || 0), 0) : formData.core.stock_qty,
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

  // Separate fields for Apple-style redesign
  // Remove duplicate fields: old_price, stock_qty (moved to discount/stock sections), sizes, colors (moved to stock section)
  const excludedFields = ['old_price', 'stock_qty', 'sizes', 'colors', 'discount_percent', 'gender']
  const attributeFields = schema.fields.filter(f => !excludedFields.includes(f.key))
  
  // Get taxonomy for gender auto-fill
  const taxonomyGender = data.context?.taxonomy?.audience
  const genderMap: Record<string, string> = {
    'erkaklar': 'men',
    'ayollar': 'women',
    'bolalar': 'kids',
    'unisex': 'unisex'
  }
  const autoGender = taxonomyGender ? genderMap[taxonomyGender.toLowerCase()] : null
  
  // Auto-fill gender from taxonomy if available
  useEffect(() => {
    if (autoGender && !formData.attributes.gender) {
      setFormData(prev => ({
        ...prev,
        attributes: { ...prev.attributes, gender: autoGender }
      }))
    }
  }, [autoGender])
  
  // Separate core fields from attribute fields
  const coreFieldKeys = ['title', 'description', 'price', 'is_free', 'condition', 'neighborhood', 'latitude', 'longitude']
  const coreFields = schema.fields.filter(f => coreFieldKeys.includes(f.key))
  
  // Ensure title and description fields are always present and editable
  const titleField: FieldSchema = {
    key: 'title',
    type: 'string',
    required: true,
    label: 'Sarlavha',
    placeholder: 'Mahsulot nomi',
    validation: {
      minLength: 3,
      maxLength: 80
    },
    aiQuestion: 'Mahsulot nomi nima?',
    aiExtraction: 'Extract product title from user description'
  }
  
  const descriptionField: FieldSchema = {
    key: 'description',
    type: 'string',
    required: true,
    label: 'Tavsif',
    placeholder: 'Batafsil ma\'lumot',
    validation: {
      minLength: 10,
      maxLength: 500
    },
    aiQuestion: 'Mahsulot haqida batafsil ma\'lumot bering',
    aiExtraction: 'Create detailed description with emojis'
  }
  
  // Add title and description to coreFields if not already present
  const hasTitleField = coreFields.some(f => f.key === 'title')
  const hasDescriptionField = coreFields.some(f => f.key === 'description')
  const finalCoreFields = [
    ...(hasTitleField ? [] : [titleField]),
    ...(hasDescriptionField ? [] : [descriptionField]),
    ...coreFields
  ]

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
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
            {editMode ? 'Tahrirlash' : 'E\'lon yaratish'}
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Sticky Progress Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              {sections[currentSectionIndex]?.icon} {sections[currentSectionIndex]?.label}
            </span>
            <span className="text-xs text-gray-500">
              {completedSections}/{sections.length} to'ldirildi
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

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
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = (e) => {
                          const result = e.target?.result as string
                          // Open crop modal for each image (1:1 aspect ratio for product photos)
                          setImageToCrop({ dataUrl: result, index: photos.length })
                        }
                        reader.readAsDataURL(file)
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
              {/* Image Cropper Modal */}
              {imageToCrop && (
                <BannerCropper
                  imageSrc={imageToCrop.dataUrl}
                  aspectRatio={1} // 1:1 for product photos
                  onCrop={(croppedImageDataUrl) => {
                    setPhotos(prev => [...prev, croppedImageDataUrl])
                    setImageToCrop(null)
                  }}
                  onCancel={() => setImageToCrop(null)}
                />
              )}
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

          {/* Apple-Style Sections - Mantikiy Ketma-Ketlik */}
          
          {/* 1. Sarlavha (Title) */}
          <div 
            ref={(el) => { sectionRefs.current['title'] = el }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleSection('title')}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>📝</span> Maxsulot taxonomiyasi
                {!expandedSections.title && formData.core.title && (
                  <span className="text-sm font-normal text-gray-500">
                    ({formData.core.title.substring(0, 30)}...)
                  </span>
                )}
              </h2>
              {expandedSections.title ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.title && (
            <div className="p-5">
              <input
                type="text"
                value={formData.core.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, core: { ...prev.core, title: e.target.value } }))}
                placeholder="Masalan: Krossovka (Nike)"
                maxLength={80}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-2">Maxsulot taxonomiyasi (masalan: Krossovka, Futbolka)</p>
            </div>
            )}
          </div>

          {/* 2. Tavsif (Description) */}
          <div 
            ref={(el) => { sectionRefs.current['description'] = el }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleSection('description')}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>📄</span> Tavsif
                {!expandedSections.description && formData.core.description && (
                  <span className="text-sm font-normal text-gray-500">
                    ({formData.core.description.substring(0, 30)}...)
                  </span>
                )}
              </h2>
              {expandedSections.description ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.description && (
            <div className="p-5 space-y-4">
              {/* Maxsulot brend nomi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maxsulot brend nomi *</label>
                <input
                  type="text"
                  value={productDetails.brand}
                  onChange={(e) => {
                    setProductDetails(prev => ({ ...prev, brand: e.target.value }))
                    setFormData(prev => ({
                      ...prev,
                      attributes: { ...prev.attributes, brand: e.target.value }
                    }))
                  }}
                  placeholder="Masalan: Nike, Adidas, Samsung"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              
              {/* Ishlab chiqarilgan mamlakat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ishlab chiqarilgan mamlakat *</label>
                <input
                  type="text"
                  value={productDetails.country_of_origin}
                  onChange={(e) => {
                    setProductDetails(prev => ({ ...prev, country_of_origin: e.target.value }))
                    setFormData(prev => ({
                      ...prev,
                      attributes: { ...prev.attributes, country_of_origin: e.target.value }
                    }))
                  }}
                  placeholder="Masalan: O'zbekiston, Xitoy, Turkiya"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              
              {/* Ishlab chiqarilgan yili */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ishlab chiqarilgan yili</label>
                <input
                  type="text"
                  value={productDetails.year}
                  onChange={(e) => {
                    setProductDetails(prev => ({ ...prev, year: e.target.value }))
                    setFormData(prev => ({
                      ...prev,
                      attributes: { ...prev.attributes, year: e.target.value }
                    }))
                  }}
                  placeholder="Masalan: 2023, 2024"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              {/* Nimadan ishlab chiqarilgani */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nimadan ishlab chiqarilgani (material) *</label>
                <input
                  type="text"
                  value={productDetails.material}
                  onChange={(e) => {
                    setProductDetails(prev => ({ ...prev, material: e.target.value }))
                    setFormData(prev => ({
                      ...prev,
                      attributes: { ...prev.attributes, material: e.target.value }
                    }))
                  }}
                  placeholder="Masalan: Charm, Poliester, Paxta, Plastik"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              
              {/* Nima uchun mo'ljallangan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nima uchun mo'ljallangan (maqsad) *</label>
                <textarea
                  value={productDetails.purpose}
                  onChange={(e) => {
                    setProductDetails(prev => ({ ...prev, purpose: e.target.value }))
                    setFormData(prev => ({
                      ...prev,
                      attributes: { ...prev.attributes, purpose: e.target.value }
                    }))
                  }}
                  placeholder="Masalan: Sport uchun, Kundalik ishlatish, Ishlash uchun"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  required
                />
              </div>
              
              {/* AI Tag Generatsiya */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">AI Tag Generatsiya</label>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsGeneratingTags(true)
                      try {
                        const response = await fetch('/api/generate-tags', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            brand: productDetails.brand,
                            country_of_origin: productDetails.country_of_origin,
                            year: productDetails.year,
                            material: productDetails.material,
                            purpose: productDetails.purpose,
                            taxonomy: taxonomyContext?.leafUz || ''
                          })
                        })
                        
                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({}))
                          throw new Error(errorData.error || 'Tag generatsiya qilishda xatolik')
                        }
                        
                        const data = await response.json()
                        if (data.tags && Array.isArray(data.tags)) {
                          setGeneratedTags(data.tags)
                          setFormData(prev => ({
                            ...prev,
                            attributes: {
                              ...prev.attributes,
                              tags: data.tags
                            }
                          }))
                        }
                      } catch (error: any) {
                        console.error('Tag generation error:', error)
                        alert(error.message || 'Tag generatsiya qilishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
                      } finally {
                        setIsGeneratingTags(false)
                      }
                    }}
                    disabled={isGeneratingTags || !productDetails.brand?.trim() || !productDetails.country_of_origin?.trim() || !productDetails.material?.trim() || !productDetails.purpose?.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingTags ? 'Generatsiya...' : 'Tag generatsiya qilish'}
                  </button>
                </div>
                
                {generatedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {generatedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

          {/* 3. Narx (Price) - Apple Style Section */}
          <div 
            ref={(el) => { sectionRefs.current['price'] = el }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleSection('price')}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>💰</span> Narx
                {!expandedSections.price && formData.core.price && (
                  <span className="text-sm font-normal text-gray-500">
                    ({formatPrice(formData.core.price)} so'm)
                  </span>
                )}
              </h2>
              {expandedSections.price ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.price && (
            <div className="p-5 space-y-4">
              {/* Asl narx */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asl narx *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.core.price ? formatPrice(formData.core.price) : ''}
                    onChange={(e) => {
                      const parsed = parsePriceInput(e.target.value)
                      setFormData(prev => ({ ...prev, core: { ...prev.core, price: parsed } }))
                    }}
                    onBlur={(e) => {
                      const parsed = parsePriceInput(e.target.value)
                      if (parsed !== undefined) {
                        e.currentTarget.value = formatPrice(parsed)
                      }
                    }}
                    placeholder="Masalan: 500 000"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                    required={!formData.core.is_free}
                  />
                  <span className="text-gray-600 font-medium">so'm</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Narxni kiriting (masalan: 500 000 so'm)</p>
              </div>

              {/* Aksiya mavjudmi? */}
              <div className="pt-4 border-t border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.attributes.discount_available || false}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        attributes: {
                          ...prev.attributes,
                          discount_available: e.target.checked,
                          discount_reason: e.target.checked ? prev.attributes.discount_reason || '' : '',
                          discount_conditions: e.target.checked ? prev.attributes.discount_conditions || '' : ''
                        }
                      }))
                    }}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-base font-medium text-gray-900">⚡ Aksiya mavjudmi?</span>
                </label>
              </div>

              {/* Aksiya detallari */}
              {formData.attributes.discount_available && (
                <div className="pl-8 space-y-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                  {/* Asl narx (aksiya) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Asl narx (aksiya) *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.attributes.discount_original_price ? formatPrice(formData.attributes.discount_original_price) : ''}
                        onChange={(e) => {
                          const parsed = parsePriceInput(e.target.value)
                          setFormData(prev => ({
                            ...prev,
                            attributes: { ...prev.attributes, discount_original_price: parsed }
                          }))
                        }}
                        onBlur={(e) => {
                          const parsed = parsePriceInput(e.target.value)
                          if (parsed !== undefined) {
                            e.currentTarget.value = formatPrice(parsed)
                          }
                        }}
                        placeholder="Masalan: 600 000"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                      <span className="text-gray-600 font-medium">so'm</span>
                    </div>
                  </div>

                  {/* Aksiya narxi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aksiya narxi</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.core.price || ''}
                        readOnly
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-base bg-gray-50"
                      />
                      <span className="text-gray-600 font-medium">so'm</span>
                    </div>
                    {discountPercent > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-1">Chegirma: {discountPercent}%</p>
                    )}
                  </div>

                  {/* Aksiya muddati */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aksiya muddati (kun)</label>
                    <input
                      type="number"
                      value={formData.attributes.discount_days || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        attributes: { ...prev.attributes, discount_days: e.target.value ? parseInt(e.target.value) : undefined }
                      }))}
                      placeholder="Masalan: 7"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* Discount Guardrails */}
                  {formData.attributes.discount_original_price && formData.core.price && (
                    <div className="space-y-2">
                      {discountPercent < 0 && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Xatolik</p>
                            <p className="text-xs text-red-700 mt-1">
                              Aksiya narxi asl narxdan yuqori bo'lishi mumkin emas. Iltimos, to'g'rilang.
                            </p>
                          </div>
                        </div>
                      )}
                      {discountPercent >= 80 && discountPercent < 100 && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">Ogohlantirish</p>
                            <p className="text-xs text-amber-700 mt-1">
                              80%+ chegirma shubhali ko'rinadi va xaridorlar ishonmaydi. Iltimos, to'g'ri ekanligini tekshiring.
                            </p>
                          </div>
                        </div>
                      )}
                      {discountPercent >= 100 && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Xatolik</p>
                            <p className="text-xs text-red-700 mt-1">
                              Chegirma 100% yoki undan yuqori bo'lishi mumkin emas.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aksiya sababi (majburiy) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aksiya sababi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.attributes.discount_reason || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        attributes: { ...prev.attributes, discount_reason: e.target.value }
                      }))}
                      placeholder="Masalan: Mavsumiy aksiya, Yangi kolleksiya"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Aksiyaga sabab yozsangiz, ishonch oshadi</p>
                  </div>

                  {/* Aksiya shartlari (ixtiyoriy) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aksiya shartlari (ixtiyoriy)</label>
                    <input
                      type="text"
                      value={formData.attributes.discount_conditions || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        attributes: { ...prev.attributes, discount_conditions: e.target.value }
                      }))}
                      placeholder="Masalan: Faqat naqd pul, Minimal buyurtma 200,000 so'm"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
            )}
          </div>

          {/* 4. Narx uslubini belgilash */}
          <div 
            ref={(el) => { sectionRefs.current['priceType'] = el }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleSection('priceType')}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>💳</span> Narx uslubini belgilash
              </h2>
              {expandedSections.priceType ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.priceType && (
            <div className="p-5 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.attributes.price_negotiable || false}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    attributes: { 
                      ...prev.attributes, 
                      price_negotiable: e.target.checked,
                      price_fixed: e.target.checked ? false : prev.attributes.price_fixed
                    }
                  }))}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-base font-medium text-gray-900">Narxni savdolashish mumkin</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.attributes.price_fixed || false}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    attributes: { 
                      ...prev.attributes, 
                      price_fixed: e.target.checked,
                      price_negotiable: e.target.checked ? false : prev.attributes.price_negotiable
                    }
                  }))}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-base font-medium text-gray-900">O'zgarmas narx</span>
              </label>
            </div>
            )}
          </div>

          {/* 5. Holati (Condition) - O'zbekcha */}
          <div 
            ref={(el) => { sectionRefs.current['condition'] = el }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleSection('condition')}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>✨</span> Holati
                {!expandedSections.condition && formData.core.condition && (
                  <span className="text-sm font-normal text-gray-500">
                    ({formData.core.condition === 'yangi' ? 'Yangi' : formData.core.condition === 'yangi_kabi' ? 'Yangi kabi' : formData.core.condition === 'yaxshi' ? 'Yaxshi' : formData.core.condition === 'o\'rtacha' ? 'O\'rtacha' : 'Eski'})
                  </span>
                )}
              </h2>
              {expandedSections.condition ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.condition && (
            <div className="p-5">
              <select
                value={formData.core.condition || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, core: { ...prev.core, condition: e.target.value } }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Tanlang...</option>
                <option value="yangi">Yangi</option>
                <option value="yangi_kabi">Yangi kabi</option>
                <option value="yaxshi">Yaxshi</option>
                <option value="o'rtacha">O'rtacha</option>
                <option value="eski">Eski</option>
              </select>
            </div>
            )}
          </div>

          {/* 6. Joylashuv (Location) - Google Maps */}
          <div 
            ref={(el) => { sectionRefs.current['location'] = el }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleSection('location')}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>📍</span> Joylashuv
                {!expandedSections.location && (location?.address || formData.core.neighborhood) && (
                  <span className="text-sm font-normal text-gray-500 line-clamp-1">
                    ({location?.address || formData.core.neighborhood})
                  </span>
                )}
              </h2>
              {expandedSections.location ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.location && (
            <div className="p-5">
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <LocationDisplay
                  onLocationChange={(loc) => {
                    setLocation(loc)
                    setFormData(prev => ({
                      ...prev,
                      core: {
                        ...prev.core,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        neighborhood: loc.address
                      }
                    }))
                  }}
                  initialAddress={formData.core.neighborhood}
                  className="text-gray-900"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Avtomatik aniqlanadi, qo'lda o'zgartirish mumkin</p>
            </div>
            )}
          </div>

          {/* 7. Mavjud Miqdor (Stock) - O'lcham/Rang Integratsiya */}
          {schema.category === 'clothing' && (
            <div 
              ref={(el) => { sectionRefs.current['stock'] = el }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleSection('stock')}
                className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>📦</span> Mavjud Miqdor
                  {!expandedSections.stock && totalStock > 0 && (
                    <span className="text-sm font-normal text-gray-500">
                      ({totalStock} dona)
                    </span>
                  )}
                </h2>
                {expandedSections.stock ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {expandedSections.stock && (
              <div className="p-5 space-y-4">
                {/* Ranglar - Avval ranglar tanlanadi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ranglar * (yozish orqali)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault()
                          const color = colorInput.trim()
                          if (color && !colors.includes(color)) {
                            setFormData(prev => ({
                              ...prev,
                              attributes: { 
                                ...prev.attributes, 
                                colors: [...(prev.attributes.colors || []), color]
                              }
                            }))
                            setColorInput('')
                          }
                        }
                      }}
                      placeholder="Rang nomini yozing va Enter bosing"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const color = colorInput.trim()
                        if (color && !colors.includes(color)) {
                          setFormData(prev => ({
                            ...prev,
                            attributes: { 
                              ...prev.attributes, 
                              colors: [...(prev.attributes.colors || []), color]
                            }
                          }))
                          setColorInput('')
                        }
                      }}
                      className="px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                    >
                      Qo'shish
                    </button>
                  </div>
                  
                  {/* Qo'shilgan ranglar (chip ko'rinishida) */}
                  {colors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {colors.map((color, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                        >
                          <span>{color}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                attributes: {
                                  ...prev.attributes,
                                  colors: prev.attributes.colors?.filter((_, i) => i !== index) || []
                                }
                              }))
                            }}
                            className="text-primary hover:text-primary-dark font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">Rang nomini yozing va Enter yoki "Qo'shish" tugmasini bosing</p>
                </div>

                {/* Har bir rang uchun o'lcham va miqdor */}
                {colors.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Har bir rang uchun o'lcham va miqdor *</label>
                    {colors.map((color, colorIndex) => {
                      // Bu rang uchun tanlangan o'lchamlar va miqdorlar
                      const colorSizes = sizes.filter(size => {
                        // Check if this size-color combination has stock
                        const stockData = formData.attributes.stock_by_size_color || {}
                        return Object.keys(stockData).some(key => {
                          const [sizeKey, colorKey] = key.split('_')
                          return sizeKey === size && colorKey === color && stockData[key] > 0
                        }) || false
                      })
                      
                      return (
                        <div key={colorIndex} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: color === 'oq' ? '#fff' : color === 'qora' ? '#000' : color === 'qizil' ? '#ef4444' : color === 'ko\'k' ? '#3b82f6' : color === 'yashil' ? '#22c55e' : '#9ca3af', border: '1px solid #e5e7eb' }}></span>
                              {color}
                            </h4>
                          </div>
                          
                          {/* O'lchamlar tanlash */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-2">O'lchamlar</label>
                            <div className="flex flex-wrap gap-2">
                              {/* Harflar */}
                              {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => {
                                const key = `${size}_${color}`
                                const stockData = formData.attributes.stock_by_size_color || {}
                                const hasStock = (stockData[key] || 0) > 0
                                return (
                                  <button
                                    key={size}
                                    type="button"
                                    onClick={() => {
                                      const stockKey = 'stock_by_size_color'
                                      const currentStock = formData.attributes[stockKey] || {}
                                      if (hasStock) {
                                        // Remove size for this color
                                        const newStock = { ...currentStock }
                                        delete newStock[key]
                                        setFormData(prev => ({
                                          ...prev,
                                          attributes: {
                                            ...prev.attributes,
                                            [stockKey]: newStock
                                          }
                                        }))
                                      } else {
                                        // Add size for this color with default qty 0
                                        setFormData(prev => ({
                                          ...prev,
                                          attributes: {
                                            ...prev.attributes,
                                            [stockKey]: {
                                              ...currentStock,
                                              [key]: 0
                                            }
                                          }
                                        }))
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                      hasStock
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
                                    }`}
                                  >
                                    {size}
                                  </button>
                                )
                              })}
                              {/* Raqamlar */}
                              {Array.from({ length: 20 }, (_, i) => i + 35).map(size => {
                                const sizeStr = size.toString()
                                const key = `${sizeStr}_${color}`
                                const stockData = formData.attributes.stock_by_size_color || {}
                                const hasStock = (stockData[key] || 0) > 0
                                return (
                                  <button
                                    key={sizeStr}
                                    type="button"
                                    onClick={() => {
                                      const stockKey = 'stock_by_size_color'
                                      const currentStock = formData.attributes[stockKey] || {}
                                      if (hasStock) {
                                        // Remove size for this color
                                        const newStock = { ...currentStock }
                                        delete newStock[key]
                                        setFormData(prev => ({
                                          ...prev,
                                          attributes: {
                                            ...prev.attributes,
                                            [stockKey]: newStock
                                          }
                                        }))
                                      } else {
                                        // Add size for this color with default qty 0
                                        setFormData(prev => ({
                                          ...prev,
                                          attributes: {
                                            ...prev.attributes,
                                            [stockKey]: {
                                              ...currentStock,
                                              [key]: 0
                                            }
                                          }
                                        }))
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                      hasStock
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
                                    }`}
                                  >
                                    {sizeStr}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                          
                          {/* Tanlangan o'lchamlar uchun miqdor */}
                          {Object.keys(formData.attributes.stock_by_size_color || {})
                            .filter(key => key.endsWith(`_${color}`))
                            .length > 0 && (
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-gray-600 mb-2">Miqdor</label>
                              {Object.entries(formData.attributes.stock_by_size_color || {})
                                .filter(([key]) => key.endsWith(`_${color}`))
                                .map(([key, qty]) => {
                                  const size = key.split('_')[0]
                                  return (
                                    <div key={key} className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600 min-w-[40px]">{size}:</span>
                                      <input
                                        type="number"
                                        value={qty || ''}
                                        onChange={(e) => {
                                          const stockKey = 'stock_by_size_color'
                                          const currentStock = formData.attributes[stockKey] || {}
                                          setFormData(prev => ({
                                            ...prev,
                                            attributes: {
                                              ...prev.attributes,
                                              [stockKey]: {
                                                ...currentStock,
                                                [key]: e.target.value ? parseInt(e.target.value) : 0
                                              }
                                            }
                                          }))
                                        }}
                                        placeholder="0"
                                        min="0"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                      />
                                      <span className="text-xs text-gray-500">dona</span>
                                    </div>
                                  )
                                })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Bulk Fill Controls */}
                {sizes.length > 0 && colors.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Tez to'ldirish
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Hammasiga bir xil miqdor"
                          min="0"
                          className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const value = parseInt(e.currentTarget.value)
                              if (!isNaN(value) && value >= 0) {
                                const newStock: Record<string, number> = {}
                                sizes.forEach(size => {
                                  colors.forEach(color => {
                                    newStock[`${size}_${color}`] = value
                                  })
                                })
                                setFormData(prev => ({
                                  ...prev,
                                  attributes: {
                                    ...prev.attributes,
                                    stock_by_size_color: {
                                      ...prev.attributes.stock_by_size_color,
                                      ...newStock
                                    }
                                  }
                                }))
                                e.currentTarget.value = ''
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement
                            if (input) {
                              const value = parseInt(input.value)
                              if (!isNaN(value) && value >= 0) {
                                const newStock: Record<string, number> = {}
                                sizes.forEach(size => {
                                  colors.forEach(color => {
                                    newStock[`${size}_${color}`] = value
                                  })
                                })
                                setFormData(prev => ({
                                  ...prev,
                                  attributes: {
                                    ...prev.attributes,
                                    stock_by_size_color: {
                                      ...prev.attributes.stock_by_size_color,
                                      ...newStock
                                    }
                                  }
                                }))
                                input.value = ''
                              }
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Qo'llash
                        </button>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        Barcha o'lcham va rang kombinatsiyalariga bir xil miqdorni qo'llash
                      </p>
                    </div>
                  </div>
                )}

                {/* O'lcham/Rang bo'yicha miqdor */}
                {sizes.length > 0 && colors.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-3">O'lcham va Rang bo'yicha miqdor</label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {sizes.map(size => 
                        colors.map(color => {
                          const key = `${size}_${color}`
                          const stockKey = `stock_by_size_color`
                          const stockData = formData.attributes[stockKey] || {}
                          return (
                            <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                              <span className="text-sm font-medium text-gray-700 min-w-[80px]">{size} / {color}</span>
                              <input
                                type="number"
                                value={stockData[key] || ''}
                                onChange={(e) => {
                                  const newStock = {
                                    ...stockData,
                                    [key]: e.target.value ? parseInt(e.target.value) : undefined
                                  }
                                  setFormData(prev => ({
                                    ...prev,
                                    attributes: { ...prev.attributes, [stockKey]: newStock }
                                  }))
                                }}
                                placeholder="0"
                                min="0"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                              <span className="text-xs text-gray-500">dona</span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          )}


          {/* Auto-fill gender from taxonomy */}
          {autoGender && (
            <input
              type="hidden"
              value={autoGender}
              onChange={() => {}}
            />
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
