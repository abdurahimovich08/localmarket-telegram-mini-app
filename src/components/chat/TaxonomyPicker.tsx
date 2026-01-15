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
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

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
  onClose?: () => void
  isOverlay?: boolean
}

export default function TaxonomyPicker({
  value,
  onChange,
  onComplete,
  onClose,
  isOverlay = false,
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
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  
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
    
    // Show toast notification
    setToastMessage(`✅ Tanlandi: ${leaf.pathUz}`)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
    }, 800)
    
    // Complete after toast
    setTimeout(() => {
      onComplete(leaf, tags)
    }, 100)
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

  // Get header title based on current step
  const getHeaderTitle = () => {
    if (!value.audience) return 'Kim uchun?'
    if (!value.segment) return 'Qaysi bo\'lim?'
    if (!value.leaf) return 'Aniq turini tanlang'
    return 'Tanlandi'
  }

  // Get header subtitle
  const getHeaderSubtitle = () => {
    if (!value.audience) return 'To\'g\'ri xaridorni topish uchun kategoriyani tanlang'
    if (!value.segment) return `${audienceLabels[value.audience]} uchun kategoriyani tanlang`
    if (!value.leaf) return `${audienceLabels[value.audience]} → ${segmentLabels[value.segment]}`
    return value.leaf.pathUz
  }

  // Get progress step (1/3, 2/3, 3/3)
  const getProgressStep = () => {
    if (!value.audience) return '1/3'
    if (!value.segment) return '2/3'
    if (!value.leaf) return '3/3'
    return '3/3'
  }

  // Handle close
  const handleClose = () => {
    if (onClose) {
      trackEvent('taxonomy_overlay_close', {
        step: getProgressStep(),
        audience: value.audience,
        segment: value.segment,
      })
      onClose()
    }
  }

  // Get icon for audience
  const getAudienceIcon = (audience: Audience) => {
    const icons: Record<Audience, string> = {
      men: '👔',
      women: '👗',
      kids: '👶',
      unisex: '👕',
    }
    return icons[audience] || '👕'
  }

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${isOverlay ? '' : 'space-y-4'}`}>
      {/* Header - Apple Style */}
      <div className="px-5 py-6 bg-white shadow-sm z-10">
        {isOverlay && onClose && (
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Orqaga</span>
            </button>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {getHeaderTitle()}
            </h2>
            <p className="text-gray-500 text-sm">
              {getHeaderSubtitle()}
            </p>
          </div>
          {isOverlay && (
            <div className="text-right">
              <div className="text-sm font-semibold text-primary">
                {getProgressStep()}
              </div>
              <div className="text-xs text-gray-400 mt-1">Qadam</div>
            </div>
          )}
        </div>
      </div>

      {/* Stepper Progress - Sticky */}
      {(value.audience || value.segment) && (
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-5 py-3">
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {/* Step 1: Audience Selection - Large Grid */}
        {!value.audience && (
          <div className="grid grid-cols-2 gap-4">
            {getAudiences().map((aud) => (
              <button
                key={aud.key}
                onClick={() => handleAudienceSelect(aud.key)}
                className="aspect-[4/3] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-all hover:shadow-md"
              >
                <span className="text-5xl mb-3">{getAudienceIcon(aud.key)}</span>
                <span className="font-semibold text-gray-800 text-lg">{aud.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Segment Selection - Large Grid */}
        {value.audience && !value.segment && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Kategoriya</h3>
              <button
                onClick={() => onChange({ tags: [] })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                O'zgartirish
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {availableSegments.map((seg) => (
                <button
                  key={seg.key}
                  onClick={() => handleSegmentSelect(seg.key)}
                  className="aspect-[4/3] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border-2 border-gray-200 active:scale-95 transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md"
                >
                  <span className="font-semibold text-gray-800 text-base">{seg.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Leaf Selection - List Style */}
        {value.audience && value.segment && !value.leaf && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tur</h3>
              <button
                onClick={() => onChange({ ...value, segment: undefined, tags: [] })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Kategoriyani o'zgartirish
              </button>
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Masalan: krossovka, ko'ylak, kurtka..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Recent Selections */}
            {!searchQuery.trim() && recentSelections.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Yaqinda tanlangan:</h4>
                <div className="space-y-2">
                  {recentSelections.map((leaf) => (
                    <button
                      key={leaf.id}
                      onClick={() => handleLeafSelect(leaf)}
                      className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 active:bg-blue-50 transition-colors"
                    >
                      <span className="font-medium text-gray-800">{leaf.labelUz}</span>
                      <span className="text-xs text-gray-400">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Leaf List */}
            {displayLeaves.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {displayLeaves.map((leaf, index) => (
                  <button
                    key={leaf.id}
                    onClick={() => handleLeafSelect(leaf)}
                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-blue-50 transition-colors ${
                      index !== displayLeaves.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <span className="font-medium text-gray-800 text-lg">{leaf.labelUz}</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-4">Hech narsa topilmadi</p>
                <button
                  onClick={() => setShowWizard(true)}
                  className="px-6 py-3 bg-gray-100 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Bilmayman 🤷
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

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

      {/* Sticky Bilmayman CTA - Only show on Step 3 (Leaf Selection) */}
      {isOverlay && value.audience && value.segment && !value.leaf && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20 shadow-lg">
          <button
            onClick={() => {
              trackEvent('taxonomy_wizard_open', {
                audience: value.audience,
                segment: value.segment,
                source: 'sticky_cta',
              })
              setShowWizard(true)
            }}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md active:scale-98"
          >
            Bilmayman — menga yordam ber 🤷
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div 
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          style={{
            animation: 'fadeInOut 0.8s ease-in-out',
          }}
        >
          <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}
