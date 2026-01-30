/**
 * Step 5: Variants
 * 
 * Handles:
 * - Color selection (preset + custom)
 * - Size selection (letter/number)
 * - Stock management per variant
 * - Photos by color
 */

import { useState } from 'react'
import { XMarkIcon, PlusIcon, CameraIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import Icons8Icon from '../../Icons8Icon'

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

const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const NUMBER_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48']

interface Step5VariantsProps {
  selectedColors: string[]
  onColorsChange: (colors: string[]) => void
  selectedSizes: string[]
  onSizesChange: (sizes: string[]) => void
  sizeType: 'letter' | 'number'
  onSizeTypeChange: (type: 'letter' | 'number') => void
  stockByVariant: Record<string, number>
  onStockChange: (color: string, size: string, qty: number) => void
  photosByColor: Record<string, string[]>
  onPhotosByColorChange: (color: string, photos: string[]) => void
}

export default function Step5Variants({
  selectedColors,
  onColorsChange,
  selectedSizes,
  onSizesChange,
  sizeType,
  onSizeTypeChange,
  stockByVariant,
  onStockChange,
  photosByColor,
  onPhotosByColorChange
}: Step5VariantsProps) {
  const [customColor, setCustomColor] = useState('')
  
  const toggleColor = (color: string) => {
    if (selectedColors.includes(color)) {
      onColorsChange(selectedColors.filter(c => c !== color))
      // Remove photos for this color
      onPhotosByColorChange(color, [])
    } else {
      onColorsChange([...selectedColors, color])
    }
  }
  
  const addCustomColor = () => {
    if (customColor.trim() && !selectedColors.includes(customColor.trim())) {
      onColorsChange([...selectedColors, customColor.trim()])
      setCustomColor('')
    }
  }
  
  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      onSizesChange(selectedSizes.filter(s => s !== size))
      // Remove stock for this size
      selectedColors.forEach(color => {
        const key = `${size}_${color}`
        if (stockByVariant[key]) {
          onStockChange(color, size, 0)
        }
      })
    } else {
      onSizesChange([...selectedSizes, size])
    }
  }
  
  const handlePhotoUpload = (color: string, files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const currentPhotos = photosByColor[color] || []
        onPhotosByColorChange(color, [...currentPhotos, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }
  
  const removePhoto = (color: string, index: number) => {
    const currentPhotos = photosByColor[color] || []
    onPhotosByColorChange(color, currentPhotos.filter((_, i) => i !== index))
  }
  
  return (
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
                  : 'border-slate-700/50 bg-slate-800/60 hover:border-white/20'
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
            className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all"
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
                  className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 space-y-3"
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
                          onClick={() => removePhoto(color, idx)}
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
                        onChange={(e) => handlePhotoUpload(color, e.target.files)}
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
              onClick={() => onSizeTypeChange('letter')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                sizeType === 'letter'
                  ? 'bg-purple-500 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              S, M, L
            </button>
            <button
              onClick={() => onSizeTypeChange('number')}
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
              className={`px-4 py-2 rounded-xl border-2 transition-all ${
                selectedSizes.includes(size)
                  ? 'border-purple-500 bg-purple-500/20 text-white'
                  : 'border-slate-700/50 bg-slate-800/60 text-white/60 hover:border-white/20'
              }`}
            >
              {size}
              {selectedSizes.includes(size) && (
                <CheckCircleIcon className="w-4 h-4 text-purple-400 inline-block ml-2" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Management */}
      {selectedColors.length > 0 && selectedSizes.length > 0 && (
        <div className="space-y-4">
          <label className="text-white/80 text-sm font-medium">
            Ombordagi miqdor (har bir variant uchun)
          </label>
          <div className="space-y-3 max-h-[40vh] overflow-y-auto">
            {selectedColors.map(color => (
              <div key={color} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: PRESET_COLORS.find(c => c.name === color)?.hex || '#888' }}
                  />
                  <span className="text-white/80 text-sm font-medium">{color}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-6">
                  {selectedSizes.map(size => {
                    const key = `${size}_${color}`
                    const qty = stockByVariant[key] || 0
                    return (
                      <div key={size} className="flex items-center gap-2">
                        <span className="text-white/60 text-xs w-8">{size}</span>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) => onStockChange(color, size, parseInt(e.target.value) || 0)}
                          className="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedColors.length > 0 && selectedSizes.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <p className="text-white/80 text-sm font-medium mb-2">
            Jami variantlar: {selectedColors.length * selectedSizes.length} ta
          </p>
          <p className="text-white/60 text-xs">
            Jami ombordagi miqdor: {Object.values(stockByVariant).reduce((sum, qty) => sum + qty, 0)} dona
          </p>
        </div>
      )}
    </div>
  )
}
