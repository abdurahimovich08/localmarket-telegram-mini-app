/**
 * Choose Category Unified Page
 * 
 * Shows category selection cards with modern design
 * Clothing uses new wizard, others use existing flow
 */

import { useNavigate, useSearchParams } from 'react-router-dom'
import BackButton from '../components/BackButton'
import { categorySchemas } from '../schemas/categories'
import { CATEGORIES } from '../types'
import { SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

export default function ChooseCategoryUnified() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const entityType = (searchParams.get('entityType') || 'product') as 'product' | 'service'

  // Product categories from existing CATEGORIES enum
  const productCategories = entityType === 'product' 
    ? CATEGORIES.map(cat => ({
        value: cat.value,
        label: cat.label,
        emoji: cat.emoji,
        schema: categorySchemas[cat.value] || null,
        hasWizard: cat.value === 'clothing', // New wizard only for clothing
      }))
    : []

  const handleCategorySelect = (category: string) => {
    if (entityType === 'service') {
      navigate(`/create-service-unified`)
    } else if (category === 'clothing') {
      // Use new beautiful wizard for clothing
      navigate(`/create-clothing`)
    } else {
      // Use existing flow for other categories
      navigate(`/create-unified/chat?entityType=product&category=${category}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/10">
        <div className="flex items-center px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center font-semibold text-white">
            {entityType === 'product' ? '📦 Nima sotmoqchisiz?' : '🛠️ Xizmat Yaratish'}
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="relative z-10 p-4 pb-20">
        <p className="text-white/60 text-sm mb-6 text-center">
          {entityType === 'product' 
            ? 'Kategoriyani tanlang va boshlang'
            : 'Xizmat yaratish uchun bosing'}
        </p>

        {entityType === 'product' ? (
          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
            {productCategories.map((cat) => {
              const hasSchema = !!cat.schema
              const isNew = cat.hasWizard
              
              return (
                <button
                  key={cat.value}
                  onClick={() => handleCategorySelect(cat.value)}
                  disabled={!hasSchema}
                  className={`relative p-4 rounded-2xl border-2 transition-all text-left group ${
                    hasSchema
                      ? 'bg-white/10 border-white/10 hover:border-purple-500 hover:bg-white/15'
                      : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* New badge */}
                  {isNew && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center gap-1">
                      <SparklesIcon className="w-3 h-3 text-white" />
                      <span className="text-white text-xs font-bold">YANGI</span>
                    </div>
                  )}
                  
                  {/* Coming soon badge */}
                  {!hasSchema && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-white/20 rounded-full">
                      <span className="text-white/80 text-xs">Tez orada</span>
                    </div>
                  )}
                  
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    {cat.emoji}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{cat.label}</span>
                    {hasSchema && (
                      <ArrowRightIcon className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => handleCategorySelect('service')}
              className="w-full p-6 bg-white/10 rounded-2xl border-2 border-white/10 hover:border-purple-500 hover:bg-white/15 transition-all text-left flex items-center gap-4 group"
            >
              <div className="text-5xl group-hover:scale-110 transition-transform">🛠️</div>
              <div className="flex-1">
                <div className="font-semibold text-white text-lg">Xizmat Yaratish</div>
                <div className="text-sm text-white/60 mt-1">AI yordamida xizmat e'lonini yarating</div>
              </div>
              <ArrowRightIcon className="w-6 h-6 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        )}

        {/* Info card */}
        <div className="max-w-lg mx-auto mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-start gap-3">
            <SparklesIcon className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">
                Yangi dizayn! ✨
              </p>
              <p className="text-white/50 text-xs">
                Kiyim-kechak kategoriyasida yangi, tez va qulay wizard sinab ko'ring!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
