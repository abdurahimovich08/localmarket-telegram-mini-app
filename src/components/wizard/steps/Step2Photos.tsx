/**
 * Step 2: Photos Upload
 * 
 * Handles:
 * - Photo upload (up to 10)
 * - Image cropping
 * - Banner creator
 * - User hint input (for AI)
 * - Skip AI checkbox
 */

import { PhotoIcon, XMarkIcon, PaintBrushIcon, SparklesIcon, PlusIcon } from '@heroicons/react/24/outline'
import Icons8Icon from '../../Icons8Icon'

interface Step2PhotosProps {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  onPhotoRemove: (index: number) => void
  onPhotoUpload: () => void
  onBannerCreate: (photo: string) => void
  userHint: string
  onUserHintChange: (hint: string) => void
  skipAI: boolean
  onSkipAIChange: (skip: boolean) => void
}

export default function Step2Photos({
  photos,
  onPhotosChange,
  onPhotoRemove,
  onPhotoUpload,
  onBannerCreate,
  userHint,
  onUserHintChange,
  skipAI,
  onSkipAIChange
}: Step2PhotosProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="text-center mb-6">
        <p className="text-white/80 text-sm flex items-center justify-center gap-2">
          <Icons8Icon name="chart" size={16} className="opacity-90" />
          Yaxshi rasmlar = Tez sotish
        </p>
      </div>
      
      {/* Photo grid */}
      {photos.length > 0 && (
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
                  onClick={() => onBannerCreate(photo)}
                  className="p-2 bg-violet-500 rounded-xl hover:bg-violet-600 transition-colors"
                  title="Banner yaratish"
                >
                  <PaintBrushIcon className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => onPhotoRemove(index)}
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
              onClick={onPhotoUpload}
              className="aspect-square rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:border-purple-400 hover:text-purple-400 hover:bg-white/5 transition-all"
            >
              <PlusIcon className="w-8 h-8 mb-1" />
              <span className="text-xs">Qo'shish</span>
            </button>
          )}
        </div>
      )}
      
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
      
      {/* Empty state */}
      {photos.length === 0 && (
        <div 
          onClick={onPhotoUpload}
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
          onChange={(e) => onUserHintChange(e.target.value)}
          placeholder="Masalan: Nike sport kurtka, Adidas futbolka..."
          maxLength={50}
          className="w-full px-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all text-sm"
        />
        <p className="text-white/40 text-xs">Brend yoki model nomini yozing - AI aniqroq to'ldiradi</p>
      </div>

      {/* Skip AI Option */}
      <div className="mt-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="skipAI"
          checked={skipAI}
          onChange={(e) => onSkipAIChange(e.target.checked)}
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
  )
}
