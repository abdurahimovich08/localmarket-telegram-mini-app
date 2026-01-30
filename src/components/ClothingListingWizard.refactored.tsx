/**
 * ClothingListingWizard - Refactored with Step Components
 * 
 * Beautiful, fast, and intuitive clothing listing creation
 * Designed for mobile-first with "wow" factor
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { uploadImages } from '../lib/imageUpload'
import { compressDataUrls } from '../lib/imageCompression'
import { sanitizeText, simpleHash, aiCache } from '../lib/aiUtils'
import { useEntityMutations } from '../hooks/useEntityMutations'
import { getUser, createOrUpdateUser } from '../lib/supabase'
import { getTelegramUser } from '../lib/telegram'
import BannerCropper from './BannerCropper'
import BannerCreator from './BannerCreator'
import Icons8Icon from './Icons8Icon'
import { TagIcon } from '@heroicons/react/24/outline'
import { CLOTHING_TAXONOMY, TaxonNode, Audience, Segment } from '../taxonomy/clothing.uz'
import { buildTagsFromSelection } from '../taxonomy/clothing.utils'
import { clothingTaxonomyRegistry, getPopularItems, getSegmentsForAudience } from '../taxonomy/clothingRegistry'

// Step Components
import Step1Taxonomy from './wizard/steps/Step1Taxonomy'
import Step2Photos from './wizard/steps/Step2Photos'
import Step3Details from './wizard/steps/Step3Details'
import Step4Price from './wizard/steps/Step4Price'
import Step5Variants from './wizard/steps/Step5Variants'
import Step6Publish from './wizard/steps/Step6Publish'
import WizardHeader from './wizard/WizardHeader'
import WizardFooter from './wizard/WizardFooter'

// Types
interface WizardStep {
  id: number
  key: string
  title: string
  subtitle: string
  icon: React.ReactNode
}

interface ClothingListingWizardProps {
  onComplete?: (listingId: string) => void
  initialTaxonomy?: TaxonNode | null
}

// Step definitions with premium icons
const STEPS: WizardStep[] = [
  { 
    id: 1, 
    key: 'taxonomy', 
    title: 'Kategoriya', 
    subtitle: 'Mahsulot turini tanlang',
    icon: <Icons8Icon name="tagWindow" size={24} className="opacity-90" />
  },
  { 
    id: 2, 
    key: 'photos', 
    title: 'Rasmlar', 
    subtitle: 'Eng yaxshi rasmlarni yuklang',
    icon: <Icons8Icon name="camera" size={24} className="opacity-90" />
  },
  { 
    id: 3, 
    key: 'details', 
    title: 'Ma\'lumotlar', 
    subtitle: 'Mahsulot haqida',
    icon: <Icons8Icon name="sparkles" size={24} className="opacity-90" />
  },
  { 
    id: 4, 
    key: 'price', 
    title: 'Narx', 
    subtitle: 'Narxni belgilang',
    icon: <Icons8Icon name="priceTag" size={24} className="opacity-90" />
  },
  { 
    id: 5, 
    key: 'variants', 
    title: 'Variantlar', 
    subtitle: 'O\'lcham va ranglar',
    icon: <Icons8Icon name="swatch" size={24} className="opacity-90" />
  },
  { 
    id: 6, 
    key: 'publish', 
    title: 'Joylash', 
    subtitle: 'Tayyor!',
    icon: <Icons8Icon name="rocket" size={24} className="opacity-90" />
  }
]

export default function ClothingListingWizard({ 
  onComplete,
  initialTaxonomy 
}: ClothingListingWizardProps) {
  const navigate = useNavigate()
  const { user } = useUser()
  
  // Current step
  const [currentStep, setCurrentStep] = useState(1)
  
  // Taxonomy selection state
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<TaxonNode | null>(initialTaxonomy || null)
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  
  // Photos state
  const [photos, setPhotos] = useState<string[]>([])
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [showBannerCreator, setShowBannerCreator] = useState(false)
  const [imageForBanner, setImageForBanner] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState<{
    title: string
    description: string
    brand: string | null
    material: string | null
    condition: 'yangi' | 'yangi_kabi' | 'yaxshi' | 'o\'rtacha'
    price: string
    priceNegotiable: boolean
    hasDiscount: boolean
    originalPrice: string
    discountReason: string
    _aiMeta?: {
      generatedAt: string
      model: string
      imagesUsed: number
      hintUsed: boolean
      version: string
    }
  }>({
    title: '',
    description: '',
    brand: '',
    material: '',
    condition: 'yangi',
    price: '',
    priceNegotiable: false,
    hasDiscount: false,
    originalPrice: '',
    discountReason: '',
  })
  
  // Variants state
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [sizeType, setSizeType] = useState<'letter' | 'number'>('letter')
  const [stockByVariant, setStockByVariant] = useState<Record<string, number>>({})
  const [photosByColor, setPhotosByColor] = useState<Record<string, string[]>>({})
  
  // AI state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [skipAI, setSkipAI] = useState(false)
  const [userHint, setUserHint] = useState('')
  const aiRequestInFlightRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const aiCacheRef = useRef(aiCache)
  
  // UI state
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Entity mutations
  const { create: createListing, isLoading } = useEntityMutations('listing', {
    onSuccess: (listing) => {
      if (listing?.listing_id) {
        onComplete?.(listing.listing_id)
        navigate(`/listing/${listing.listing_id}`)
      }
    },
    onError: (err) => {
      setError(err.message)
      setIsSubmitting(false)
    }
  })
  
  // Computed values
  const availableSegments = useMemo(() => {
    if (!selectedAudience) return []
    return getSegmentsForAudience(clothingTaxonomyRegistry, selectedAudience)
  }, [selectedAudience])
  
  const availableItems = useMemo(() => {
    if (!selectedSegment) return []
    const query = itemSearchQuery.toLowerCase().trim()
    return CLOTHING_TAXONOMY.filter(item => 
      item.audience === selectedAudience &&
      item.segment === selectedSegment &&
      item.leaf &&
      (query === '' || 
       item.labelUz.toLowerCase().includes(query) ||
       item.synonymsUz?.some(s => s.toLowerCase().includes(query)) ||
       item.pathUz.toLowerCase().includes(query))
    )
  }, [selectedAudience, selectedSegment, itemSearchQuery])
  
  const popularItems = useMemo(() => {
    const items = getPopularItems(clothingTaxonomyRegistry)
    // Filter by audience/segment if selected
    if (selectedAudience) {
      return items.filter(item => item.audience === selectedAudience)
    }
    return items
  }, [selectedAudience])
  
  const progressPercent = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep])
  
  // Step validation
  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 1: return selectedTaxonomy !== null
      case 2: return photos.length >= 1
      case 3: return formData.title.trim().length >= 3 && formData.description.trim().length >= 10
      case 4: return !!formData.price && parsePrice(formData.price) > 0
      case 5: {
        if (selectedColors.length === 0 || selectedSizes.length === 0) return false
        // Check if all colors have at least 1 photo
        return selectedColors.every(color => (photosByColor[color] || []).length > 0)
      }
      case 6: return true
      default: return false
    }
  }, [selectedTaxonomy, photos, formData, selectedColors, selectedSizes, photosByColor])
  
  const canProceed = isStepValid(currentStep - 1)
  
  // Recent selections from localStorage
  const [recentSelections, setRecentSelections] = useState<TaxonNode[]>([])
  
  useEffect(() => {
    const stored = localStorage.getItem('clothing_wizard_recent_selections')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setRecentSelections(parsed.slice(0, 5))
      } catch (e) {
        console.warn('Failed to parse recent selections:', e)
      }
    }
  }, [])
  
  const saveToRecent = useCallback((item: TaxonNode) => {
    const updated = [item, ...recentSelections.filter(i => i.id !== item.id)].slice(0, 5)
    setRecentSelections(updated)
    localStorage.setItem('clothing_wizard_recent_selections', JSON.stringify(updated))
  }, [recentSelections])
  
  // Size type based on segment
  useEffect(() => {
    if (selectedTaxonomy?.segment === 'oyoq_kiyim') {
      setSizeType('number')
    } else {
      setSizeType('letter')
    }
  }, [selectedTaxonomy])
  
  // Photo handlers
  const handlePhotoUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files) return
      
      const newPhotos: string[] = []
      for (const file of Array.from(files)) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          newPhotos.push(result)
          if (newPhotos.length === files.length) {
            setPhotos(prev => [...prev, ...newPhotos].slice(0, 10))
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }, [])
  
  const removePhoto = useCallback((index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }, [])
  
  const handleCroppedImage = useCallback((croppedImage: string) => {
    if (imageToCrop) {
      const index = photos.indexOf(imageToCrop)
      if (index >= 0) {
        setPhotos(prev => {
          const updated = [...prev]
          updated[index] = croppedImage
          return updated
        })
      }
    }
    setImageToCrop(null)
  }, [imageToCrop, photos])
  
  // Format price
  const formatPrice = useCallback((value: string): string => {
    const num = value.replace(/\D/g, '')
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }, [])
  
  // Parse price
  const parsePrice = useCallback((value: string): number => {
    return parseInt(value.replace(/\s/g, '')) || 0
  }, [])
  
  // Check internet
  const checkInternet = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false
    try {
      await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD', 
        mode: 'no-cors',
        cache: 'no-cache'
      })
      return true
    } catch {
      return false
    }
  }, [])
  
  // Generate cache key
  const generateCacheKey = useCallback((images: string[], taxonomyId: string, hint: string): string => {
    const imageHash = images.slice(0, 3).map(img => img.substring(0, 100)).join('|')
    const keyString = `${taxonomyId}|${hint}|${imageHash.substring(0, 200)}`
    return simpleHash(keyString)
  }, [])
  
  // Optimize image for AI
  const optimizeImageForAI = useCallback(async (imageDataUrl: string): Promise<string> => {
    try {
      const compressedFiles = await compressDataUrls([imageDataUrl], {
        maxWidthOrHeight: 512,
        maxSizeMB: 0.2,
      }, 'listing')
      
      if (compressedFiles.length > 0) {
        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(compressedFiles[0])
        })
        return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
      }
      
      return imageDataUrl.includes(',') ? imageDataUrl.split(',')[1] : imageDataUrl
    } catch (error) {
      console.warn('Image optimization failed:', error)
      return imageDataUrl.includes(',') ? imageDataUrl.split(',')[1] : imageDataUrl
    }
  }, [])
  
  // Apply AI data
  const applyAIData = useCallback((aiData: any, overwrite: boolean) => {
    const validateCondition = (cond: string): 'yangi' | 'yangi_kabi' | 'yaxshi' | 'o\'rtacha' | null => {
      const valid = ['yangi', 'yangi_kabi', 'yaxshi', 'o\'rtacha']
      return valid.includes(cond) ? cond as any : null
    }
    
    const validatedCondition = validateCondition(aiData.condition)
    setFormData(prev => ({
      ...prev,
      title: overwrite || !prev.title.trim() ? (aiData.title || prev.title) : prev.title,
      description: overwrite || !prev.description.trim() ? (aiData.description || prev.description) : prev.description,
      brand: overwrite || !prev.brand.trim() ? (aiData.brand || prev.brand) : prev.brand,
      material: overwrite || !prev.material.trim() ? (aiData.material || prev.material) : prev.material,
      condition: overwrite || prev.condition === 'yangi' ? (validatedCondition || prev.condition) : prev.condition,
      _aiMeta: {
        generatedAt: new Date().toISOString(),
        model: 'gemini-2.0-flash-exp',
        imagesUsed: photos.slice(0, 3).length,
        hintUsed: !!userHint.trim(),
        version: '1.0',
      },
    }))
  }, [photos, userHint])
  
  // Generate AI content
  const generateAIContent = useCallback(async (overwrite: boolean = false) => {
    if (!selectedTaxonomy || photos.length === 0) {
      setAiError('Kategoriya va rasmlar kerak')
      return
    }
    
    if (aiRequestInFlightRef.current && !overwrite) {
      console.log('AI request already in flight, skipping auto-trigger.')
      return
    }
    
    if (!overwrite && aiGenerated && !aiError) {
      console.log('AI content already generated, skipping auto-trigger.')
      return
    }
    
    if (!overwrite && skipAI) {
      console.log('AI skipped by user, skipping auto-trigger.')
      return
    }
    
    const isOnline = await checkInternet()
    if (!isOnline) {
      setAiError('Internet aloqasi yo\'q. AI yordamida to\'ldirish uchun internet kerak.')
      return
    }
    
    setIsGeneratingAI(true)
    setAiError(null)
    aiRequestInFlightRef.current = true
    abortControllerRef.current = new AbortController()
    
    try {
      const sanitizedHint = sanitizeText(userHint.trim())
      const cacheKey = generateCacheKey(photos.slice(0, 3), selectedTaxonomy.id, sanitizedHint)
      const cachedResponse = aiCacheRef.current.get(cacheKey)
      
      if (cachedResponse && !overwrite) {
        console.log('Using cached AI response.')
        applyAIData(cachedResponse, overwrite)
        setAiGenerated(true)
        return
      }
      
      const imagesToSend = photos.slice(0, 3)
      const processedImages: string[] = []
      
      for (const imageDataUrl of imagesToSend) {
        const optimized = await optimizeImageForAI(imageDataUrl)
        processedImages.push(optimized)
      }
      
      const controller = abortControllerRef.current
      const timeoutId = setTimeout(() => {
        controller?.abort()
        setAiError('AI javob olishda vaqt tugadi. Iltimos, qayta urinib ko\'ring.')
      }, 15000)
      
      const response = await fetch('/api/gemini-image-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: {
            id: selectedTaxonomy.id,
            labelUz: selectedTaxonomy.labelUz,
            audience: selectedTaxonomy.audience,
            segment: selectedTaxonomy.segment,
          },
          images: processedImages,
          userHint: sanitizedHint || undefined,
          language: 'uz',
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 429) {
          setAiError('AI hozir band. Xohlasangiz qo\'lda davom eting yoki 1 daqiqadan so\'ng qayta urinib ko\'ring.')
        } else {
          throw new Error(errorData.message || errorData.error || 'AI javob olishda xatolik')
        }
      }
      
      const aiData = await response.json()
      applyAIData(aiData, overwrite)
      setAiGenerated(true)
      aiCacheRef.current.set(cacheKey, aiData)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('AI request aborted due to timeout.')
        setAiError('AI javob olishda vaqt tugadi. Iltimos, qayta urinib ko\'ring.')
      } else {
        console.error('AI generation error:', err)
        setAiError(err.message || 'AI yordamida to\'ldirishda xatolik yuz berdi')
      }
    } finally {
      aiRequestInFlightRef.current = false
      abortControllerRef.current = null
      setIsGeneratingAI(false)
    }
  }, [selectedTaxonomy, photos, userHint, optimizeImageForAI, checkInternet, aiGenerated, skipAI, generateCacheKey, applyAIData])
  
  // Navigation
  const goNext = async () => {
    if (!canProceed || currentStep >= STEPS.length) return
    
    // Auto-trigger AI generation when moving from step 2 to step 3
    if (currentStep === 2 && currentStep + 1 === 3) {
      await generateAIContent()
    }
    
    setCurrentStep(prev => prev + 1)
  }
  
  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    } else {
      navigate(-1)
    }
  }
  
  // Variant handlers
  const toggleColor = useCallback((color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    )
  }, [])
  
  const toggleSize = useCallback((size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    )
  }, [])
  
  const updateStock = useCallback((color: string, size: string, qty: number) => {
    const key = `${size}_${color}`
    setStockByVariant(prev => ({
      ...prev,
      [key]: qty
    }))
  }, [])
  
  // Submit handler
  const handleSubmit = async () => {
    if (!canProceed || isSubmitting || isLoading) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Ensure user exists
      let currentUser = user
      if (!currentUser) {
        const telegramUser = getTelegramUser()
        if (telegramUser) {
          currentUser = await getUser(telegramUser.id.toString())
          if (!currentUser) {
            currentUser = await createOrUpdateUser({
              telegram_user_id: telegramUser.id.toString(),
              first_name: telegramUser.first_name || 'User',
              username: telegramUser.username,
              profile_photo_url: telegramUser.photo_url,
            })
          }
        }
      }
      
      if (!currentUser) {
        throw new Error('Foydalanuvchi ma\'lumotlari topilmadi. Iltimos, qayta urinib ko\'ring.')
      }
      
      // Upload photos
      const photoUrls = await uploadImages(photos.map((p, i) => {
        const blob = dataURLtoBlob(p)
        return new File([blob], `photo-${i}.jpg`, { type: 'image/jpeg' })
      }))
      
      // Build attributes
      const conditionMap: Record<string, string> = {
        'yangi': 'new',
        'yangi_kabi': 'like_new',
        'yaxshi': 'good',
        'o\'rtacha': 'fair'
      }
      
      const attributes: any = {
        brand: formData.brand || null,
        material: formData.material || null,
        colors: selectedColors,
        sizes: selectedSizes,
        stock_by_size_color: stockByVariant,
        photos_by_color: uploadedPhotosByColor,
        price_negotiable: formData.priceNegotiable,
      }
      
      if (formData.hasDiscount && formData.originalPrice) {
        attributes.discount_available = true
        attributes.discount_original_price = parsePrice(formData.originalPrice)
        attributes.discount_reason = formData.discountReason
        attributes.discount_percent = Math.round(
          (1 - parsePrice(formData.price) / parsePrice(formData.originalPrice)) * 100
        )
      }
      
      if (formData._aiMeta) {
        attributes._aiMeta = formData._aiMeta
      }
      
      // Create listing
      await createListing({
        seller_telegram_id: currentUser.telegram_user_id,
        title: formData.title,
        description: formData.description,
        price: parsePrice(formData.price),
        is_free: false,
        category: 'clothing',
        condition: conditionMap[formData.condition] || 'good',
        photos: photoUrls,
        status: 'active',
        is_boosted: false,
        attributes,
        stock_qty: Object.values(stockByVariant).reduce((sum, qty) => sum + qty, 0),
        taxonomy_id: selectedTaxonomy?.id,
        tags: buildTagsFromSelection(selectedTaxonomy),
      })
    } catch (err: any) {
      console.error('Error creating listing:', err)
      setError(err.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
      setIsSubmitting(false)
    }
  }
  
  // Helper functions
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <WizardHeader
        currentStep={currentStep}
        steps={STEPS}
        selectedTaxonomy={selectedTaxonomy}
        progressPercent={progressPercent}
        onBack={goBack}
      />

      {/* Content */}
      <div className="px-4 pb-32">
        <div className="max-w-lg mx-auto">
          {/* Step 1: Taxonomy */}
          {currentStep === 1 && (
            <Step1Taxonomy
              selectedAudience={selectedAudience}
              setSelectedAudience={setSelectedAudience}
              selectedSegment={selectedSegment}
              setSelectedSegment={setSelectedSegment}
              selectedTaxonomy={selectedTaxonomy}
              setSelectedTaxonomy={setSelectedTaxonomy}
              itemSearchQuery={itemSearchQuery}
              setItemSearchQuery={setItemSearchQuery}
              recentSelections={recentSelections}
              saveToRecent={saveToRecent}
              availableSegments={availableSegments}
              availableItems={availableItems}
              popularItems={popularItems}
            />
          )}

          {/* Step 2: Photos */}
          {currentStep === 2 && (
            <Step2Photos
              photos={photos}
              onPhotosChange={setPhotos}
              onPhotoRemove={removePhoto}
              onPhotoUpload={handlePhotoUpload}
              onBannerCreate={(photo) => {
                setImageForBanner(photo)
                setShowBannerCreator(true)
              }}
              userHint={userHint}
              onUserHintChange={setUserHint}
              skipAI={skipAI}
              onSkipAIChange={setSkipAI}
            />
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <Step3Details
              formData={formData}
              onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
              selectedTaxonomy={selectedTaxonomy}
              isGeneratingAI={isGeneratingAI}
              aiError={aiError}
              aiGenerated={aiGenerated}
              onAIGenerate={() => generateAIContent(true)}
              onAIErrorDismiss={() => setAiError(null)}
            />
          )}

          {/* Step 4: Price */}
          {currentStep === 4 && (
            <Step4Price
              formData={formData}
              onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
              formatPrice={formatPrice}
            />
          )}

          {/* Step 5: Variants */}
          {currentStep === 5 && (
            <Step5Variants
              selectedColors={selectedColors}
              onColorsChange={setSelectedColors}
              selectedSizes={selectedSizes}
              onSizesChange={setSelectedSizes}
              sizeType={sizeType}
              onSizeTypeChange={setSizeType}
              stockByVariant={stockByVariant}
              onStockChange={updateStock}
              photosByColor={photosByColor}
              onPhotosByColorChange={(color, newPhotos) => {
                setPhotosByColor(prev => ({ ...prev, [color]: newPhotos }))
              }}
            />
          )}

          {/* Step 6: Publish */}
          {currentStep === 6 && (
            <>
              <Step6Publish
                formData={formData}
                photos={photos}
                selectedColors={selectedColors}
                selectedSizes={selectedSizes}
                parsePrice={parsePrice}
              />
              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <WizardFooter
        currentStep={currentStep}
        totalSteps={STEPS.length}
        canProceed={canProceed}
        isValid={isStepValid(currentStep - 1)}
        onBack={goBack}
        onNext={currentStep === 6 ? handleSubmit : goNext}
        isSubmitting={isSubmitting || isLoading}
        submitLabel="E'lonni joylash"
        nextLabel="Keyingi"
      />

      {/* Image cropper modal */}
      {imageToCrop && (
        <BannerCropper
          imageSrc={imageToCrop}
          aspectRatio={1}
          onCrop={handleCroppedImage}
          onCancel={() => setImageToCrop(null)}
        />
      )}
      
      {/* Banner Creator modal */}
      {showBannerCreator && imageForBanner && (
        <BannerCreator
          productImage={imageForBanner}
          productTitle={formData.title || selectedTaxonomy?.labelUz || 'Mahsulot'}
          productPrice={formData.price ? parseFloat(formData.price.replace(/\s/g, '')) : undefined}
          productBrand={formData.brand || undefined}
          onComplete={(bannerUrl) => {
            setPhotos(prev => [bannerUrl, ...prev])
            setShowBannerCreator(false)
            setImageForBanner(null)
          }}
          onCancel={() => {
            setShowBannerCreator(false)
            setImageForBanner(null)
          }}
        />
      )}
    </div>
  )
}
