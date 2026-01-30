/**
 * Step 3: Details
 * 
 * Handles:
 * - AI auto-fill integration
 * - Title, Description, Brand, Material inputs
 * - Condition selection
 * - Skeleton loaders during AI generation
 */

import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import Icons8Icon from '../../Icons8Icon'
import { TaxonNode } from '../../../taxonomy/clothing.uz'

interface FormData {
  title: string
  description: string
  brand: string | null
  material: string | null
  condition: 'yangi' | 'yangi_kabi' | 'yaxshi' | 'o\'rtacha'
}

interface ConditionOption {
  value: 'yangi' | 'yangi_kabi' | 'yaxshi' | 'o\'rtacha'
  label: string
  description: string
  iconName?: keyof typeof import('../../../utils/icons8').Icons8
}

const CONDITIONS: ConditionOption[] = [
  { value: 'yangi', label: 'Yangi', description: 'Hech ishlatilmagan', iconName: 'new' },
  { value: 'yangi_kabi', label: 'Yangi kabi', description: '1-2 marta kiyilgan', iconName: 'product' },
  { value: 'yaxshi', label: 'Yaxshi', description: 'Yaxshi holatda', iconName: 'product' },
  { value: 'o\'rtacha', label: 'O\'rtacha', description: 'Ishlatilgan', iconName: 'product' },
]

interface Step3DetailsProps {
  formData: FormData
  onFormDataChange: (data: Partial<FormData>) => void
  selectedTaxonomy: TaxonNode | null
  isGeneratingAI: boolean
  aiError: string | null
  aiGenerated: boolean
  onAIGenerate: () => void
  onAIErrorDismiss: () => void
}

export default function Step3Details({
  formData,
  onFormDataChange,
  selectedTaxonomy,
  isGeneratingAI,
  aiError,
  aiGenerated,
  onAIGenerate,
  onAIErrorDismiss
}: Step3DetailsProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* AI Status Banner */}
      {isGeneratingAI && (
        <div className="p-4 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
          <p className="text-white/90 text-sm">AI ma'lumotlarni generatsiya qilmoqda...</p>
        </div>
      )}
      
      {aiError && (
        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
            <p className="text-white/90 text-sm">{aiError}</p>
          </div>
          <button
            onClick={onAIErrorDismiss}
            className="text-red-400 hover:text-red-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {aiGenerated && !isGeneratingAI && (
        <div className="p-4 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-green-400" />
          <p className="text-white/90 text-sm">AI to'ldirildi - kerak bo'lsa tahrirlashingiz mumkin</p>
        </div>
      )}

      {/* Manual AI Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-white/80 text-sm font-medium mb-1">AI yordamida to'ldirish</p>
          <p className="text-white/50 text-xs">Rasmlar va kategoriya asosida avtomatik to'ldirish</p>
        </div>
        <button
          onClick={onAIGenerate}
          disabled={isGeneratingAI || !selectedTaxonomy}
          className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
            isGeneratingAI || !selectedTaxonomy
              ? 'bg-white/5 text-white/30 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 active:scale-95'
          }`}
        >
          {isGeneratingAI ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Kutilmoqda...</span>
            </>
          ) : (
            <>
              <Icons8Icon name="sparkles" size={18} className="opacity-90" />
              <span>AI to'ldirish</span>
            </>
          )}
        </button>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label className="text-white/80 text-sm font-medium flex items-center gap-2">
          Sarlavha *
          {isGeneratingAI && (
            <span className="text-xs text-white/50">(AI generatsiya qilmoqda...)</span>
          )}
        </label>
        {isGeneratingAI && !formData.title ? (
          <div className="w-full h-14 bg-white/5 rounded-2xl animate-pulse"></div>
        ) : (
          <>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onFormDataChange({ title: e.target.value })}
              placeholder={selectedTaxonomy ? `Masalan: Nike ${selectedTaxonomy.labelUz.toLowerCase()}` : "Sarlavha kiriting"}
              maxLength={80}
              disabled={isGeneratingAI}
              className="w-full px-4 py-4 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all disabled:opacity-50"
            />
            <p className="text-white/40 text-xs text-right">{formData.title.length}/80</p>
          </>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-white/80 text-sm font-medium flex items-center gap-2">
          Tavsif *
          {isGeneratingAI && (
            <span className="text-xs text-white/50">(AI generatsiya qilmoqda...)</span>
          )}
        </label>
        {isGeneratingAI && !formData.description ? (
          <div className="w-full h-32 bg-white/5 rounded-2xl animate-pulse"></div>
        ) : (
          <>
            <textarea
              value={formData.description}
              onChange={(e) => onFormDataChange({ description: e.target.value })}
              placeholder="Mahsulot haqida batafsil yozing..."
              rows={4}
              maxLength={500}
              disabled={isGeneratingAI}
              className="w-full px-4 py-4 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all resize-none disabled:opacity-50"
            />
            <p className="text-white/40 text-xs text-right">{formData.description.length}/500</p>
          </>
        )}
      </div>

      {/* Brand */}
      <div className="space-y-2">
        <label className="text-white/80 text-sm font-medium">
          Brend <span className="text-white/40 text-xs">(ixtiyoriy)</span>
        </label>
        {isGeneratingAI && !formData.brand ? (
          <div className="w-full h-14 bg-white/5 rounded-2xl animate-pulse"></div>
        ) : (
          <>
            <input
              type="text"
              value={formData.brand || ''}
              onChange={(e) => onFormDataChange({ brand: e.target.value || null })}
              placeholder={formData.brand ? "Masalan: Nike, Adidas, Zara" : "Aniqlanmadi (ixtiyoriy)"}
              disabled={isGeneratingAI}
              className="w-full px-4 py-4 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all disabled:opacity-50"
            />
            {!formData.brand && (
              <p className="text-white/50 text-xs">Brendni yozsangiz tezroq sotiladi</p>
            )}
          </>
        )}
      </div>

      {/* Material */}
      <div className="space-y-2">
        <label className="text-white/80 text-sm font-medium">
          Material <span className="text-white/40 text-xs">(ixtiyoriy)</span>
        </label>
        {isGeneratingAI && !formData.material ? (
          <div className="w-full h-14 bg-white/5 rounded-2xl animate-pulse"></div>
        ) : (
          <>
            <input
              type="text"
              value={formData.material || ''}
              onChange={(e) => onFormDataChange({ material: e.target.value || null })}
              placeholder={formData.material ? "Masalan: Paxta, Teri, Poliester" : "Aniqlanmadi (ixtiyoriy)"}
              disabled={isGeneratingAI}
              className="w-full px-4 py-4 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all disabled:opacity-50"
            />
            {!formData.material && (
              <p className="text-white/50 text-xs">Materialni ko'rsatsangiz xaridorlar ishonchliroq</p>
            )}
          </>
        )}
      </div>

      {/* Condition */}
      <div className="space-y-3">
        <label className="text-white/80 text-sm font-medium flex items-center gap-2">
          Holati *
          {isGeneratingAI && formData.condition === 'yangi' && (
            <span className="text-xs text-white/50">(AI aniqlayapti...)</span>
          )}
        </label>
        {isGeneratingAI && formData.condition === 'yangi' ? (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-white/60 text-sm text-center">AI holatni aniqlayapti...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {CONDITIONS.map(cond => (
                <button
                  key={cond.value}
                  onClick={() => onFormDataChange({ condition: cond.value })}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    formData.condition === cond.value
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-slate-700/50 bg-slate-800/60 hover:border-white/20'
                  }`}
                >
                  {cond.iconName ? (
                    <div className="mb-1 flex items-center justify-center">
                      <Icons8Icon name={cond.iconName} size={24} className="opacity-90" />
                    </div>
                  ) : null}
                  <span className="text-white font-medium text-sm block">{cond.label}</span>
                  <span className="text-white/50 text-xs block">{cond.description}</span>
                </button>
              ))}
            </div>
            {formData.condition === 'yangi' && aiGenerated && (
              <p className="text-white/50 text-xs text-center">
                AI aniqlay olmadi - o'zingiz tanlang
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
