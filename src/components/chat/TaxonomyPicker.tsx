/**
 * Taxonomy Picker Component
 * 
 * Stepper UI for selecting clothing taxonomy:
 * Audience → Segment → Leaf
 * 
 * Includes search and "Bilmayman" wizard
 */

import { useState, useRef, useEffect } from 'react'
import type { Audience, Segment, TaxonNode } from '../../taxonomy/clothing.uz'
import { CLOTHING_TAXONOMY } from '../../taxonomy/clothing.uz'
import {
  getAudiences,
  getSegmentsForAudience,
  getLeaves,
  searchLeaves,
  suggestLeaves,
  buildTagsFromSelection,
  audienceLabels,
  segmentLabels,
} from '../../taxonomy/clothing.utils'
import { trackEvent } from '../../lib/tracking'

export type TaxonomySelection = {
  audience?: Audience
  segment?: Segment
  leaf?: TaxonNode
  tags: string[]
}

interface TaxonomyPickerProps {
  value: TaxonomySelection
  onChange: (next: TaxonomySelection) => void
  onComplete: (leaf: TaxonNode, tags: string[]) => void
}

export default function TaxonomyPicker({
  value,
  onChange,
  onComplete,
}: TaxonomyPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TaxonNode[]>([])
  const [showWizard, setShowWizard] = useState(false)
  const [wizardState, setWizardState] = useState<{
    audience?: Audience
    segment?: Segment
    keyword?: string
    season?: 'yoz' | 'qish' | 'bahor' | 'kuz'
  }>({
    // Default to current selection or unisex
    audience: value.audience || 'unisex',
  })
  const [wizardSuggestions, setWizardSuggestions] = useState<TaxonNode[]>([])
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Load recent selections from localStorage
  const [recentSelections, setRecentSelections] = useState<TaxonNode[]>([])
  
  useEffect(() => {
    try {
      const stored = localStorage.getItem('taxonomy_recent_selections')
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
  const saveToRecent = (leaf: TaxonNode) => {
    try {
      const stored = localStorage.getItem('taxonomy_recent_selections') || '[]'
      const recentIds = JSON.parse(stored) as string[]
      const updated = [leaf.id, ...recentIds.filter(id => id !== leaf.id)].slice(0, 5)
      localStorage.setItem('taxonomy_recent_selections', JSON.stringify(updated))
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      const results = searchLeaves(searchQuery, value.audience, value.segment)
      setSearchResults(results)
      
      // Track search
      if (searchQuery.trim()) {
        trackEvent('taxonomy_search', {
          query: searchQuery,
          results_count: results.length,
          audience: value.audience,
          segment: value.segment,
        })
      }
    }, 150)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, value.audience, value.segment])

  // Track taxonomy open
  useEffect(() => {
    trackEvent('taxonomy_open', {
      category: 'clothing',
    })
  }, [])

  const handleAudienceSelect = (audience: Audience) => {
    trackEvent('taxonomy_audience_select', {
      audience,
    })
    onChange({
      audience,
      segment: undefined,
      leaf: undefined,
      tags: [],
    })
  }

  const handleSegmentSelect = (segment: Segment) => {
    trackEvent('taxonomy_segment_select', {
      audience: value.audience,
      segment,
    })
    onChange({
      ...value,
      segment,
      leaf: undefined,
      tags: [],
    })
  }

  const handleLeafSelect = (leaf: TaxonNode) => {
    const tags = buildTagsFromSelection(leaf)
    trackEvent('taxonomy_leaf_select', {
      leaf_id: leaf.id,
      leaf_path: leaf.pathUz,
      audience: leaf.audience,
      segment: leaf.segment,
      tags_count: tags.length,
    })
    onChange({
      ...value,
      leaf,
      tags,
    })
    saveToRecent(leaf)
    
    // Haptic feedback (Telegram Mini App)
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light')
    }
    
    onComplete(leaf, tags)
  }

  const handleWizardSuggest = () => {
    const suggestions = suggestLeaves({
      audience: wizardState.audience,
      segment: wizardState.segment,
      keyword: wizardState.keyword,
      season: wizardState.season,
    })
    setWizardSuggestions(suggestions)
  }

  const handleWizardSuggestionSelect = (leaf: TaxonNode) => {
    trackEvent('taxonomy_suggestion_click', {
      leaf_id: leaf.id,
      leaf_path: leaf.pathUz,
      source: 'wizard',
    })
    const tags = buildTagsFromSelection(leaf)
    onChange({
      audience: leaf.audience,
      segment: leaf.segment,
      leaf,
      tags,
    })
    saveToRecent(leaf)
    onComplete(leaf, tags)
    setShowWizard(false)
    setWizardState({})
    setWizardSuggestions([])
  }

  // Get available segments for selected audience
  const availableSegments = value.audience
    ? getSegmentsForAudience(value.audience)
    : []

  // Get leaves for selected audience + segment
  const availableLeaves = value.audience && value.segment
    ? getLeaves(value.audience, value.segment)
    : []

  // Display leaves: search results if searching, otherwise available leaves
  const displayLeaves = searchQuery.trim()
    ? searchResults
    : availableLeaves

  return (
    <div className="space-y-4">
      {/* Sticky Stepper Header - Apple Style */}
      {(value.audience || value.segment) && (
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-black/5 pt-safe pb-2 -mx-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {value.audience && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                  {audienceLabels[value.audience]}
                </span>
              )}
              {value.segment && (
                <>
                  <span className="text-gray-400">→</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                    {segmentLabels[value.segment]}
                  </span>
                </>
              )}
            </div>
            {value.audience && (
              <button
                onClick={() => onChange({ tags: [] })}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Qayta boshlash
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selected Path Display */}
      {value.leaf ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <span className="text-green-700 font-medium">
            ✅ Tanlandi: {value.leaf.pathUz}
          </span>
        </div>
      ) : null}

      {/* Step 1: Audience Selection */}
      {!value.audience && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Kim uchun?</h3>
          <div className="flex flex-wrap gap-2">
            {getAudiences().map((aud) => (
              <button
                key={aud.key}
                onClick={() => handleAudienceSelect(aud.key)}
                className="px-4 py-2 bg-white border-2 border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {aud.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Segment Selection */}
      {value.audience && !value.segment && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Kategoriya</h3>
            <button
              onClick={() => onChange({ tags: [] })}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              O'zgartirish
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSegments.map((seg) => (
              <button
                key={seg.key}
                onClick={() => handleSegmentSelect(seg.key)}
                className="px-4 py-2 bg-white border-2 border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {seg.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Leaf Selection */}
      {value.audience && value.segment && !value.leaf && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Tur</h3>
            <button
              onClick={() => onChange({ ...value, segment: undefined, tags: [] })}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Kategoriyani o'zgartirish
            </button>
          </div>

          {/* Search Input */}
          <div className="mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Masalan: krossovka, ko'ylak, kurtka..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Leaf Grid */}
          {displayLeaves.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {displayLeaves.map((leaf) => (
                <button
                  key={leaf.id}
                  onClick={() => handleLeafSelect(leaf)}
                  className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm text-left hover:border-primary hover:bg-primary/5 transition-colors active:scale-95"
                >
                  {leaf.labelUz}
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">Hech narsa topilmadi</p>
              <button
                onClick={() => setShowWizard(true)}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Bilmayman 🤷
              </button>
            </div>
          ) : null}

          {/* "Bilmayman" Button */}
          <div className="mt-3">
            <button
              onClick={() => {
                trackEvent('taxonomy_wizard_open', {
                  audience: value.audience,
                  segment: value.segment,
                })
                setShowWizard(true)
              }}
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Bilmayman 🤷
            </button>
          </div>
        </div>
      )}

      {/* "Bilmayman" Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Yordam kerakmi? 🤷
                </h2>
                <button
                  onClick={() => {
                    setShowWizard(false)
                    setWizardState({})
                    setWizardSuggestions([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Audience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kim uchun?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {getAudiences().map((aud) => (
                      <button
                        key={aud.key}
                        onClick={() =>
                          setWizardState({ ...wizardState, audience: aud.key })
                        }
                        className={`px-3 py-1.5 rounded-full text-sm ${
                          wizardState.audience === aud.key
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {aud.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Segment (optional) */}
                {wizardState.audience && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategoriya (ixtiyoriy)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {getSegmentsForAudience(wizardState.audience).map((seg) => (
                        <button
                          key={seg.key}
                          onClick={() =>
                            setWizardState({ ...wizardState, segment: seg.key })
                          }
                          className={`px-3 py-1.5 rounded-full text-sm ${
                            wizardState.segment === seg.key
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {seg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keyword (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kalit so'z (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={wizardState.keyword || ''}
                    onChange={(e) =>
                      setWizardState({ ...wizardState, keyword: e.target.value })
                    }
                    placeholder="Masalan: futbolka, krossovka..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Season (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mavsum (ixtiyoriy)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['yoz', 'qish', 'bahor', 'kuz'] as const).map((season) => (
                      <button
                        key={season}
                        onClick={() =>
                          setWizardState({ ...wizardState, season })
                        }
                        className={`px-3 py-1.5 rounded-full text-sm capitalize ${
                          wizardState.season === season
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {season}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suggest Button */}
                <button
                  onClick={handleWizardSuggest}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                  Taklif qilish
                </button>

                {/* Suggestions */}
                {wizardSuggestions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Takliflar:
                    </label>
                    <div className="space-y-2">
                      {wizardSuggestions.map((leaf) => (
                        <button
                          key={leaf.id}
                          onClick={() => handleWizardSuggestionSelect(leaf)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-left hover:bg-gray-100 transition-colors"
                        >
                          <div className="font-medium text-gray-900">
                            {leaf.labelUz}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {leaf.pathUz}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
