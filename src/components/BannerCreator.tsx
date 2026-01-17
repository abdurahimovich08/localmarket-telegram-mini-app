/**
 * 🎨 BannerCreator - Professional Product Banner Generator
 * 
 * Transforms simple product photos into stunning marketing banners
 * Canva-style templates with customization
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  SparklesIcon, 
  PhotoIcon, 
  PaintBrushIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  SwatchIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface BannerCreatorProps {
  productImage: string
  productTitle: string
  productPrice?: number
  productBrand?: string
  onComplete: (bannerUrl: string) => void
  onCancel: () => void
}

// Professional banner templates
const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal',
    preview: '⬜',
    bgStyle: 'bg-gradient-to-br from-slate-50 to-slate-100',
    textColor: 'text-slate-900',
    accentColor: 'bg-slate-900',
    layout: 'center'
  },
  {
    id: 'luxury',
    name: 'Luxury',
    preview: '🖤',
    bgStyle: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    textColor: 'text-white',
    accentColor: 'bg-amber-400',
    layout: 'center'
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    preview: '💜',
    bgStyle: 'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600',
    textColor: 'text-white',
    accentColor: 'bg-white',
    layout: 'center'
  },
  {
    id: 'fresh',
    name: 'Fresh',
    preview: '💚',
    bgStyle: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500',
    textColor: 'text-white',
    accentColor: 'bg-white',
    layout: 'center'
  },
  {
    id: 'warm',
    name: 'Warm',
    preview: '🧡',
    bgStyle: 'bg-gradient-to-br from-orange-400 via-rose-500 to-pink-500',
    textColor: 'text-white',
    accentColor: 'bg-white',
    layout: 'center'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    preview: '💙',
    bgStyle: 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600',
    textColor: 'text-white',
    accentColor: 'bg-white',
    layout: 'center'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    preview: '🌅',
    bgStyle: 'bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500',
    textColor: 'text-white',
    accentColor: 'bg-slate-900',
    layout: 'center'
  },
  {
    id: 'neon',
    name: 'Neon',
    preview: '⚡',
    bgStyle: 'bg-slate-950',
    textColor: 'text-white',
    accentColor: 'bg-cyan-400',
    layout: 'center',
    special: 'neon'
  }
]

// Layout options
const LAYOUTS = [
  { id: 'center', name: 'Markazda', icon: '⬛' },
  { id: 'left', name: 'Chapda', icon: '◀️' },
  { id: 'right', name: 'O\'ngda', icon: '▶️' },
  { id: 'top', name: 'Yuqorida', icon: '🔼' },
]

// Text styles
const TEXT_STYLES = [
  { id: 'none', name: 'Yoʻq' },
  { id: 'title', name: 'Sarlavha' },
  { id: 'price', name: 'Narx' },
  { id: 'both', name: 'Hammasi' },
  { id: 'brand', name: 'Brend + Narx' },
]

export default function BannerCreator({
  productImage,
  productTitle,
  productPrice,
  productBrand,
  onComplete,
  onCancel
}: BannerCreatorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0])
  const [selectedLayout, setSelectedLayout] = useState('center')
  const [textStyle, setTextStyle] = useState('both')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [imageScale, setImageScale] = useState(70)
  const [customBg, setCustomBg] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Generate banner
  const generateBanner = useCallback(async () => {
    setIsProcessing(true)
    
    try {
      // Use html2canvas approach or manual canvas drawing
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size (1:1 ratio for marketplace)
      const size = 1000
      canvas.width = size
      canvas.height = size

      // Draw background
      if (selectedTemplate.special === 'neon') {
        // Neon effect background
        ctx.fillStyle = '#0a0a0a'
        ctx.fillRect(0, 0, size, size)
        
        // Add glow effect
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.1)')
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, size, size)
      } else if (customBg) {
        ctx.fillStyle = customBg
        ctx.fillRect(0, 0, size, size)
      } else {
        // Parse gradient from template
        const gradientColors = getGradientColors(selectedTemplate.bgStyle)
        const gradient = ctx.createLinearGradient(0, 0, size, size)
        gradientColors.forEach((color, index) => {
          gradient.addColorStop(index / (gradientColors.length - 1), color)
        })
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, size, size)
      }

      // Load and draw product image
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // Calculate image dimensions
          const scale = imageScale / 100
          const imgSize = size * scale
          
          let x = (size - imgSize) / 2
          let y = (size - imgSize) / 2

          // Adjust position based on layout
          if (selectedLayout === 'left') x = size * 0.05
          else if (selectedLayout === 'right') x = size - imgSize - size * 0.05
          else if (selectedLayout === 'top') y = size * 0.05

          // Add shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
          ctx.shadowBlur = 30
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 10

          // Draw rounded image
          ctx.save()
          roundedImage(ctx, x, y, imgSize, imgSize, 20)
          ctx.clip()
          ctx.drawImage(img, x, y, imgSize, imgSize)
          ctx.restore()
          
          // Reset shadow
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0

          resolve()
        }
        img.onerror = reject
        img.src = productImage
      })

      // Draw text
      const isLight = selectedTemplate.textColor === 'text-white'
      ctx.fillStyle = isLight ? '#ffffff' : '#1e293b'
      ctx.textAlign = 'center'

      if (textStyle === 'title' || textStyle === 'both') {
        ctx.font = 'bold 48px system-ui, -apple-system, sans-serif'
        ctx.fillText(truncateText(productTitle, 30), size / 2, size - 100)
      }

      if (textStyle === 'price' || textStyle === 'both') {
        ctx.font = 'bold 56px system-ui, -apple-system, sans-serif'
        const priceText = productPrice ? `${productPrice.toLocaleString()} so'm` : ''
        ctx.fillText(priceText, size / 2, size - 40)
      }

      if (textStyle === 'brand' && productBrand) {
        ctx.font = '600 36px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
        ctx.fillText(productBrand.toUpperCase(), size / 2, 60)
        
        ctx.fillStyle = isLight ? '#ffffff' : '#1e293b'
        ctx.font = 'bold 56px system-ui, -apple-system, sans-serif'
        const priceText = productPrice ? `${productPrice.toLocaleString()} so'm` : ''
        ctx.fillText(priceText, size / 2, size - 40)
      }

      // Neon border effect
      if (selectedTemplate.special === 'neon') {
        ctx.strokeStyle = '#06b6d4'
        ctx.lineWidth = 4
        ctx.shadowColor = '#06b6d4'
        ctx.shadowBlur = 20
        roundedRect(ctx, 20, 20, size - 40, size - 40, 30)
        ctx.stroke()
      }

      // Convert to data URL
      const bannerUrl = canvas.toDataURL('image/jpeg', 0.92)
      onComplete(bannerUrl)
      
    } catch (error) {
      console.error('Error generating banner:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedTemplate, selectedLayout, textStyle, imageScale, customBg, productImage, productTitle, productPrice, productBrand, onComplete])

  // Helper functions
  function roundedImage(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  function getGradientColors(bgClass: string): string[] {
    const colorMap: Record<string, string[]> = {
      'from-slate-50 to-slate-100': ['#f8fafc', '#f1f5f9'],
      'from-slate-900 via-slate-800 to-slate-900': ['#0f172a', '#1e293b', '#0f172a'],
      'from-violet-600 via-purple-600 to-fuchsia-600': ['#7c3aed', '#9333ea', '#c026d3'],
      'from-emerald-400 via-teal-500 to-cyan-500': ['#34d399', '#14b8a6', '#06b6d4'],
      'from-orange-400 via-rose-500 to-pink-500': ['#fb923c', '#f43f5e', '#ec4899'],
      'from-blue-400 via-blue-500 to-indigo-600': ['#60a5fa', '#3b82f6', '#4f46e5'],
      'from-amber-300 via-orange-400 to-rose-500': ['#fcd34d', '#fb923c', '#f43f5e'],
    }
    
    for (const [key, colors] of Object.entries(colorMap)) {
      if (bgClass.includes(key.split(' ')[0].replace('from-', ''))) {
        return colors
      }
    }
    return ['#f8fafc', '#e2e8f0']
  }

  function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-violet-400" />
            <h1 className="text-white font-medium">Banner Creator</h1>
          </div>
          <button
            onClick={generateBanner}
            disabled={isProcessing}
            className="px-4 py-2 bg-violet-500 hover:bg-violet-600 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {isProcessing ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              'Yaratish'
            )}
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        
        {/* Preview */}
        <div 
          ref={previewRef}
          className={`relative aspect-square rounded-3xl overflow-hidden shadow-2xl ${selectedTemplate.bgStyle}`}
        >
          {/* Neon effect */}
          {selectedTemplate.special === 'neon' && (
            <div className="absolute inset-4 rounded-2xl border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)]" />
          )}
          
          {/* Product image */}
          <div 
            className={`absolute inset-0 flex items-center justify-center p-8 ${
              selectedLayout === 'left' ? 'justify-start pl-4' :
              selectedLayout === 'right' ? 'justify-end pr-4' :
              selectedLayout === 'top' ? 'items-start pt-4' : ''
            }`}
          >
            <img
              src={productImage}
              alt="Product"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-xl"
              style={{ 
                width: `${imageScale}%`, 
                height: `${imageScale}%`,
                objectFit: 'contain'
              }}
            />
          </div>

          {/* Text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-1">
            {(textStyle === 'brand' && productBrand) && (
              <p className={`text-sm font-medium tracking-[0.2em] uppercase ${selectedTemplate.textColor} opacity-60`}>
                {productBrand}
              </p>
            )}
            {(textStyle === 'title' || textStyle === 'both') && (
              <p className={`text-lg font-bold ${selectedTemplate.textColor}`}>
                {truncateText(productTitle, 40)}
              </p>
            )}
            {(textStyle === 'price' || textStyle === 'both' || textStyle === 'brand') && productPrice && (
              <p className={`text-2xl font-bold ${selectedTemplate.textColor}`}>
                {productPrice.toLocaleString()} so'm
              </p>
            )}
          </div>
        </div>

        {/* Templates */}
        <div className="space-y-3">
          <h3 className="text-white/60 text-sm font-medium tracking-wider uppercase">Shablon</h3>
          <div className="grid grid-cols-4 gap-3">
            {TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                  selectedTemplate.id === template.id
                    ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-950 scale-105'
                    : 'hover:scale-105'
                } ${template.bgStyle}`}
              >
                <span className="text-2xl">{template.preview}</span>
                <span className={`text-xs font-medium ${template.textColor} opacity-80`}>
                  {template.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Customization toggle */}
        <button
          onClick={() => setShowCustomize(!showCustomize)}
          className="w-full flex items-center justify-between py-4 border-t border-b border-white/10"
        >
          <div className="flex items-center gap-3">
            <PaintBrushIcon className="w-5 h-5 text-violet-400" />
            <span className="text-white font-medium">Sozlamalar</span>
          </div>
          <span className={`text-white/40 transition-transform ${showCustomize ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {/* Customization options */}
        {showCustomize && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Image Scale */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Rasm o'lchami</span>
                <span className="text-white text-sm font-medium">{imageScale}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={imageScale}
                onChange={(e) => setImageScale(parseInt(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>

            {/* Layout */}
            <div className="space-y-3">
              <span className="text-white/60 text-sm">Joylashuv</span>
              <div className="flex gap-2">
                {LAYOUTS.map(layout => (
                  <button
                    key={layout.id}
                    onClick={() => setSelectedLayout(layout.id)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      selectedLayout === layout.id
                        ? 'bg-violet-500 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {layout.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Style */}
            <div className="space-y-3">
              <span className="text-white/60 text-sm">Matn</span>
              <div className="flex flex-wrap gap-2">
                {TEXT_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setTextStyle(style.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      textStyle === style.id
                        ? 'bg-violet-500 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pro tip */}
        <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
          <p className="text-violet-300 text-sm">
            💡 <strong>Maslahat:</strong> Luxury yoki Neon shablonlar premium ko'rinish beradi. 
            Matn qo'shish e'lonni qidiruvda topilishini osonlashtiradi.
          </p>
        </div>
      </div>

      {/* Hidden canvas for generation */}
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
