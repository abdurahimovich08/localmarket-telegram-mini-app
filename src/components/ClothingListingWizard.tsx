/**
 * ClothingListingWizard - Modern Step-by-Step Listing Creator
 * 
 * Beautiful, fast, and intuitive clothing listing creation
 * Designed for mobile-first with "wow" factor
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { uploadImages } from '../lib/imageUpload'
import { compressDataUrls } from '../lib/imageCompression'
import { sanitizeText, containsPII, simpleHash } from '../lib/aiUtils'
import { useEntityMutations } from '../hooks/useEntityMutations'
import { getUser, createOrUpdateUser } from '../lib/supabase'
import { getTelegramUser } from '../lib/telegram'
import BannerCropper from './BannerCropper'
import BannerCreator from './BannerCreator'
import Icons8Icon from './Icons8Icon'
import { 
  ArrowLeftIcon, 
  ArrowRightIcon,
  CheckIcon,
  PhotoIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  SwatchIcon,
  RocketLaunchIcon,
  XMarkIcon,
  PlusIcon,
  TagIcon,
  ChevronRightIcon,
  PaintBrushIcon,
  ExclamationCircleIcon,
  CameraIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { CLOTHING_TAXONOMY, TaxonNode, Audience, Segment } from '../taxonomy/clothing.uz'
import { buildTagsFromSelection } from '../taxonomy/clothing.utils'
import { clothingTaxonomyRegistry, getPopularItems, getSegmentsForAudience } from '../taxonomy/clothingRegistry'

// Types
interface WizardStep {
  id: number
  key: string
  title: string
  subtitle: string
  icon: React.ReactNode
  emoji: string
}

interface TaxonomySelection {
  id: string
  pathUz: string
  audience: string
  segment: string
  labelUz: string
  audienceUz?: string
  segmentUz?: string
  leafUz?: string
}

interface ClothingListingWizardProps {
  onComplete?: (listingId: string) => void
  initialTaxonomy?: TaxonomySelection | null
}

// Step definitions with premium icons
const STEPS: WizardStep[] = [
  { 
    id: 1, 
    key: 'taxonomy', 
    title: 'Kategoriya', 
    subtitle: 'Mahsulot turini tanlang',
    icon: <Icons8Icon name="tagWindow" size={24} className="opacity-90" />,
    emoji: '🏷️'
  },
  { 
    id: 2, 
    key: 'photos', 
    title: 'Rasmlar', 
    subtitle: 'Eng yaxshi rasmlarni yuklang',
    icon: <Icons8Icon name="camera" size={24} className="opacity-90" />,
    emoji: '📸'
  },
  { 
    id: 3, 
    key: 'details', 
    title: 'Ma\'lumotlar', 
    subtitle: 'Mahsulot haqida',
    icon: <Icons8Icon name="sparkles" size={24} className="opacity-90" />,
    emoji: '✨'
  },
  { 
    id: 4, 
    key: 'price', 
    title: 'Narx', 
    subtitle: 'Narxni belgilang',
    icon: <Icons8Icon name="priceTag" size={24} className="opacity-90" />,
    emoji: '💰'
  },
  { 
    id: 5, 
    key: 'variants', 
    title: 'Variantlar', 
    subtitle: 'O\'lcham va ranglar',
    icon: <SwatchIcon className="w-6 h-6" />,
    emoji: '🎨'
  },
  { 
    id: 6, 
    key: 'publish', 
    title: 'Joylash', 
    subtitle: 'Tayyor!',
    icon: <Icons8Icon name="rocket" size={24} className="opacity-90" />,
    emoji: '🚀'
  }
]

// Get options from registry (separated data layer)
const AUDIENCE_OPTIONS = clothingTaxonomyRegistry.audiences
const SEGMENT_OPTIONS = clothingTaxonomyRegistry.segments

// Predefined colors for quick selection
const PRESET_COLORS = [
  { name: 'Qora', value: 'qora', hex: '#1a1a1a' },
  { name: 'Oq', value: 'oq', hex: '#ffffff' },
  { name: 'Ko\'k', value: 'kok', hex: '#3b82f6' },
  { name: 'Qizil', value: 'qizil', hex: '#ef4444' },
  { name: 'Yashil', value: 'yashil', hex: '#22c55e' },
  { name: 'Sariq', value: 'sariq', hex: '#eab308' },
  { name: 'Pushti', value: 'pushti', hex: '#ec4899' },
  { name: 'Kulrang', value: 'kulrang', hex: '#6b7280' },
  { name: 'Jigarrang', value: 'jigarrang', hex: '#92400e' },
  { name: 'To\'q ko\'k', value: 'toq_kok', hex: '#1e3a5f' },
]

// Predefined sizes
const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const NUMBER_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48']

// Condition options with premium icons
const CONDITIONS = [
  { value: 'yangi', label: 'Yangi', emoji: '✨', description: 'Hech ishlatilmagan', iconName: 'new' as keyof typeof import('../utils/icons8').Icons8 },
  { value: 'yangi_kabi', label: 'Yangi kabi', emoji: '👌', description: '1-2 marta kiyilgan', iconName: 'product' as keyof typeof import('../utils/icons8').Icons8 },
  { value: 'yaxshi', label: 'Yaxshi', emoji: '👍', description: 'Yaxshi holatda', iconName: 'product' as keyof typeof import('../utils/icons8').Icons8 },
  { value: 'o\'rtacha', label: 'O\'rtacha', emoji: '🤏', description: 'Ishlatilgan', iconName: 'product' as keyof typeof import('../utils/icons8').Icons8 },
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
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<TaxonNode | null>(
    initialTaxonomy ? CLOTHING_TAXONOMY.find(t => t.id === initialTaxonomy.id) || null : null
  )
  
  // Search state for Step 1.3
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  
  // Recent selections (localStorage)
  const [recentSelections, setRecentSelections] = useState<TaxonNode[]>([])
  
  // Load recent selections on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('clothing_wizard_recent_selections')
      if (stored) {
        const recentIds = JSON.parse(stored) as string[]
        const recent = recentIds
          .map(id => CLOTHING_TAXONOMY.find(n => n.id === id))
          .filter((n): n is TaxonNode => !!n)
          .slice(0, 5)
        setRecentSelections(recent)
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [])
  
  // Save to recent selections
  const saveToRecent = useCallback((item: TaxonNode) => {
    try {
      const stored = localStorage.getItem('clothing_wizard_recent_selections') || '[]'
      const recentIds = JSON.parse(stored) as string[]
      const updated = [item.id, ...recentIds.filter(id => id !== item.id)].slice(0, 5)
      localStorage.setItem('clothing_wizard_recent_selections', JSON.stringify(updated))
      setRecentSelections(prev => {
        const filtered = prev.filter(n => n.id !== item.id)
        return [item, ...filtered].slice(0, 5)
      })
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [])
  
  // Popular categories from registry
  const popularItems = useMemo(() => {
    return getPopularItems(clothingTaxonomyRegistry)
  }, [])
  
  // Get available segments for selected audience from registry
  const availableSegments = useMemo(() => {
    if (!selectedAudience) return []
    return getSegmentsForAudience(clothingTaxonomyRegistry, selectedAudience)
  }, [selectedAudience])
  
  // Get available items for selected audience + segment (with search filter)
  const availableItems = useMemo(() => {
    if (!selectedAudience || !selectedSegment) return []
    let items = CLOTHING_TAXONOMY.filter(
      t => t.audience === selectedAudience && t.segment === selectedSegment && t.leaf
    )
    
    // Apply search filter
    if (itemSearchQuery.trim()) {
      const query = itemSearchQuery.toLowerCase().trim()
      items = items.filter(item => {
        const labelMatch = item.labelUz.toLowerCase().includes(query)
        const synonymsMatch = item.synonymsUz?.some(s => s.toLowerCase().includes(query)) || false
        const pathMatch = item.pathUz.toLowerCase().includes(query)
        return labelMatch || synonymsMatch || pathMatch
      })
    }
    
    return items
  }, [selectedAudience, selectedSegment, itemSearchQuery])
  
  // Form data
  const [photos, setPhotos] = useState<string[]>([])
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [showBannerCreator, setShowBannerCreator] = useState(false)
  const [imageForBanner, setImageForBanner] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<{
    title: string
    description: string
    brand: string
    material: string
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
  
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [customColor, setCustomColor] = useState('')
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [sizeType, setSizeType] = useState<'letter' | 'number'>('letter')
  const [stockByVariant, setStockByVariant] = useState<Record<string, number>>({})
  const [photosByColor, setPhotosByColor] = useState<Record<string, string[]>>({})
  const [currentColorForPhoto, setCurrentColorForPhoto] = useState<string | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // AI generation state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [skipAI, setSkipAI] = useState(false)
  const [userHint, setUserHint] = useState('') // Optional hint for AI in Step 2
  
  // Double-trigger protection & request management
  const aiRequestInFlightRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const aiCacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map())
  
  // Auto-set size type based on taxonomy (shoes = number, others = letter)
  useEffect(() => {
    if (selectedTaxonomy?.segment === 'oyoq_kiyim') {
      setSizeType('number')
    } else {
      setSizeType('letter')
    }
  }, [selectedTaxonomy])
  
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

  // Step validation
  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 1: return selectedTaxonomy !== null // Taxonomy must be selected
      case 2: return photos.length >= 1
      case 3: return formData.title.trim().length >= 3 && formData.description.trim().length >= 10
      case 4: return !!formData.price && parseFloat(formData.price) > 0
      case 5: {
        // Check colors, sizes, and that each color has at least one photo
        if (selectedColors.length === 0 || selectedSizes.length === 0) return false
        const allColorsHavePhotos = selectedColors.every(color => 
          (photosByColor[color] || []).length > 0
        )
        return allColorsHavePhotos
      }
      case 6: return true
      default: return false
    }
  }, [photos, formData, selectedColors, selectedSizes, selectedTaxonomy, photosByColor])

  // Can proceed to next step
  const canProceed = isStepValid(currentStep)
  
  // Progress percentage
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100

  // Handle photo upload
  const handlePhotoUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files) return
      
      // Process each file
      Array.from(files).slice(0, 10 - photos.length).forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setImageToCrop(result)
        }
        reader.readAsDataURL(file)
      })
    }
    input.click()
  }

  // Handle cropped image
  const handleCroppedImage = (croppedUrl: string) => {
    setPhotos(prev => [...prev, croppedUrl])
    setImageToCrop(null)
  }

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  // Add custom color
  const addCustomColor = () => {
    if (customColor.trim() && !selectedColors.includes(customColor.trim())) {
      setSelectedColors(prev => [...prev, customColor.trim()])
      setCustomColor('')
    }
  }

  // Toggle color
  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    )
  }

  // Toggle size
  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    )
  }

  // Update stock for variant
  const updateStock = (color: string, size: string, qty: number) => {
    const key = `${size}_${color}`
    setStockByVariant(prev => ({
      ...prev,
      [key]: qty
    }))
  }

  // Format price with spaces
  const formatPrice = (value: string): string => {
    const num = value.replace(/\D/g, '')
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Parse price
  const parsePrice = (value: string): number => {
    return parseInt(value.replace(/\s/g, '')) || 0
  }

  // Check internet connection
  const checkInternet = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false
    try {
      const response = await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD', 
        mode: 'no-cors',
        cache: 'no-cache'
      })
      return true
    } catch {
      return false
    }
  }, [])

  // Generate hash for cache key
  const generateCacheKey = useCallback((images: string[], taxonomyId: string, hint: string): string => {
    // Simple hash: first 100 chars of each image + taxonomy + hint
    const imageHash = images.slice(0, 3).map(img => img.substring(0, 100)).join('|')
    const keyString = `${taxonomyId}|${hint}|${imageHash.substring(0, 200)}`
    // Use simpleHash for consistent hashing
    return simpleHash(keyString)
  }, [])

  // Optimize image for AI: compress to 512px and remove base64 prefix
  const optimizeImageForAI = useCallback(async (imageDataUrl: string): Promise<string> => {
    try {
      // Convert data URL to File
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' })
      
      // Compress to 512px max dimension
      const compressedFiles = await compressDataUrls([imageDataUrl], {
        maxWidthOrHeight: 512,
        maxSizeMB: 0.2, // 200KB max
      }, 'listing')
      
      if (compressedFiles.length > 0) {
        // Convert back to data URL and remove prefix
        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(compressedFiles[0])
        })
        // Remove data:image/...;base64, prefix
        return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
      }
      
      // Fallback: remove prefix from original
      return imageDataUrl.includes(',') ? imageDataUrl.split(',')[1] : imageDataUrl
    } catch (error) {
      console.warn('Image optimization failed:', error)
      // Fallback: remove prefix from original
      return imageDataUrl.includes(',') ? imageDataUrl.split(',')[1] : imageDataUrl
    }
  }, [])

  // Generate AI content from images and category (Production-ready)
  const generateAIContent = useCallback(async (overwrite: boolean = false) => {
    // 1. Validation
    if (!selectedTaxonomy || photos.length === 0) {
      setAiError('Kategoriya va rasmlar kerak')
      return
    }

    // 3. Double-trigger protection
    if (aiRequestInFlightRef.current) {
      console.warn('AI request already in flight, skipping duplicate')
      return
    }

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for timeout
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Set timeout (12-15s)
    const timeoutId = setTimeout(() => {
      abortController.abort()
    }, 15000)

    aiRequestInFlightRef.current = true
    setIsGeneratingAI(true)
    setAiError(null)
    if (overwrite) {
      setAiGenerated(false)
    }

    const startTime = Date.now()
    const modelVersion = 'gemini-2.0-flash'
    const sanitizedHint = sanitizeText(userHint.trim())

    try {
      // Prepare images: limit to 3, optimize (512px, remove prefix)
      const imagesToSend = photos.slice(0, 3)
      const processedImages: string[] = []
      
      for (const imageDataUrl of imagesToSend) {
        const optimized = await optimizeImageForAI(imageDataUrl)
        processedImages.push(optimized)
      }

      // 9. Cache check
      const cacheKey = generateCacheKey(processedImages, selectedTaxonomy.id, sanitizedHint)
      const cached = aiCacheRef.current.get(cacheKey)
      const cacheAge = cached ? Date.now() - cached.timestamp : Infinity
      const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

      let aiData: any
      if (cached && cacheAge < CACHE_TTL) {
        console.log('Using cached AI response', { cacheAge: Math.round(cacheAge / 1000) + 's' })
        aiData = cached.data
      } else {
        // Calculate request size for observability
        const requestSize = JSON.stringify({
          images: processedImages,
          category: selectedTaxonomy,
          userHint: sanitizedHint
        }).length

        // 8. Observability: Log request
        console.log('[AI Request]', {
          taxonomy: selectedTaxonomy.id,
          imagesCount: processedImages.length,
          requestSizeKB: Math.round(requestSize / 1024),
          hasHint: !!sanitizedHint,
          timestamp: new Date().toISOString()
        })

        // Call AI API with AbortController
        const response = await fetch('/api/gemini-image-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
          signal: abortController.signal,
        })

        const latency = Date.now() - startTime

        // 4. Rate limit handling (429)
        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}))
          console.error('[AI Error] Rate limit exceeded', { latency })
          setAiError('AI hozir band. Xohlasangiz qo\'lda davom eting yoki 1 daqiqadan so\'ng qayta urinib ko\'ring.')
          return
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('[AI Error]', { status: response.status, error: errorData, latency })
          throw new Error(errorData.error || 'AI javob olishda xatolik')
        }

        aiData = await response.json()

        // 8. Observability: Log success
        console.log('[AI Success]', {
          latency: latency + 'ms',
          responseSize: JSON.stringify(aiData).length,
          timestamp: new Date().toISOString()
        })

        // Cache the response
        aiCacheRef.current.set(cacheKey, {
          data: aiData,
          timestamp: Date.now()
        })

        // Clean old cache entries (keep only last 10)
        if (aiCacheRef.current.size > 10) {
          const entries = Array.from(aiCacheRef.current.entries())
          entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
          aiCacheRef.current.clear()
          entries.slice(0, 10).forEach(([key, value]) => {
            aiCacheRef.current.set(key, value)
          })
        }
      }

      // Validate response
      if (!aiData || typeof aiData !== 'object') {
        throw new Error('AI javob formati noto\'g\'ri')
      }

      // 10. Security: Check for PII in AI response
      if (aiData.description && containsPII(aiData.description)) {
        console.warn('[AI Security] PII detected in description, sanitizing')
        aiData.description = sanitizeText(aiData.description)
      }
      if (aiData.title && containsPII(aiData.title)) {
        console.warn('[AI Security] PII detected in title, sanitizing')
        aiData.title = sanitizeText(aiData.title)
      }

      // 1. AI Metadata (source-tag)
      const aiMeta = {
        generatedAt: new Date().toISOString(),
        model: modelVersion,
        imagesUsed: processedImages.length,
        hintUsed: !!sanitizedHint,
        version: '1.0.0'
      }

      // 5. Condition mapping: null instead of default if invalid
      const validatedCondition = aiData.condition && 
        ['yangi', 'yangi_kabi', 'yaxshi', 'o\'rtacha'].includes(aiData.condition)
        ? aiData.condition
        : null

      // AI Merge Logic: Only fill empty fields (unless overwrite=true)
      setFormData(prev => ({
        ...prev,
        title: overwrite || !prev.title.trim() ? (aiData.title || prev.title) : prev.title,
        description: overwrite || !prev.description.trim() ? (aiData.description || prev.description) : prev.description,
        brand: overwrite || !prev.brand.trim() ? (aiData.brand || prev.brand) : prev.brand,
        material: overwrite || !prev.material.trim() ? (aiData.material || prev.material) : prev.material,
        condition: overwrite || prev.condition === 'yangi' 
          ? (validatedCondition || prev.condition) 
          : prev.condition,
        _aiMeta: aiMeta, // 1. Source-tag for debugging
      }))

      setAiGenerated(true)
    } catch (err: any) {
      const latency = Date.now() - startTime
      
      // 8. Observability: Log error
      console.error('[AI Error]', {
        error: err.message,
        latency: latency + 'ms',
        aborted: err.name === 'AbortError',
        timestamp: new Date().toISOString()
      })

      if (err.name === 'AbortError') {
        setAiError('AI javob olish vaqti tugadi. Iltimos, qayta urinib ko\'ring.')
      } else if (err.message.includes('429') || err.message.includes('rate limit')) {
        setAiError('AI hozir band. Xohlasangiz qo\'lda davom eting yoki 1 daqiqadan so\'ng qayta urinib ko\'ring.')
      } else {
        setAiError(err.message || 'AI yordamida to\'ldirishda xatolik yuz berdi')
      }
    } finally {
      clearTimeout(timeoutId)
      aiRequestInFlightRef.current = false
      abortControllerRef.current = null
      setIsGeneratingAI(false)
    }
  }, [selectedTaxonomy, photos, userHint, optimizeImageForAI, generateCacheKey])

  // Submit listing
  const handleSubmit = async () => {
    let currentUser = user
    
    // If user is not loaded, try to fetch it
    if (!currentUser) {
      try {
        const telegramUser = getTelegramUser()
        if (!telegramUser) {
          setError('Telegram ma\'lumotlari topilmadi. Iltimos, ilovani qayta yuklang.')
          return
        }
        
        // Try to get user from database
        let dbUser = await getUser(telegramUser.id)
        
        // Create user if doesn't exist
        if (!dbUser) {
          try {
            dbUser = await createOrUpdateUser({
              telegram_user_id: telegramUser.id,
              username: telegramUser.username,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name,
              profile_photo_url: telegramUser.photo_url,
              search_radius_miles: 10,
              is_premium: false,
              rating_average: 0,
              total_reviews: 0,
              items_sold_count: 0,
              created_at: new Date().toISOString(),
              last_active: new Date().toISOString()
            })
            
            if (!dbUser) {
              // Try to get user again after creation attempt
              await new Promise(resolve => setTimeout(resolve, 500))
              dbUser = await getUser(telegramUser.id)
            }
          } catch (createErr: any) {
            console.error('Error creating user:', createErr)
            // Try to get user again in case it was created but not returned
            await new Promise(resolve => setTimeout(resolve, 500))
            dbUser = await getUser(telegramUser.id)
          }
        }
        
        if (!dbUser) {
          setError('Foydalanuvchi yaratilmadi. Iltimos, ilovani qayta yuklang yoki admin bilan bog\'laning.')
          console.error('User creation failed. Telegram ID:', telegramUser.id)
          return
        }
        
        currentUser = dbUser
      } catch (err: any) {
        console.error('Error fetching user:', err)
        setError('Foydalanuvchi ma\'lumotlarini yuklashda xatolik. Iltimos, qayta urinib ko\'ring.')
        return
      }
    }
    
    if (!currentUser || !currentUser.telegram_user_id) {
      setError('Foydalanuvchi ma\'lumotlari to\'liq emas. Iltimos, qayta urinib ko\'ring.')
      return
    }
    
    // Validation
    if (!formData.title.trim()) {
      setError('Sarlavha kiritilishi shart')
      return
    }
    
    if (!formData.description.trim()) {
      setError('Tavsif kiritilishi shart')
      return
    }
    
    if (photos.length === 0) {
      setError('Kamida bitta rasm qo\'shilishi shart')
      return
    }
    
    if (selectedColors.length === 0) {
      setError('Kamida bitta rang tanlanishi shart')
      return
    }
    
    if (selectedSizes.length === 0) {
      setError('Kamida bitta o\'lcham tanlanishi shart')
      return
    }
    
    // Check that each color has at least one photo
    const colorsWithoutPhotos = selectedColors.filter(color => 
      (photosByColor[color] || []).length === 0
    )
    if (colorsWithoutPhotos.length > 0) {
      setError(`Quyidagi ranglar uchun rasm qo'shing: ${colorsWithoutPhotos.join(', ')}`)
      return
    }
    
    if (!formData.price || parsePrice(formData.price) <= 0) {
      setError('To\'g\'ri narx kiriting')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Compress and upload main images
      const compressedFiles = await compressDataUrls(photos, {}, 'listing')
      const photoUrls = await uploadImages(compressedFiles)
      
      // Upload images for each color
      const uploadedPhotosByColor: Record<string, string[]> = {}
      for (const color of selectedColors) {
        const colorPhotos = photosByColor[color] || []
        if (colorPhotos.length > 0) {
          const compressedColorPhotos = await compressDataUrls(colorPhotos, {}, 'listing')
          const uploadedColorUrls = await uploadImages(compressedColorPhotos)
          uploadedPhotosByColor[color] = uploadedColorUrls
        }
      }
      
      // Build attributes
      const attributes: Record<string, any> = {
        brand: formData.brand,
        material: formData.material,
        colors: selectedColors,
        sizes: selectedSizes,
        stock_by_size_color: stockByVariant,
        price_negotiable: formData.priceNegotiable,
        photos_by_color: uploadedPhotosByColor,
      }
      
      if (formData.hasDiscount && formData.originalPrice) {
        attributes.discount_available = true
        attributes.discount_original_price = parsePrice(formData.originalPrice)
        attributes.discount_reason = formData.discountReason
        attributes.discount_percent = Math.round(
          (1 - parsePrice(formData.price) / parsePrice(formData.originalPrice)) * 100
        )
      }
      
      // Use selected taxonomy
      if (selectedTaxonomy) {
        attributes.taxonomy = {
          id: selectedTaxonomy.id,
          pathUz: selectedTaxonomy.pathUz,
          audience: selectedTaxonomy.audience,
          segment: selectedTaxonomy.segment,
          labelUz: selectedTaxonomy.labelUz,
          audienceUz: AUDIENCE_OPTIONS.find(a => a.value === selectedTaxonomy.audience)?.label,
          segmentUz: SEGMENT_OPTIONS.find(s => s.value === selectedTaxonomy.segment)?.label,
          leafUz: selectedTaxonomy.labelUz,
        }
        attributes.clothing_type = selectedTaxonomy.labelUz
        
        // Generate tags from taxonomy
        const taxonomyTags = buildTagsFromSelection(selectedTaxonomy)
        attributes.tags = [...new Set([...(attributes.tags || []), ...taxonomyTags])]
      }
      
      // Map condition to database value
      const conditionMap: Record<string, string> = {
        'yangi': 'new',
        'yangi_kabi': 'like_new',
        'yaxshi': 'good',
        'o\'rtacha': 'fair',
      }
      
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
        stock_qty: Object.values(stockByVariant).reduce((sum, qty) => sum + qty, 0)
      })
    } catch (err: any) {
      console.error('Error creating listing:', err)
      setError(err.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
      setIsSubmitting(false)
    }
  }

  // Navigate between steps
  const goNext = async () => {
    if (!canProceed || currentStep >= STEPS.length) return

    // Auto-trigger AI generation when moving from step 2 to step 3
    if (currentStep === 2 && currentStep + 1 === 3) {
      // Trigger AI generation before moving to next step
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={goBack}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>
          
          <div className="text-center">
            <h1 className="text-white font-semibold text-lg flex items-center justify-center gap-2">
              <span className="flex items-center justify-center">{STEPS[currentStep - 1].icon}</span>
              {STEPS[currentStep - 1].title}
            </h1>
            <p className="text-white/60 text-xs">
              {STEPS[currentStep - 1].subtitle}
            </p>
          </div>
          
          <div className="w-10 text-center">
            <span className="text-white/80 text-sm font-medium">
              {currentStep}/{STEPS.length}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        {/* Selected taxonomy breadcrumb */}
        {selectedTaxonomy && currentStep > 1 && (
          <div className="px-4 py-2 bg-white/5 border-t border-white/5">
            <p className="text-white/60 text-xs text-center flex items-center justify-center gap-2">
              <TagIcon className="w-3 h-3" />
              {selectedTaxonomy.pathUz}
            </p>
          </div>
        )}
      </header>

      {/* Step indicators */}
      <div className="px-4 py-4">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isStepValid(step.id - 1) && setCurrentStep(step.id)}
                disabled={!isStepValid(step.id - 1) && step.id !== currentStep}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep === step.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white scale-110 shadow-lg shadow-purple-500/50'
                    : currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {currentStep > step.id ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <span className="flex items-center justify-center">{step.icon}</span>
                )}
              </button>
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 transition-colors duration-300 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-32">
        <div className="max-w-lg mx-auto">
          
          {/* Step 1: Taxonomy Selection */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center mb-6">
                <p className="text-white/80 text-sm flex items-center justify-center gap-2">
                  <Icons8Icon name="goal" size={16} className="opacity-90" />
                  To'g'ri kategoriya = Tez topilish
                </p>
              </div>
              
              {/* Quick Selection: Recent & Popular (only when no selection) */}
              {!selectedAudience && !selectedTaxonomy && (
                <div className="space-y-4">
                  {/* Recent Selections */}
                  {recentSelections.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-white/60 text-xs font-medium">So'nggi tanlanganlar</p>
                      <div className="flex flex-wrap gap-2">
                        {recentSelections.map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedTaxonomy(item)
                              saveToRecent(item)
                            }}
                            className="px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 hover:border-purple-400/50 hover:bg-slate-700/60 transition-all text-white text-xs flex items-center gap-1.5"
                          >
                            <Icons8Icon name="tagWindow" size={12} className="opacity-90" />
                            {item.labelUz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Popular Categories */}
                  {popularItems.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-white/60 text-xs font-medium">Top kategoriyalar</p>
                      <div className="flex flex-wrap gap-2">
                        {popularItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedTaxonomy(item)
                              saveToRecent(item)
                            }}
                            className="px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 hover:border-purple-400/50 hover:bg-slate-700/60 transition-all text-white text-xs flex items-center gap-1.5"
                          >
                            <Icons8Icon name="tagWindow" size={12} className="opacity-90" />
                            {item.labelUz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Divider */}
                  {(recentSelections.length > 0 || popularItems.length > 0) && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-white/10"></div>
                      <span className="text-white/40 text-xs">yoki</span>
                      <div className="flex-1 h-px bg-white/10"></div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Step 1.1: Audience Selection */}
              {!selectedAudience && !selectedTaxonomy && (
                <div className="space-y-3">
                  <p className="text-white/60 text-sm text-center mb-4">Kim uchun mo'ljallangan?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {AUDIENCE_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedAudience(option.value)
                          setSelectedSegment(null)
                          setSelectedTaxonomy(null)
                        }}
                        className="p-5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-purple-400/50 hover:bg-slate-700/60 transition-all flex flex-col items-center gap-2 shadow-lg"
                      >
                        {option.iconName && (
                          <Icons8Icon name={option.iconName} size={32} className="opacity-90" />
                        )}
                        <span className="text-white font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Step 1.2: Segment Selection */}
              {selectedAudience && !selectedSegment && !selectedTaxonomy && (
                <div className="space-y-3">
                  <button 
                    onClick={() => setSelectedAudience(null)}
                    className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    {AUDIENCE_OPTIONS.find(a => a.value === selectedAudience)?.label || 'Orqaga'}
                  </button>
                  
                  <p className="text-white/60 text-sm text-center mb-4">Qanday kiyim?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {availableSegments.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedSegment(option.value)
                          setSelectedTaxonomy(null)
                        }}
                        className="p-5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-purple-400/50 hover:bg-slate-700/60 transition-all flex flex-col items-center gap-2 shadow-lg"
                      >
                        {option.iconName && (
                          <Icons8Icon name={option.iconName} size={28} className="opacity-90" />
                        )}
                        <span className="text-white font-medium text-sm">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Step 1.3: Item Selection */}
              {selectedAudience && selectedSegment && !selectedTaxonomy && (
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setSelectedSegment(null)
                      setItemSearchQuery('')
                    }}
                    className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    {SEGMENT_OPTIONS.find(s => s.value === selectedSegment)?.label || 'Orqaga'}
                  </button>
                  
                  <p className="text-white/60 text-sm text-center mb-4">Aniq turini tanlang</p>
                  
                  {/* Search Input */}
                  <div className="relative mb-4">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      placeholder="Qidirish..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all text-sm"
                    />
                  </div>
                  
                  {/* Items Grid */}
                  {availableItems.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pb-4">
                      {availableItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedTaxonomy(item)
                            saveToRecent(item)
                            setItemSearchQuery('')
                          }}
                          className="p-4 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-purple-400/50 hover:bg-slate-700/60 transition-all text-left shadow-lg"
                        >
                          <span className="text-white font-medium text-sm block">{item.labelUz}</span>
                          {/* Show pathUz for context */}
                          <p className="text-white/50 text-xs mt-1 truncate">
                            {item.pathUz.split(' / ').slice(-2).join(' / ')}
                          </p>
                          {item.synonymsUz && item.synonymsUz.length > 0 && (
                            <p className="text-white/40 text-xs mt-1 truncate">
                              {item.synonymsUz.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/60 text-sm">Hech narsa topilmadi</p>
                      <p className="text-white/40 text-xs mt-1">Boshqa so'z bilan qidiring</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Selected Taxonomy Display */}
              {selectedTaxonomy && (
                <div className="space-y-4">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-400/50 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                          <CheckIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold">{selectedTaxonomy.labelUz}</p>
                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-medium">
                              Tanlandi
                            </span>
                          </div>
                          <p className="text-white/70 text-xs mt-1">{selectedTaxonomy.pathUz}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTaxonomy(null)
                          setSelectedSegment(null)
                          setSelectedAudience(null)
                          setItemSearchQuery('')
                        }}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5 text-white/60" />
                      </button>
                    </div>
                    
                    {/* Quick info */}
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const audienceOption = AUDIENCE_OPTIONS.find(a => a.value === selectedTaxonomy.audience)
                        return audienceOption?.iconName ? (
                          <span className="px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-white text-xs flex items-center gap-1.5">
                            <Icons8Icon name={audienceOption.iconName} size={14} className="opacity-90" />
                            {audienceOption.label}
                          </span>
                        ) : null
                      })()}
                      {(() => {
                        const segmentOption = SEGMENT_OPTIONS.find(s => s.value === selectedTaxonomy.segment)
                        return segmentOption?.iconName ? (
                          <span className="px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-white text-xs flex items-center gap-1.5">
                            <Icons8Icon name={segmentOption.iconName} size={14} className="opacity-90" />
                            {segmentOption.label}
                          </span>
                        ) : null
                      })()}
                    </div>
                  </div>
                  
                  {/* Info about why this matters */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                      <Icons8Icon name="sparkles" size={16} className="opacity-90" />
                      Nima uchun muhim?
                    </p>
                    <ul className="text-white/60 text-xs space-y-1">
                      <li>• O'xshash e'lonlar orasida ko'rinadi</li>
                      <li>• Xaridorlar oson topadi</li>
                      <li>• To'g'ri teglar avtomatik qo'shiladi</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 2: Photos */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center mb-6">
                <p className="text-white/80 text-sm flex items-center justify-center gap-2">
                  <Icons8Icon name="chart" size={16} className="opacity-90" />
                  Yaxshi rasmlar = Tez sotish
                </p>
              </div>
              
              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div 
                    key={index}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-white/10 group"
                  >
                    <img 
                      src={photo} 
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Action buttons */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setImageForBanner(photo)
                          setShowBannerCreator(true)
                        }}
                        className="p-2 bg-violet-500 rounded-xl hover:bg-violet-600 transition-colors"
                        title="Banner yaratish"
                      >
                        <PaintBrushIcon className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => removePhoto(index)}
                        className="p-2 bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
                        title="O'chirish"
                      >
                        <XMarkIcon className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full">
                        <span className="text-white text-xs font-medium">Asosiy</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {photos.length < 10 && (
                  <button
                    onClick={handlePhotoUpload}
                    className="aspect-square rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:border-purple-400 hover:text-purple-400 hover:bg-white/5 transition-all"
                  >
                    <PlusIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs">Qo'shish</span>
                  </button>
                )}
              </div>
              
              {/* Banner Creator CTA */}
              {photos.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">Professional banner yarating</p>
                      <p className="text-white/60 text-xs">Rasmni bosing va 🎨 tugmasini tanlang</p>
                    </div>
                  </div>
                </div>
              )}
              
              {photos.length === 0 && (
                <div 
                  onClick={handlePhotoUpload}
                  className="mt-4 p-8 rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-white/5 transition-all"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                    <PhotoIcon className="w-10 h-10 text-purple-400" />
                  </div>
                  <p className="text-white font-medium mb-1">Rasmlarni yuklang</p>
                  <p className="text-white/60 text-sm">10 tagacha rasm</p>
                </div>
              )}
              
              {/* User Hint Input (Optional) */}
              <div className="mt-6 space-y-2">
                <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                  <Icons8Icon name="idea" size={16} className="opacity-90" />
                  AI uchun qo'shimcha ma'lumot (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={userHint}
                  onChange={(e) => setUserHint(e.target.value)}
                  placeholder="Masalan: Nike sport kurtka, Adidas futbolka..."
                  maxLength={50}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                />
                <p className="text-white/40 text-xs">Brend yoki model nomini yozing - AI aniqroq to'ldiradi</p>
              </div>

              {/* Skip AI Option */}
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skipAI"
                  checked={skipAI}
                  onChange={(e) => setSkipAI(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="skipAI" className="text-white/70 text-sm cursor-pointer">
                  AI yordamida to'ldirishni o'tkazib yuborish
                </label>
              </div>

              {/* Tips */}
              <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                  <Icons8Icon name="idea" size={16} className="opacity-90" />
                  Maslahatlar:
                </p>
                <ul className="text-white/60 text-xs space-y-1">
                  <li>• Yorug' joyda rasm oling</li>
                  <li>• Mahsulotni turli burchaklardan ko'rsating</li>
                  <li>• Birinchi rasm eng muhim!</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              {/* AI Status Banner */}
              {isGeneratingAI && (
                <div className="p-4 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                  <p className="text-white/90 text-sm">AI ma'lumotlarni generatsiya qilmoqda...</p>
                </div>
              )}
              
              {aiError && (
                <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
                    <p className="text-white/90 text-sm">{aiError}</p>
                  </div>
                  <button
                    onClick={() => setAiError(null)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              )}

              {aiGenerated && !isGeneratingAI && (
                <div className="p-4 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <p className="text-white/90 text-sm">AI to'ldirildi - kerak bo'lsa tahrirlashingiz mumkin</p>
                </div>
              )}

              {/* Manual AI Button */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-white/80 text-sm font-medium mb-1">AI yordamida to'ldirish</p>
                  <p className="text-white/50 text-xs">Rasmlar va kategoriya asosida avtomatik to'ldirish</p>
                </div>
                <button
                  onClick={generateAIContent}
                  disabled={isGeneratingAI || !selectedTaxonomy || photos.length === 0}
                  className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    isGeneratingAI || !selectedTaxonomy || photos.length === 0
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 active:scale-95'
                  }`}
                >
                  {isGeneratingAI ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Kutilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Icons8Icon name="sparkles" size={18} className="opacity-90" />
                      <span>AI to'ldirish</span>
                    </>
                  )}
                </button>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                  Sarlavha *
                  {isGeneratingAI && (
                    <span className="text-xs text-white/50">(AI generatsiya qilmoqda...)</span>
                  )}
                </label>
                {isGeneratingAI && !formData.title ? (
                  <div className="w-full h-14 bg-white/5 rounded-2xl animate-pulse"></div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={selectedTaxonomy ? `Masalan: Nike ${selectedTaxonomy.labelUz.toLowerCase()}` : "Sarlavha kiriting"}
                      maxLength={80}
                      disabled={isGeneratingAI}
                      className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                    <p className="text-white/40 text-xs text-right">{formData.title.length}/80</p>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                  Tavsif *
                  {isGeneratingAI && (
                    <span className="text-xs text-white/50">(AI generatsiya qilmoqda...)</span>
                  )}
                </label>
                {isGeneratingAI && !formData.description ? (
                  <div className="w-full h-32 bg-white/5 rounded-2xl animate-pulse"></div>
                ) : (
                  <>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Mahsulot haqida batafsil yozing..."
                      rows={4}
                      maxLength={500}
                      disabled={isGeneratingAI}
                      className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none disabled:opacity-50"
                    />
                    <p className="text-white/40 text-xs text-right">{formData.description.length}/500</p>
                  </>
                )}
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">
                  Brend <span className="text-white/40 text-xs">(ixtiyoriy)</span>
                </label>
                {isGeneratingAI && !formData.brand ? (
                  <div className="w-full h-14 bg-white/5 rounded-2xl animate-pulse"></div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder={formData.brand ? "Masalan: Nike, Adidas, Zara" : "Aniqlanmadi (ixtiyoriy)"}
                      disabled={isGeneratingAI}
                      className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                    {!formData.brand && (
                      <p className="text-white/50 text-xs">Brendni yozsangiz tezroq sotiladi</p>
                    )}
                  </>
                )}
              </div>

              {/* Material */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">
                  Material <span className="text-white/40 text-xs">(ixtiyoriy)</span>
                </label>
                {isGeneratingAI && !formData.material ? (
                  <div className="w-full h-14 bg-white/5 rounded-2xl animate-pulse"></div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={formData.material}
                      onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                      placeholder={formData.material ? "Masalan: Paxta, Teri, Poliester" : "Aniqlanmadi (ixtiyoriy)"}
                      disabled={isGeneratingAI}
                      className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                    {!formData.material && (
                      <p className="text-white/50 text-xs">Materialni ko'rsatsangiz xaridorlar ishonchliroq</p>
                    )}
                  </>
                )}
              </div>

              {/* Condition */}
              <div className="space-y-3">
                <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                  Holati *
                  {isGeneratingAI && formData.condition === 'yangi' && (
                    <span className="text-xs text-white/50">(AI aniqlayapti...)</span>
                  )}
                </label>
                {isGeneratingAI && formData.condition === 'yangi' ? (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-white/60 text-sm text-center">AI holatni aniqlayapti...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {CONDITIONS.map(cond => (
                        <button
                          key={cond.value}
                          onClick={() => setFormData(prev => ({ ...prev, condition: cond.value }))}
                          className={`p-4 rounded-2xl border-2 transition-all ${
                            formData.condition === cond.value
                              ? 'border-purple-500 bg-purple-500/20'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          {cond.iconName ? (
                            <div className="mb-1 flex items-center justify-center">
                              <Icons8Icon name={cond.iconName} size={24} className="opacity-90" />
                            </div>
                          ) : (
                            <span className="text-2xl block mb-1">{cond.emoji}</span>
                          )}
                          <span className="text-white font-medium text-sm">{cond.label}</span>
                          <span className="text-white/50 text-xs block">{cond.description}</span>
                        </button>
                      ))}
                    </div>
                    {formData.condition === 'yangi' && aiGenerated && (
                      <p className="text-white/50 text-xs text-center">
                        AI aniqlay olmadi - o'zingiz tanlang
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Price */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Price input */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">
                  Narx *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      price: formatPrice(e.target.value) 
                    }))}
                    placeholder="500 000"
                    className="w-full px-4 py-5 pr-16 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white text-2xl font-bold placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 font-medium">
                    so'm
                  </span>
                </div>
              </div>

              {/* Negotiable */}
              <button
                onClick={() => setFormData(prev => ({ ...prev, priceNegotiable: !prev.priceNegotiable }))}
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                  formData.priceNegotiable
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <span className="text-white font-medium flex items-center gap-2">
                  <Icons8Icon name="handshake" size={18} className="opacity-90" />
                  Narxni savdolashish mumkin
                </span>
                <div className={`w-12 h-7 rounded-full transition-colors ${
                  formData.priceNegotiable ? 'bg-green-500' : 'bg-white/20'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform mt-1 ${
                    formData.priceNegotiable ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
              </button>

              {/* Discount toggle */}
              <button
                onClick={() => setFormData(prev => ({ ...prev, hasDiscount: !prev.hasDiscount }))}
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                  formData.hasDiscount
                    ? 'border-orange-500 bg-orange-500/20'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <span className="text-white font-medium flex items-center gap-2">
                  <Icons8Icon name="lightning" size={18} className="opacity-90" />
                  Aksiya qo'shish
                </span>
                <div className={`w-12 h-7 rounded-full transition-colors ${
                  formData.hasDiscount ? 'bg-orange-500' : 'bg-white/20'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform mt-1 ${
                    formData.hasDiscount ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
              </button>

              {/* Discount details */}
              {formData.hasDiscount && (
                <div className="space-y-4 p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 animate-fadeIn">
                  <div className="space-y-2">
                    <label className="text-white/80 text-sm font-medium">
                      Asl narx (chegirmadan oldin)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          originalPrice: formatPrice(e.target.value) 
                        }))}
                        placeholder="600 000"
                        className="w-full px-4 py-3 pr-16 bg-white/10 border border-white/10 rounded-xl text-white font-medium placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 text-sm">
                        so'm
                      </span>
                    </div>
                    {formData.originalPrice && formData.price && parsePrice(formData.originalPrice) > parsePrice(formData.price) && (
                      <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                        <Icons8Icon name="celebration" size={16} className="opacity-90" />
                        Chegirma: {Math.round((1 - parsePrice(formData.price) / parsePrice(formData.originalPrice)) * 100)}%
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-white/80 text-sm font-medium">
                      Aksiya sababi
                    </label>
                    <input
                      type="text"
                      value={formData.discountReason}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountReason: e.target.value }))}
                      placeholder="Masalan: Mavsumiy aksiya"
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Variants */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Colors */}
              <div className="space-y-3">
                <label className="text-white/80 text-sm font-medium">
                  Ranglar *
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => toggleColor(color.name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all ${
                        selectedColors.includes(color.name)
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div 
                        className="w-5 h-5 rounded-full border border-white/20"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-white text-sm">{color.name}</span>
                      {selectedColors.includes(color.name) && (
                        <CheckCircleIcon className="w-4 h-4 text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Custom color input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="Boshqa rang..."
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyPress={(e) => e.key === 'Enter' && addCustomColor()}
                  />
                  <button
                    onClick={addCustomColor}
                    disabled={!customColor.trim()}
                    className="px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-white/10 disabled:text-white/40 text-white rounded-xl transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Selected colors with photo upload */}
                {selectedColors.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <p className="text-white/60 text-sm flex items-center gap-2">
                      <CameraIcon className="w-4 h-4" />
                      Har bir rang uchun rasmlar qo'shing
                    </p>
                    {selectedColors.map(color => {
                      const colorPhotos = photosByColor[color] || []
                      const presetColor = PRESET_COLORS.find(c => c.name === color)
                      
                      return (
                        <div 
                          key={color}
                          className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-full border-2 border-white/20"
                                style={{ backgroundColor: presetColor?.hex || '#888' }}
                              />
                              <span className="text-white font-medium">{color}</span>
                              <span className="text-white/40 text-sm">
                                ({colorPhotos.length} ta rasm)
                              </span>
                            </div>
                            <button
                              onClick={() => toggleColor(color)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                          
                          {/* Photo thumbnails for this color */}
                          <div className="flex gap-2 flex-wrap">
                            {colorPhotos.map((photo, idx) => (
                              <div key={idx} className="relative group">
                                <img 
                                  src={photo} 
                                  alt={`${color} ${idx + 1}`}
                                  className="w-16 h-16 object-cover rounded-xl"
                                />
                                <button
                                  onClick={() => {
                                    setPhotosByColor(prev => ({
                                      ...prev,
                                      [color]: prev[color].filter((_, i) => i !== idx)
                                    }))
                                  }}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <XMarkIcon className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            ))}
                            
                            {/* Add photo button */}
                            <label className="w-16 h-16 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/10 transition-all">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = e.target.files
                                  if (files) {
                                    Array.from(files).forEach(file => {
                                      const reader = new FileReader()
                                      reader.onloadend = () => {
                                        setPhotosByColor(prev => ({
                                          ...prev,
                                          [color]: [...(prev[color] || []), reader.result as string]
                                        }))
                                      }
                                      reader.readAsDataURL(file)
                                    })
                                  }
                                }}
                              />
                              <PlusIcon className="w-6 h-6 text-white/40" />
                            </label>
                          </div>
                          
                          {colorPhotos.length === 0 && (
                            <p className="text-amber-400/80 text-xs flex items-center gap-1">
                              <ExclamationCircleIcon className="w-4 h-4" />
                              Bu rang uchun kamida 1 ta rasm qo'shing
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Sizes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-white/80 text-sm font-medium">
                    O'lchamlar *
                  </label>
                  <div className="flex bg-white/10 rounded-lg p-1">
                    <button
                      onClick={() => setSizeType('letter')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        sizeType === 'letter'
                          ? 'bg-purple-500 text-white'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      S, M, L
                    </button>
                    <button
                      onClick={() => setSizeType('number')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        sizeType === 'number'
                          ? 'bg-purple-500 text-white'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      40, 41, 42
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(sizeType === 'letter' ? LETTER_SIZES : NUMBER_SIZES).map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`min-w-[48px] px-3 py-3 rounded-xl border-2 text-center transition-all ${
                        selectedSizes.includes(size)
                          ? 'border-purple-500 bg-purple-500/20 text-white'
                          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock by variant (simplified) */}
              {selectedColors.length > 0 && selectedSizes.length > 0 && (
                <div className="space-y-3">
                  <label className="text-white/80 text-sm font-medium">
                    Har bir variant uchun soni
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto p-2">
                    {selectedColors.slice(0, 3).map(color => (
                      <div key={color} className="p-3 bg-white/5 rounded-xl">
                        <p className="text-white/80 text-sm mb-2">{color}</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSizes.slice(0, 5).map(size => {
                            const key = `${size}_${color}`
                            return (
                              <div key={key} className="flex items-center gap-1">
                                <span className="text-white/60 text-xs w-8">{size}</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={stockByVariant[key] || ''}
                                  onChange={(e) => updateStock(color, size, parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-14 px-2 py-1 bg-white/10 border border-white/10 rounded text-white text-center text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {(selectedColors.length > 3 || selectedSizes.length > 5) && (
                    <p className="text-white/40 text-xs text-center">
                      Qolgan variantlar uchun default 1 dona saqlanadi
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 6: Publish */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <RocketLaunchIcon className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-white text-2xl font-bold mb-2">Tayyor!</h2>
                <p className="text-white/60">E'loningiz joylashga tayyor</p>
              </div>

              {/* Preview card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10">
                {photos[0] && (
                  <div className="aspect-square relative">
                    <img 
                      src={photos[0]} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {formData.hasDiscount && formData.originalPrice && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-red-500 rounded-full">
                        <span className="text-white font-bold text-sm">
                          -{Math.round((1 - parsePrice(formData.price) / parsePrice(formData.originalPrice)) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {formData.title || 'Sarlavha'}
                  </h3>
                  <p className="text-white/60 text-sm mb-3 line-clamp-2">
                    {formData.description || 'Tavsif'}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-xl font-bold">
                      {formData.price || '0'} so'm
                    </span>
                    {formData.hasDiscount && formData.originalPrice && (
                      <span className="text-white/40 line-through text-sm">
                        {formData.originalPrice} so'm
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedColors.slice(0, 3).map(c => (
                      <span key={c} className="px-2 py-1 bg-white/10 rounded-full text-white/60 text-xs">
                        {c}
                      </span>
                    ))}
                    {selectedSizes.slice(0, 3).map(s => (
                      <span key={s} className="px-2 py-1 bg-white/10 rounded-full text-white/60 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
        <div className="max-w-lg mx-auto">
          {currentStep < 6 ? (
            <button
              onClick={goNext}
              disabled={!canProceed}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                canProceed
                  ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                Keyingi
                <ArrowRightIcon className="w-5 h-5" />
              </span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                isSubmitting || isLoading
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40'
              }`}
            >
              {isSubmitting || isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Joylanyapti...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Icons8Icon name="rocket" size={20} className="opacity-90" />
                  E'lonni joylash
                </span>
              )}
            </button>
          )}
        </div>
      </div>

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
            // Add banner as new photo (at the beginning for prominence)
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
