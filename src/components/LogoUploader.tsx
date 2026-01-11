import { useState } from 'react'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import BannerCropper from './BannerCropper'

interface LogoUploaderProps {
  logo: string | null
  onLogoChange: (logo: string | null) => void
  required?: boolean
}

export default function LogoUploader({
  logo,
  onLogoChange,
  required = false
}: LogoUploaderProps) {
  const [logoToCrop, setLogoToCrop] = useState<string | null>(null)

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
        // Logo uchun cropping oynasini ochamiz (1:1 aspect ratio)
        setLogoToCrop(result)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleLogoCrop = (croppedImageDataUrl: string) => {
    onLogoChange(croppedImageDataUrl)
    setLogoToCrop(null)
  }

  const handleLogoCropCancel = () => {
    setLogoToCrop(null)
  }

  const handleRemove = () => {
    onLogoChange(null)
  }

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo {required && '*'}(Kvadrat, 1:1)
        </label>
        {logo ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleImageUpload}
              className="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white rounded-lg text-sm hover:bg-black/90 transition-colors"
            >
              O'zgartirish
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleImageUpload}
            className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
          >
            <PhotoIcon className="w-12 h-12 mb-2" />
            <span className="text-xs">Logo yuklash</span>
          </button>
        )}
      </div>

      {/* Logo Cropper Modal */}
      {logoToCrop && (
        <BannerCropper
          imageSrc={logoToCrop}
          onCrop={handleLogoCrop}
          onCancel={handleLogoCropCancel}
          aspectRatio={1} // 1:1 for square logo
        />
      )}
    </>
  )
}
