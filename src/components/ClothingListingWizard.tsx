/**
 * ClothingListingWizard - Modern Step-by-Step Listing Creator
 * 
 * Beautiful, fast, and intuitive clothing listing creation
 * Designed for mobile-first with "wow" factor
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { uploadImages } from '../lib/imageUpload'
import { compressDataUrls } from '../lib/imageCompression'
import { useEntityMutations } from '../hooks/useEntityMutations'
import BannerCropper from './BannerCropper'
import BannerCreator from './BannerCreator'
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
  PaintBrushIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { CLOTHING_TAXONOMY, TaxonNode, Audience, Segment } from '../taxonomy/clothing.uz'
import { buildTagsFromSelection } from '../taxonomy/clothing.utils'

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

// Step definitions
const STEPS: WizardStep[] = [
  { 
    id: 1, 
    key: 'taxonomy', 
    title: 'Kategoriya', 
    subtitle: 'Mahsulot turini tanlang',
    icon: <TagIcon className="w-6 h-6" />,
    emoji: '🏷️'
  },
  { 
    id: 2, 
    key: 'photos', 
    title: 'Rasmlar', 
    subtitle: 'Eng yaxshi rasmlarni yuklang',
    icon: <PhotoIcon className="w-6 h-6" />,
    emoji: '📸'
  },
  { 
    id: 3, 
    key: 'details', 
    title: 'Ma\'lumotlar', 
    subtitle: 'Mahsulot haqida',
    icon: <SparklesIcon className="w-6 h-6" />,
    emoji: '✨'
  },
  { 
    id: 4, 
    key: 'price', 
    title: 'Narx', 
    subtitle: 'Narxni belgilang',
    icon: <CurrencyDollarIcon className="w-6 h-6" />,
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
    icon: <RocketLaunchIcon className="w-6 h-6" />,
    emoji: '🚀'
  }
]

// Audience options with emojis
const AUDIENCE_OPTIONS: { value: Audience; label: string; emoji: string }[] = [
  { value: 'erkaklar', label: 'Erkaklar', emoji: '👨' },
  { value: 'ayollar', label: 'Ayollar', emoji: '👩' },
  { value: 'bolalar', label: 'Bolalar', emoji: '👶' },
  { value: 'unisex', label: 'Unisex', emoji: '👥' },
]

// Segment options with emojis
const SEGMENT_OPTIONS: { value: Segment; label: string; emoji: string }[] = [
  { value: 'kiyim', label: 'Kiyim', emoji: '👕' },
  { value: 'oyoq_kiyim', label: 'Oyoq kiyim', emoji: '👟' },
  { value: 'aksessuar', label: 'Aksessuar', emoji: '👜' },
  { value: 'ichki_kiyim', label: 'Ichki kiyim', emoji: '🩲' },
  { value: 'sport', label: 'Sport kiyim', emoji: '🏃' },
  { value: 'milliy', label: 'Milliy kiyim', emoji: '🎎' },
]

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

// Condition options
const CONDITIONS = [
  { value: 'yangi', label: 'Yangi', emoji: '✨', description: 'Hech ishlatilmagan' },
  { value: 'yangi_kabi', label: 'Yangi kabi', emoji: '👌', description: '1-2 marta kiyilgan' },
  { value: 'yaxshi', label: 'Yaxshi', emoji: '👍', description: 'Yaxshi holatda' },
  { value: 'o\'rtacha', label: 'O\'rtacha', emoji: '🤏', description: 'Ishlatilgan' },
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
  
  // Get available segments for selected audience
  const availableSegments = useMemo(() => {
    if (!selectedAudience) return []
    const segments = new Set<Segment>()
    CLOTHING_TAXONOMY.filter(t => t.audience === selectedAudience).forEach(t => segments.add(t.segment))
    return SEGMENT_OPTIONS.filter(s => segments.has(s.value))
  }, [selectedAudience])
  
  // Get available items for selected audience + segment
  const availableItems = useMemo(() => {
    if (!selectedAudience || !selectedSegment) return []
    return CLOTHING_TAXONOMY.filter(
      t => t.audience === selectedAudience && t.segment === selectedSegment && t.leaf
    )
  }, [selectedAudience, selectedSegment])
  
  // Form data
  const [photos, setPhotos] = useState<string[]>([])
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [showBannerCreator, setShowBannerCreator] = useState(false)
  const [imageForBanner, setImageForBanner] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
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
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
      case 5: return selectedColors.length > 0 && selectedSizes.length > 0
      case 6: return true
      default: return false
    }
  }, [photos, formData, selectedColors, selectedSizes, selectedTaxonomy])

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

  // Submit listing
  const handleSubmit = async () => {
    if (!user) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Compress and upload images
      const compressedFiles = await compressDataUrls(photos, {}, 'listing')
      const photoUrls = await uploadImages(compressedFiles)
      
      // Build attributes
      const attributes: Record<string, any> = {
        brand: formData.brand,
        material: formData.material,
        colors: selectedColors,
        sizes: selectedSizes,
        stock_by_size_color: stockByVariant,
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
        seller_telegram_id: user.telegram_user_id,
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
      setError(err.message || 'Xatolik yuz berdi')
      setIsSubmitting(false)
    }
  }

  // Navigate between steps
  const goNext = () => {
    if (canProceed && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
    }
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
            <h1 className="text-white font-semibold text-lg">
              {STEPS[currentStep - 1].emoji} {STEPS[currentStep - 1].title}
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
                  <span className="text-lg">{step.emoji}</span>
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
                <p className="text-white/80 text-sm">
                  To'g'ri kategoriya = Tez topilish 🎯
                </p>
              </div>
              
              {/* Step 1.1: Audience Selection */}
              {!selectedAudience && (
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
                        className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:border-purple-400 hover:bg-white/20 transition-all flex flex-col items-center gap-2"
                      >
                        <span className="text-4xl">{option.emoji}</span>
                        <span className="text-white font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Step 1.2: Segment Selection */}
              {selectedAudience && !selectedSegment && (
                <div className="space-y-3">
                  <button 
                    onClick={() => setSelectedAudience(null)}
                    className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    {AUDIENCE_OPTIONS.find(a => a.value === selectedAudience)?.label}
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
                        className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:border-purple-400 hover:bg-white/20 transition-all flex flex-col items-center gap-2"
                      >
                        <span className="text-3xl">{option.emoji}</span>
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
                    onClick={() => setSelectedSegment(null)}
                    className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    {SEGMENT_OPTIONS.find(s => s.value === selectedSegment)?.label}
                  </button>
                  
                  <p className="text-white/60 text-sm text-center mb-4">Aniq turini tanlang</p>
                  <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pb-4">
                    {availableItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedTaxonomy(item)}
                        className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:border-purple-400 hover:bg-white/20 transition-all text-left"
                      >
                        <span className="text-white font-medium text-sm">{item.labelUz}</span>
                        {item.synonymsUz && item.synonymsUz.length > 0 && (
                          <p className="text-white/40 text-xs mt-1 truncate">
                            {item.synonymsUz.slice(0, 2).join(', ')}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Selected Taxonomy Display */}
              {selectedTaxonomy && (
                <div className="space-y-4">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <CheckIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{selectedTaxonomy.labelUz}</p>
                          <p className="text-white/60 text-xs">{selectedTaxonomy.pathUz}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTaxonomy(null)
                          setSelectedSegment(null)
                          setSelectedAudience(null)
                        }}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5 text-white/60" />
                      </button>
                    </div>
                    
                    {/* Quick info */}
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs">
                        {AUDIENCE_OPTIONS.find(a => a.value === selectedTaxonomy.audience)?.emoji} {AUDIENCE_OPTIONS.find(a => a.value === selectedTaxonomy.audience)?.label}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs">
                        {SEGMENT_OPTIONS.find(s => s.value === selectedTaxonomy.segment)?.emoji} {SEGMENT_OPTIONS.find(s => s.value === selectedTaxonomy.segment)?.label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Info about why this matters */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-white/80 text-sm font-medium mb-2">✨ Nima uchun muhim?</p>
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
                <p className="text-white/80 text-sm">
                  Yaxshi rasmlar = Tez sotish 📈
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
              
              {/* Tips */}
              <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-white/80 text-sm font-medium mb-2">💡 Maslahatlar:</p>
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
              {/* Title */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">
                  Sarlavha *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={selectedTaxonomy ? `Masalan: Nike ${selectedTaxonomy.labelUz.toLowerCase()}` : "Sarlavha kiriting"}
                  maxLength={80}
                  className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <p className="text-white/40 text-xs text-right">{formData.title.length}/80</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">
                  Tavsif *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mahsulot haqida batafsil yozing..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                />
                <p className="text-white/40 text-xs text-right">{formData.description.length}/500</p>
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">
                  Brend
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="Masalan: Nike, Adidas, Zara"
                  className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Material */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">
                  Material
                </label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                  placeholder="Masalan: Paxta, Teri, Poliester"
                  className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Condition */}
              <div className="space-y-3">
                <label className="text-white/80 text-sm font-medium">
                  Holati *
                </label>
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
                      <span className="text-2xl block mb-1">{cond.emoji}</span>
                      <span className="text-white font-medium text-sm">{cond.label}</span>
                      <span className="text-white/50 text-xs block">{cond.description}</span>
                    </button>
                  ))}
                </div>
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
                <span className="text-white font-medium">🤝 Narxni savdolashish mumkin</span>
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
                <span className="text-white font-medium">⚡ Aksiya qo'shish</span>
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
                      <p className="text-green-400 text-sm font-medium">
                        🎉 Chegirma: {Math.round((1 - parsePrice(formData.price) / parsePrice(formData.originalPrice)) * 100)}%
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
                
                {/* Selected colors */}
                {selectedColors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedColors.map(color => (
                      <span
                        key={color}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/30 text-purple-200 rounded-full text-sm"
                      >
                        {color}
                        <button
                          onClick={() => toggleColor(color)}
                          className="hover:text-white"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
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
          {currentStep < 5 ? (
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
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                isSubmitting
                  ? 'bg-white/10 text-white/40'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Joylanyapti...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🚀 E'lonni joylash
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
