import React, { useState } from 'react'
import { 
  FunnelIcon, 
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { CATEGORIES, CONDITIONS, type ListingCategory, type ListingCondition } from '../types'

export interface SearchFilters {
  category?: ListingCategory
  minPrice?: number
  maxPrice?: number
  condition?: ListingCondition
  radius?: number // in miles
  recentOnly?: boolean // only listings from last 7 days
  boostedOnly?: boolean // only boosted listings
}

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
}

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
]

export default function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters)

  const activeFiltersCount = 
    (localFilters.category ? 1 : 0) +
    (localFilters.minPrice || localFilters.maxPrice ? 1 : 0) +
    (localFilters.condition ? 1 : 0) +
    (localFilters.radius && localFilters.radius !== 10 ? 1 : 0) +
    (localFilters.recentOnly ? 1 : 0) +
    (localFilters.boostedOnly ? 1 : 0)

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleReset = () => {
    const resetFilters: SearchFilters = {}
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  const removeFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...localFilters }
    delete newFilters[key]
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filtrlar</span>
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Active Filters (when collapsed) */}
      {!isOpen && activeFiltersCount > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {localFilters.category && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {CATEGORIES.find(c => c.value === localFilters.category)?.label}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFilter('category')
                }}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {(localFilters.minPrice || localFilters.maxPrice) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              Narx: {localFilters.minPrice || 0} - {localFilters.maxPrice || '∞'}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFilter('minPrice')
                  removeFilter('maxPrice')
                }}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {localFilters.condition && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {CONDITIONS.find(c => c.value === localFilters.condition)?.label}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFilter('condition')
                }}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {localFilters.recentOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              Yaqinda
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFilter('recentOnly')
                }}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {localFilters.boostedOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              Aksiya
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFilter('boostedOnly')
                }}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Filter Panel (when expanded) */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategoriya
            </label>
            <select
              value={localFilters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Barchasi</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Narx (UZS)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={localFilters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max"
                value={localFilters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Holat
            </label>
            <select
              value={localFilters.condition || ''}
              onChange={(e) => handleFilterChange('condition', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Barchasi</option>
              {CONDITIONS.map((cond) => (
                <option key={cond.value} value={cond.value}>
                  {cond.label}
                </option>
              ))}
            </select>
          </div>

          {/* Radius Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Radius
            </label>
            <select
              value={localFilters.radius || 10}
              onChange={(e) => handleFilterChange('radius', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {RADIUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Filters */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.recentOnly || false}
                onChange={(e) => handleFilterChange('recentOnly', e.target.checked || undefined)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Faqat yaqinda qo'shilganlar (7 kun)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.boostedOnly || false}
                onChange={(e) => handleFilterChange('boostedOnly', e.target.checked || undefined)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Faqat aksiyalar</span>
            </label>
          </div>

          {/* Reset Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Filtrlarni tozalash
            </button>
          )}
        </div>
      )}
    </div>
  )
}
