/**
 * WriteReviewModal - Sharx yozish modali
 * 
 * Features:
 * - 5 yulduzli reyting
 * - 5 tagacha rasm yuklash
 * - Sharx matni
 * - Variant (size/color) ko'rsatish
 * - Animatsiyalar
 */

import { useState, useRef } from 'react'
import { XMarkIcon, StarIcon, CameraIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { compressDataUrls } from '../../lib/imageCompression'
import { uploadImages } from '../../lib/imageUpload'

interface WriteReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (review: {
    rating: number
    text: string
    photos: string[]
    purchasedSize?: string
    purchasedColor?: string
  }) => Promise<void>
  listingTitle: string
  listingPhoto?: string
  purchasedSize?: string
  purchasedColor?: string
}

const RATING_LABELS = [
  { value: 1, label: 'Yomon', emoji: '😞' },
  { value: 2, label: 'Qoniqarsiz', emoji: '😕' },
  { value: 3, label: 'Yaxshi', emoji: '😊' },
  { value: 4, label: 'Juda yaxshi', emoji: '😃' },
  { value: 5, label: 'Ajoyib!', emoji: '🤩' },
]

const QUICK_TAGS = [
  'Sifatli mahsulot',
  'Tez yetkazib berildi',
  'Rasmga mos',
  'Narxiga arziydi',
  'Yaxshi sotuvchi',
  'Tavsiya qilaman',
]

export default function WriteReviewModal({
  isOpen,
  onClose,
  onSubmit,
  listingTitle,
  listingPhoto,
  purchasedSize,
  purchasedColor,
}: WriteReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const currentRating = hoverRating || rating
  const ratingLabel = RATING_LABELS.find(r => r.value === currentRating)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || photos.length >= 5) return

    setUploadingPhotos(true)
    
    const newPhotos: string[] = []
    const remainingSlots = 5 - photos.length
    
    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i]
      const reader = new FileReader()
      
      await new Promise<void>((resolve) => {
        reader.onload = (e) => {
          newPhotos.push(e.target?.result as string)
          resolve()
        }
        reader.readAsDataURL(file)
      })
    }
    
    setPhotos(prev => [...prev, ...newPhotos])
    setUploadingPhotos(false)
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    
    setIsSubmitting(true)
    
    try {
      // Upload photos if any
      let uploadedPhotoUrls: string[] = []
      if (photos.length > 0) {
        const compressedPhotos = await compressDataUrls(photos, {}, 'review')
        uploadedPhotoUrls = await uploadImages(compressedPhotos)
      }
      
      // Combine text with selected tags
      const fullText = selectedTags.length > 0 
        ? `${reviewText}\n\n${selectedTags.map(t => `#${t.replace(/\s+/g, '')}`).join(' ')}`
        : reviewText
      
      await onSubmit({
        rating,
        text: fullText,
        photos: uploadedPhotoUrls,
        purchasedSize,
        purchasedColor,
      })
      
      onClose()
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10">
                {listingPhoto ? (
                  <img src={listingPhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">📦</div>
                )}
              </div>
              <div>
                <h2 className="text-white font-semibold">Sharx yozing</h2>
                <p className="text-white/50 text-xs truncate max-w-[200px]">{listingTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-5 space-y-6">
          
          {/* Variant info */}
          {(purchasedSize || purchasedColor) && (
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <span>Sotib olingan:</span>
              {purchasedColor && (
                <span className="px-2 py-1 bg-white/10 rounded-lg">{purchasedColor}</span>
              )}
              {purchasedSize && (
                <span className="px-2 py-1 bg-white/10 rounded-lg">{purchasedSize}</span>
              )}
            </div>
          )}

          {/* Star Rating */}
          <div className="text-center space-y-3">
            <p className="text-white/60 text-sm">Mahsulotni baholang</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  {star <= currentRating ? (
                    <StarIconSolid className={`w-10 h-10 transition-colors ${
                      currentRating >= 4 ? 'text-yellow-400' :
                      currentRating >= 3 ? 'text-amber-400' :
                      currentRating >= 2 ? 'text-orange-400' :
                      'text-red-400'
                    }`} />
                  ) : (
                    <StarIcon className="w-10 h-10 text-white/20" />
                  )}
                </button>
              ))}
            </div>
            {ratingLabel && (
              <div className="flex items-center justify-center gap-2 animate-fadeIn">
                <span className="text-2xl">{ratingLabel.emoji}</span>
                <span className={`font-semibold ${
                  currentRating >= 4 ? 'text-yellow-400' :
                  currentRating >= 3 ? 'text-amber-400' :
                  currentRating >= 2 ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {ratingLabel.label}
                </span>
              </div>
            )}
          </div>

          {/* Quick Tags */}
          <div className="space-y-2">
            <p className="text-white/60 text-sm">Tezkor teglar</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-violet-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <p className="text-white/60 text-sm">Sharxingiz</p>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Mahsulot haqida fikringizni yozing... (ixtiyoriy)"
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
            <p className="text-white/30 text-xs text-right">{reviewText.length}/500</p>
          </div>

          {/* Photo Upload */}
          <div className="space-y-3">
            <p className="text-white/60 text-sm">Rasmlar qo'shing (5 tagacha)</p>
            
            <div className="flex gap-2 flex-wrap">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Review photo ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XMarkIcon className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              
              {photos.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhotos}
                  className="w-20 h-20 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-violet-500 hover:bg-violet-500/10 transition-all disabled:opacity-50"
                >
                  {uploadingPhotos ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CameraIcon className="w-6 h-6 text-white/40" />
                      <span className="text-white/40 text-xs">Rasm</span>
                    </>
                  )}
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-5">
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
              rating > 0
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 active:scale-[0.98]'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Yuklanmoqda...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Sharxni joylash
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
