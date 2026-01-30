/**
 * Step 1: Taxonomy Selection
 * 
 * Handles category selection with:
 * - Quick selection (Recent + Popular)
 * - 3-step flow (Audience → Segment → Item)
 * - Search functionality
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ArrowLeftIcon, XMarkIcon, CheckIcon, TagIcon } from '@heroicons/react/24/outline'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Icons8Icon from '../../Icons8Icon'
import { CLOTHING_TAXONOMY, TaxonNode, Audience, Segment } from '../../../taxonomy/clothing.uz'
import { clothingTaxonomyRegistry, getPopularItems, getSegmentsForAudience } from '../../../taxonomy/clothingRegistry'

// Get options from registry
const AUDIENCE_OPTIONS = clothingTaxonomyRegistry.audiences
const SEGMENT_OPTIONS = clothingTaxonomyRegistry.segments

interface Step1TaxonomyProps {
  selectedTaxonomy: TaxonNode | null
  onTaxonomyChange: (taxonomy: TaxonNode | null) => void
}

export default function Step1Taxonomy({
  selectedTaxonomy,
  onTaxonomyChange
}: Step1TaxonomyProps) {
  // Internal state for step navigation
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  
  // Recent selections (localStorage)
  const [recentSelections, setRecentSelections] = useState<TaxonNode[]>([])
  
  // Load recent selections on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('clothing_wizard_recent_selections')
      if (stored) {
        const recentIds = JSON.parse(stored) as string[]
        const recent = recentIds
          .map(id => CLOTHING_TAXONOMY.find(n => n.id === id))
          .filter((n): n is TaxonNode => !!n)
          .slice(0, 5)
        setRecentSelections(recent)
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [])
  
  // Save to recent selections
  const saveToRecent = useCallback((item: TaxonNode) => {
    try {
      const stored = localStorage.getItem('clothing_wizard_recent_selections') || '[]'
      const recentIds = JSON.parse(stored) as string[]
      const updated = [item.id, ...recentIds.filter(id => id !== item.id)].slice(0, 5)
      localStorage.setItem('clothing_wizard_recent_selections', JSON.stringify(updated))
      setRecentSelections(prev => {
        const filtered = prev.filter(n => n.id !== item.id)
        return [item, ...filtered].slice(0, 5)
      })
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [])
  
  // Popular categories
  const popularItems = useMemo(() => {
    return getPopularItems(clothingTaxonomyRegistry)
  }, [])
  
  // Available segments for selected audience
  const availableSegments = useMemo(() => {
    if (!selectedAudience) return []
    return getSegmentsForAudience(clothingTaxonomyRegistry, selectedAudience)
  }, [selectedAudience])
  
  // Available items for selected audience + segment (with search)
  const availableItems = useMemo(() => {
    if (!selectedAudience || !selectedSegment) return []
    let items = CLOTHING_TAXONOMY.filter(
      t => t.audience === selectedAudience && t.segment === selectedSegment && t.leaf
    )
    
    // Apply search filter
    if (itemSearchQuery.trim()) {
      const query = itemSearchQuery.toLowerCase().trim()
      items = items.filter(item => {
        const labelMatch = item.labelUz.toLowerCase().includes(query)
        const synonymsMatch = item.synonymsUz?.some(s => s.toLowerCase().includes(query)) || false
        const pathMatch = item.pathUz.toLowerCase().includes(query)
        return labelMatch || synonymsMatch || pathMatch
      })
    }
    
    return items
  }, [selectedAudience, selectedSegment, itemSearchQuery])
  
  // Handle taxonomy selection
  const handleTaxonomySelect = useCallback((item: TaxonNode) => {
    onTaxonomyChange(item)
    saveToRecent(item)
    setItemSearchQuery('')
  }, [onTaxonomyChange, saveToRecent])
  
  // Reset when taxonomy is cleared
  useEffect(() => {
    if (!selectedTaxonomy) {
      setSelectedAudience(null)
      setSelectedSegment(null)
      setItemSearchQuery('')
    }
  }, [selectedTaxonomy])
  
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="text-center mb-6">
        <p className="text-white/80 text-sm flex items-center justify-center gap-2">
          <Icons8Icon name="goal" size={16} className="opacity-90" />
          To'g'ri kategoriya = Tez topilish
        </p>
      </div>
      
      {/* Quick Selection: Recent & Popular (only when no selection) */}
      {!selectedAudience && !selectedTaxonomy && (
        <div className="space-y-4">
          {/* Recent Selections */}
          {recentSelections.length > 0 && (
            <div className="space-y-2">
              <p className="text-white/60 text-xs font-medium">So'nggi tanlanganlar</p>
              <div className="flex flex-wrap gap-2">
                {recentSelections.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleTaxonomySelect(item)}
                    className="px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 hover:border-purple-400/50 hover:bg-slate-700/60 transition-all text-white text-xs flex items-center gap-1.5"
                  >
                    <Icons8Icon name="tagWindow" size={12} className="opacity-90" />
                    {item.labelUz}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Popular Categories */}
          {popularItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-white/60 text-xs font-medium">Top kategoriyalar</p>
              <div className="flex flex-wrap gap-2">
                {popularItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleTaxonomySelect(item)}
                    className="px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 hover:border-purple-400/50 hover:bg-slate-700/60 transition-all text-white text-xs flex items-center gap-1.5"
                  >
                    <Icons8Icon name="tagWindow" size={12} className="opacity-90" />
                    {item.labelUz}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Divider */}
          {(recentSelections.length > 0 || popularItems.length > 0) && (
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-white/40 text-xs">yoki</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>
          )}
        </div>
      )}
      
      {/* Step 1.1: Audience Selection */}
      {!selectedAudience && !selectedTaxonomy && (
        <div className="space-y-3">
          <p className="text-white/60 text-sm text-center mb-4">Kim uchun mo'ljallangan?</p>
          <div className="grid grid-cols-2 gap-3">
            {AUDIENCE_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedAudience(option.value as Audience)
                  setSelectedSegment(null)
                }}
                className="p-5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-purple-400/50 hover:bg-slate-700/60 transition-all flex flex-col items-center gap-2 shadow-lg"
              >
                {option.iconName && (
                  <Icons8Icon name={option.iconName} size={32} className="opacity-90" />
                )}
                <span className="text-white font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Step 1.2: Segment Selection */}
      {selectedAudience && !selectedSegment && !selectedTaxonomy && (
        <div className="space-y-3">
          <button 
            onClick={() => setSelectedAudience(null)}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {AUDIENCE_OPTIONS.find(a => a.value === selectedAudience)?.label || 'Orqaga'}
          </button>
          
          <p className="text-white/60 text-sm text-center mb-4">Qanday kiyim?</p>
          <div className="grid grid-cols-2 gap-3">
            {availableSegments.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedSegment(option.value as Segment)
                }}
                className="p-5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-purple-400/50 hover:bg-slate-700/60 transition-all flex flex-col items-center gap-2 shadow-lg"
              >
                {option.iconName && (
                  <Icons8Icon name={option.iconName} size={28} className="opacity-90" />
                )}
                <span className="text-white font-medium text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Step 1.3: Item Selection */}
      {selectedAudience && selectedSegment && !selectedTaxonomy && (
        <div className="space-y-3">
          <button 
            onClick={() => {
              setSelectedSegment(null)
              setItemSearchQuery('')
            }}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {SEGMENT_OPTIONS.find(s => s.value === selectedSegment)?.label || 'Orqaga'}
          </button>
          
          <p className="text-white/60 text-sm text-center mb-4">Aniq turini tanlang</p>
          
          {/* Search Input */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              placeholder="Qidirish..."
              className="w-full pl-10 pr-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all text-sm"
            />
          </div>
          
          {/* Items Grid */}
          {availableItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pb-4">
              {availableItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleTaxonomySelect(item)}
                  className="p-4 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-purple-400/50 hover:bg-slate-700/60 transition-all text-left shadow-lg"
                >
                  <span className="text-white font-medium text-sm block">{item.labelUz}</span>
                  {/* Show pathUz for context */}
                  <p className="text-white/50 text-xs mt-1 truncate">
                    {item.pathUz.split(' / ').slice(-2).join(' / ')}
                  </p>
                  {item.synonymsUz && item.synonymsUz.length > 0 && (
                    <p className="text-white/40 text-xs mt-1 truncate">
                      {item.synonymsUz.slice(0, 2).join(', ')}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-white/60 text-sm">Hech narsa topilmadi</p>
              <p className="text-white/40 text-xs mt-1">Boshqa so'z bilan qidiring</p>
            </div>
          )}
        </div>
      )}
      
      {/* Selected Taxonomy Display */}
      {selectedTaxonomy && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-400/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <CheckIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold">{selectedTaxonomy.labelUz}</p>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-medium">
                      Tanlandi
                    </span>
                  </div>
                  <p className="text-white/70 text-xs mt-1">{selectedTaxonomy.pathUz}</p>
                </div>
              </div>
              <button
                onClick={() => onTaxonomyChange(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            {/* Quick info */}
            <div className="flex flex-wrap gap-2">
              {(() => {
                const audienceOption = AUDIENCE_OPTIONS.find(a => a.value === selectedTaxonomy.audience)
                return audienceOption?.iconName ? (
                  <span className="px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-white text-xs flex items-center gap-1.5">
                    <Icons8Icon name={audienceOption.iconName} size={14} className="opacity-90" />
                    {audienceOption.label}
                  </span>
                ) : null
              })()}
              {(() => {
                const segmentOption = SEGMENT_OPTIONS.find(s => s.value === selectedTaxonomy.segment)
                return segmentOption?.iconName ? (
                  <span className="px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-white text-xs flex items-center gap-1.5">
                    <Icons8Icon name={segmentOption.iconName} size={14} className="opacity-90" />
                    {segmentOption.label}
                  </span>
                ) : null
              })()}
            </div>
          </div>
          
          {/* Info about why this matters */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
              <Icons8Icon name="sparkles" size={16} className="opacity-90" />
              Nima uchun muhim?
            </p>
            <ul className="text-white/60 text-xs space-y-1">
              <li>• O'xshash e'lonlar orasida ko'rinadi</li>
              <li>• Xaridorlar oson topadi</li>
              <li>• To'g'ri teglar avtomatik qo'shiladi</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
