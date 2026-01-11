import { useState } from 'react'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import BannerCropper from './BannerCropper'

interface StoreBannerUploaderProps {
  banner: string | null
  onBannerChange: (banner: string | null) => void
  required?: boolean
}

export default function StoreBannerUploader({
  banner,
  onBannerChange,
  required = false
}: StoreBannerUploaderProps) {
  const [bannerToCrop, setBannerToCrop] = useState<string | null>(null)

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        // Banner uchun cropping oynasini ochamiz
        setBannerToCrop(result)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleBannerCrop = (croppedImageDataUrl: string) => {
    onBannerChange(croppedImageDataUrl)
    setBannerToCrop(null)
  }

  const handleBannerCropCancel = () => {
    setBannerToCrop(null)
  }

  const handleRemove = () => {
    onBannerChange(null)
  }

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Banner {required && '*'}(16:9 nisbat)
        </label>
        {banner ? (
          <div className="relative w-full rounded-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
            <img src={banner} alt="Banner" className="w-full h-full object-cover" />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleImageUpload}
              className="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white rounded-lg text-sm hover:bg-black/90 transition-colors"
            >
              O'zgartirish
            </button>
          </div>
        ) : (
          <button
            onClick={handleImageUpload}
            className="w-full rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
            style={{ aspectRatio: '16/9', minHeight: '120px' }}
          >
            <PhotoIcon className="w-12 h-12 mb-2" />
            <span className="text-sm">Banner yuklash</span>
          </button>
        )}
      </div>

      {/* Banner Cropper Modal */}
      {bannerToCrop && (
        <BannerCropper
          imageSrc={bannerToCrop}
          onCrop={handleBannerCrop}
          onCancel={handleBannerCropCancel}
          aspectRatio={16 / 9}
        />
      )}
    </>
  )
}
