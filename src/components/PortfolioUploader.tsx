import { useState } from 'react'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import BannerCropper from './BannerCropper'

interface PortfolioUploaderProps {
  portfolio: string[]
  onPortfolioChange: (portfolio: string[]) => void
  maxImages?: number
}

export default function PortfolioUploader({
  portfolio,
  onPortfolioChange,
  maxImages = 4
}: PortfolioUploaderProps) {
  const [imageToCrop, setImageToCrop] = useState<{ dataUrl: string; index: number } | null>(null)

  const handleImageUpload = (index: number) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        // Portfolio uchun cropping oynasini ochamiz (16:9 aspect ratio)
        setImageToCrop({ dataUrl: result, index })
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleImageCrop = (croppedImageDataUrl: string) => {
    if (imageToCrop === null) return

    const newPortfolio = [...portfolio]
    if (imageToCrop.index < newPortfolio.length) {
      // Replace existing image
      newPortfolio[imageToCrop.index] = croppedImageDataUrl
    } else {
      // Add new image
      newPortfolio.push(croppedImageDataUrl)
    }
    onPortfolioChange(newPortfolio.slice(0, maxImages))
    setImageToCrop(null)
  }

  const handleImageCropCancel = () => {
    setImageToCrop(null)
  }

  const handleRemove = (index: number) => {
    const newPortfolio = portfolio.filter((_, i) => i !== index)
    onPortfolioChange(newPortfolio)
  }

  const canAddMore = portfolio.length < maxImages

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Portfolio rasmlari ({portfolio.length}/{maxImages})
        </label>
        <div className="grid grid-cols-2 gap-4">
          {portfolio.map((img, index) => (
            <div key={index} className="relative w-full rounded-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
              <img src={img} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleImageUpload(index)}
                className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white rounded-lg text-xs hover:bg-black/90 transition-colors"
              >
                O'zgartirish
              </button>
            </div>
          ))}
          {canAddMore && (
            <button
              type="button"
              onClick={() => handleImageUpload(portfolio.length)}
              className="w-full rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
              style={{ aspectRatio: '16/9', minHeight: '120px' }}
            >
              <PhotoIcon className="w-8 h-8 mb-2" />
              <span className="text-xs">Rasm qo'shish</span>
            </button>
          )}
        </div>
      </div>

      {/* Portfolio Image Cropper Modal */}
      {imageToCrop && (
        <BannerCropper
          imageSrc={imageToCrop.dataUrl}
          onCrop={handleImageCrop}
          onCancel={handleImageCropCancel}
          aspectRatio={16 / 9} // 16:9 for portfolio images
        />
      )}
    </>
  )
}
