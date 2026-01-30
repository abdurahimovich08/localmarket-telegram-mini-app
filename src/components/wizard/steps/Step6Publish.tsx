/**
 * Step 6: Publish
 * 
 * Handles:
 * - Review summary
 * - Preview card
 * - Submit button (handled by parent)
 */

import { RocketLaunchIcon } from '@heroicons/react/24/outline'
import Icons8Icon from '../../Icons8Icon'

interface FormData {
  title: string
  description: string
  price: string
  originalPrice: string
  hasDiscount: boolean
  brand: string | null
  material: string | null
  condition: 'yangi' | 'yangi_kabi' | 'yaxshi' | 'o\'rtacha'
}

interface Step6PublishProps {
  formData: FormData
  photos: string[]
  selectedColors: string[]
  selectedSizes: string[]
  parsePrice: (price: string) => number
}

export default function Step6Publish({
  formData,
  photos,
  selectedColors,
  selectedSizes,
  parsePrice
}: Step6PublishProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
          <RocketLaunchIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Tayyor!</h2>
        <p className="text-white/60">E'loningiz joylashga tayyor</p>
      </div>

      {/* Preview card */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl overflow-hidden border border-slate-700/50">
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
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
        <h4 className="text-white font-medium text-sm mb-3">Ma'lumotlar:</h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Rasmlar:</span>
            <span className="text-white">{photos.length} ta</span>
          </div>
          
          {formData.brand && (
            <div className="flex justify-between">
              <span className="text-white/60">Brend:</span>
              <span className="text-white">{formData.brand}</span>
            </div>
          )}
          
          {formData.material && (
            <div className="flex justify-between">
              <span className="text-white/60">Material:</span>
              <span className="text-white">{formData.material}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-white/60">Holati:</span>
            <span className="text-white">
              {formData.condition === 'yangi' ? 'Yangi' :
               formData.condition === 'yangi_kabi' ? 'Yangi kabi' :
               formData.condition === 'yaxshi' ? 'Yaxshi' : 'O\'rtacha'}
            </span>
          </div>
          
          {selectedColors.length > 0 && (
            <div className="flex justify-between">
              <span className="text-white/60">Ranglar:</span>
              <span className="text-white">{selectedColors.length} ta</span>
            </div>
          )}
          
          {selectedSizes.length > 0 && (
            <div className="flex justify-between">
              <span className="text-white/60">O'lchamlar:</span>
              <span className="text-white">{selectedSizes.length} ta</span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
        <p className="text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
          <Icons8Icon name="info" size={16} className="opacity-90" />
          Eslatma
        </p>
        <p className="text-white/60 text-xs">
          E'lon joylangandan so'ng, uni boshqarish va tahrirlash imkoniyati bo'ladi.
        </p>
      </div>
    </div>
  )
}
