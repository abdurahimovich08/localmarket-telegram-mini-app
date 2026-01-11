import { useRef, useState } from 'react'
import Cropper, { ReactCropperElement } from 'react-cropper'
import 'cropperjs/dist/cropper.css'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface BannerCropperProps {
  imageSrc: string
  onCrop: (croppedImageDataUrl: string) => void
  onCancel: () => void
  aspectRatio?: number
}

export default function BannerCropper({ imageSrc, onCrop, onCancel, aspectRatio = 16 / 9 }: BannerCropperProps) {
  const cropperRef = useRef<ReactCropperElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper
    if (!cropper) return

    setIsProcessing(true)
    
    try {
      // Get cropped canvas
      const canvas = cropper.getCroppedCanvas({
        width: 1200,
        height: 1200 / aspectRatio,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      })

      // Convert to data URL
      const croppedImageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
      
      onCrop(croppedImageDataUrl)
    } catch (error) {
      console.error('Error cropping image:', error)
      alert('Rasmni kesishda xatolik yuz berdi')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Banner kesish</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="flex-1 overflow-auto p-4">
          <div className="relative" style={{ height: '400px', maxHeight: '60vh' }}>
            <Cropper
              ref={cropperRef}
              src={imageSrc}
              style={{ height: '100%', width: '100%' }}
              aspectRatio={aspectRatio}
              viewMode={1}
              dragMode="move"
              guides={true}
              background={true}
              autoCropArea={0.8}
              responsive={true}
              restore={false}
              checkOrientation={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            disabled={isProcessing}
          >
            Bekor qilish
          </button>
          <button
            onClick={handleCrop}
            disabled={isProcessing}
            className="flex-1 py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Kesilmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  )
}
