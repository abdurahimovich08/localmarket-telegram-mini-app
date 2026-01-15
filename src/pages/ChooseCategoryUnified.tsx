/**
 * Choose Category Unified Page
 * 
 * Shows category selection cards for unified AI creation
 */

import { useNavigate, useSearchParams } from 'react-router-dom'
import BackButton from '../components/BackButton'
import { categorySchemas } from '../schemas/categories'
import { CATEGORIES } from '../types'

export default function ChooseCategoryUnified() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const entityType = (searchParams.get('entityType') || 'product') as 'product' | 'service'

  // Filter categories by entity type
  const availableCategories = Object.values(categorySchemas).filter(
    schema => schema.entityType === entityType
  )

  // Product categories from existing CATEGORIES enum
  const productCategories = entityType === 'product' 
    ? CATEGORIES.map(cat => ({
        value: cat.value,
        label: cat.label,
        emoji: cat.emoji,
        schema: categorySchemas[cat.value] || null,
      }))
    : []

  const handleCategorySelect = (category: string) => {
    if (entityType === 'service') {
      navigate(`/create-service-unified`)
    } else {
      navigate(`/create-unified/chat?entityType=product&category=${category}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center font-semibold text-gray-900">
            {entityType === 'product' ? 'Mahsulot Kategoriyasi' : 'Xizmat Yaratish'}
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="p-4">
        <p className="text-sm text-gray-600 mb-4">
          {entityType === 'product' 
            ? 'Qanday mahsulot sotmoqchisiz? Kategoriyani tanlang:'
            : 'Xizmat yaratish uchun bosing:'}
        </p>

        {entityType === 'product' ? (
          <div className="grid grid-cols-2 gap-3">
            {productCategories
              .filter(cat => cat.schema) // Only show categories with schemas
              .map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategorySelect(cat.value)}
                  className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="text-3xl mb-2">{cat.emoji}</div>
                  <div className="font-medium text-gray-900">{cat.label}</div>
                </button>
              ))}
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => handleCategorySelect('service')}
              className="w-full p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors text-left flex items-center gap-4"
            >
              <div className="text-4xl">🛠️</div>
              <div>
                <div className="font-medium text-gray-900 text-lg">Xizmat Yaratish</div>
                <div className="text-sm text-gray-500 mt-1">AI yordamida xizmat e'lonini yarating</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
