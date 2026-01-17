/**
 * Smart Recommendations Engine
 * 
 * Uses multiple signals for better recommendations:
 * 1. Tags similarity
 * 2. Taxonomy matching (audience, segment, item type)
 * 3. Brand matching
 * 4. Price range similarity
 * 5. Category matching
 * 6. User behavior (views, favorites)
 */

import { supabase } from './supabase'
import { normalizeBrand } from './smartSearch'
import { normalizeText } from './transliteration'

// Helper functions for Uzbek labels
function getAudienceLabel(audience: string): string {
  const labels: Record<string, string> = {
    'erkaklar': 'Erkaklar uchun',
    'ayollar': 'Ayollar uchun',
    'bolalar': 'Bolalar uchun',
    'unisex': 'Unisex',
  }
  return labels[audience] || audience
}

function getSegmentLabel(segment: string): string {
  const labels: Record<string, string> = {
    'kiyim': 'Kiyim',
    'oyoq_kiyim': 'Oyoq kiyim',
    'aksessuar': 'Aksessuar',
    'ichki_kiyim': 'Ichki kiyim',
    'sport': 'Sport kiyim',
    'milliy': 'Milliy kiyim',
  }
  return labels[segment] || segment
}

export interface RecommendationScore {
  listing_id: string
  score: number
  reasons: string[]
}

export interface ListingForRecommendation {
  listing_id: string
  title: string
  category: string
  price?: number
  attributes?: {
    brand?: string
    tags?: string[]
    taxonomy?: {
      audience?: string
      segment?: string
      labelUz?: string
    }
    colors?: string[]
    sizes?: string[]
  }
}

/**
 * Calculate similarity score between two listings
 */
export function calculateSimilarity(
  target: ListingForRecommendation,
  candidate: ListingForRecommendation
): RecommendationScore {
  let score = 0
  const reasons: string[] = []

  // 1. Category match (base requirement)
  if (target.category === candidate.category) {
    score += 20
    reasons.push('Bir xil kategoriya')
  } else {
    // Different category = low relevance
    return { listing_id: candidate.listing_id, score: 0, reasons: [] }
  }

  // 2. Brand match (high value)
  if (target.attributes?.brand && candidate.attributes?.brand) {
    const targetBrand = normalizeBrand(target.attributes.brand)
    const candidateBrand = normalizeBrand(candidate.attributes.brand)
    if (targetBrand === candidateBrand) {
      score += 35
      reasons.push(`${candidateBrand} brendi`)
    }
  }

  // 3. Taxonomy match (high value for recommendations)
  if (target.attributes?.taxonomy && candidate.attributes?.taxonomy) {
    const tTax = target.attributes.taxonomy
    const cTax = candidate.attributes.taxonomy

    // Exact same taxonomy ID = perfect match
    if (tTax.id && tTax.id === cTax.id) {
      score += 50
      reasons.push('Aynan bir xil tur')
    } else {
      // Same audience (erkaklar, ayollar, bolalar)
      if (tTax.audience && tTax.audience === cTax.audience) {
        score += 15
        reasons.push(getAudienceLabel(tTax.audience))
      }

      // Same segment (oyoq kiyim, ustki kiyim, etc.)
      if (tTax.segment && tTax.segment === cTax.segment) {
        score += 25
        reasons.push(getSegmentLabel(tTax.segment))
      }

      // Same item type (exactly same clothing type)
      if (tTax.labelUz && tTax.labelUz === cTax.labelUz) {
        score += 30
        reasons.push(`${cTax.labelUz}`)
      }
    }
  }

  // 4. Tags similarity
  if (target.attributes?.tags && candidate.attributes?.tags) {
    const targetTags = new Set(target.attributes.tags.map(t => normalizeText(t)))
    const candidateTags = candidate.attributes.tags.map(t => normalizeText(t))
    
    let matchingTags = 0
    for (const tag of candidateTags) {
      if (targetTags.has(tag)) {
        matchingTags++
      }
    }
    
    if (matchingTags > 0) {
      const tagScore = Math.min(matchingTags * 8, 30) // Max 30 points for tags
      score += tagScore
      reasons.push(`${matchingTags} ta mos tag`)
    }
  }

  // 5. Price range similarity (within 30%)
  if (target.price && candidate.price) {
    const priceDiff = Math.abs(target.price - candidate.price) / target.price
    if (priceDiff <= 0.3) {
      score += 10
      reasons.push('O\'xshash narx')
    }
  }

  // 6. Color match
  if (target.attributes?.colors && candidate.attributes?.colors) {
    const targetColors = new Set(target.attributes.colors.map(c => normalizeText(c)))
    const candidateColors = candidate.attributes.colors.map(c => normalizeText(c))
    
    for (const color of candidateColors) {
      if (targetColors.has(color)) {
        score += 5
        reasons.push('O\'xshash rang')
        break
      }
    }
  }

  return { listing_id: candidate.listing_id, score, reasons }
}

/**
 * Get recommendations for a listing
 */
export async function getRecommendationsForListing(
  listingId: string,
  limit: number = 6
): Promise<RecommendationScore[]> {
  // 1. Get target listing
  const { data: targetData, error: targetError } = await supabase
    .from('listings')
    .select('listing_id, title, category, price, attributes')
    .eq('listing_id', listingId)
    .single()

  if (targetError || !targetData) {
    console.error('Error fetching target listing:', targetError)
    return []
  }

  const target: ListingForRecommendation = targetData

  // 2. Get candidate listings (same category, active, not same listing)
  const { data: candidates, error: candidatesError } = await supabase
    .from('listings')
    .select('listing_id, title, category, price, attributes')
    .eq('category', target.category)
    .eq('status', 'active')
    .neq('listing_id', listingId)
    .limit(50) // Get more candidates for better selection

  if (candidatesError || !candidates) {
    console.error('Error fetching candidates:', candidatesError)
    return []
  }

  // 3. Score each candidate
  const scoredCandidates: RecommendationScore[] = candidates
    .map(candidate => calculateSimilarity(target, candidate))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scoredCandidates
}

/**
 * Get recommendations based on user's view history
 */
export async function getPersonalizedRecommendations(
  userId: number,
  limit: number = 10
): Promise<RecommendationScore[]> {
  // 1. Get user's recent views
  const { data: recentViews, error: viewsError } = await supabase
    .from('listing_views')
    .select('listing_id')
    .eq('user_telegram_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(10)

  if (viewsError || !recentViews || recentViews.length === 0) {
    // Fallback: return popular listings
    const { data: popular } = await supabase
      .from('listings')
      .select('listing_id')
      .eq('status', 'active')
      .order('view_count', { ascending: false })
      .limit(limit)

    return (popular || []).map(l => ({
      listing_id: l.listing_id,
      score: 50,
      reasons: ['Mashhur mahsulot']
    }))
  }

  // 2. Get viewed listings details
  const viewedIds = recentViews.map(v => v.listing_id)
  const { data: viewedListings } = await supabase
    .from('listings')
    .select('listing_id, title, category, price, attributes')
    .in('listing_id', viewedIds)

  if (!viewedListings || viewedListings.length === 0) {
    return []
  }

  // 3. Build user interest profile
  const interestProfile = {
    categories: new Map<string, number>(),
    brands: new Map<string, number>(),
    tags: new Map<string, number>(),
    priceRange: { min: Infinity, max: 0 }
  }

  for (const listing of viewedListings) {
    // Count categories
    const catCount = interestProfile.categories.get(listing.category) || 0
    interestProfile.categories.set(listing.category, catCount + 1)

    // Count brands
    if (listing.attributes?.brand) {
      const brand = normalizeBrand(listing.attributes.brand)
      const brandCount = interestProfile.brands.get(brand) || 0
      interestProfile.brands.set(brand, brandCount + 1)
    }

    // Count tags
    if (listing.attributes?.tags) {
      for (const tag of listing.attributes.tags) {
        const normalizedTag = normalizeText(tag)
        const tagCount = interestProfile.tags.get(normalizedTag) || 0
        interestProfile.tags.set(normalizedTag, tagCount + 1)
      }
    }

    // Track price range
    if (listing.price) {
      interestProfile.priceRange.min = Math.min(interestProfile.priceRange.min, listing.price)
      interestProfile.priceRange.max = Math.max(interestProfile.priceRange.max, listing.price)
    }
  }

  // 4. Get candidates from top categories
  const topCategories = [...interestProfile.categories.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat)

  const { data: candidates } = await supabase
    .from('listings')
    .select('listing_id, title, category, price, attributes')
    .in('category', topCategories)
    .eq('status', 'active')
    .not('listing_id', 'in', `(${viewedIds.join(',')})`)
    .limit(100)

  if (!candidates || candidates.length === 0) {
    return []
  }

  // 5. Score candidates based on user profile
  const scored: RecommendationScore[] = []

  for (const candidate of candidates) {
    let score = 0
    const reasons: string[] = []

    // Category interest
    const catInterest = interestProfile.categories.get(candidate.category) || 0
    if (catInterest > 0) {
      score += catInterest * 10
      reasons.push('Siz qiziqgan kategoriya')
    }

    // Brand interest
    if (candidate.attributes?.brand) {
      const brand = normalizeBrand(candidate.attributes.brand)
      const brandInterest = interestProfile.brands.get(brand) || 0
      if (brandInterest > 0) {
        score += brandInterest * 15
        reasons.push(`${brand} brendi`)
      }
    }

    // Tag matches
    if (candidate.attributes?.tags) {
      let tagMatches = 0
      for (const tag of candidate.attributes.tags) {
        const normalizedTag = normalizeText(tag)
        if (interestProfile.tags.has(normalizedTag)) {
          tagMatches++
        }
      }
      if (tagMatches > 0) {
        score += tagMatches * 5
        reasons.push(`${tagMatches} ta mos tag`)
      }
    }

    // Price range match
    if (candidate.price && 
        candidate.price >= interestProfile.priceRange.min * 0.5 &&
        candidate.price <= interestProfile.priceRange.max * 1.5) {
      score += 10
      reasons.push('Sizning byudjetingizda')
    }

    if (score > 0) {
      scored.push({ listing_id: candidate.listing_id, score, reasons })
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Get trending items in a category
 */
export async function getTrendingInCategory(
  category: string,
  limit: number = 6
): Promise<string[]> {
  // Get listings with most views in last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('listings')
    .select('listing_id, view_count')
    .eq('category', category)
    .eq('status', 'active')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('view_count', { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data.map(l => l.listing_id)
}

/**
 * Get recommendations based on taxonomy (audience, segment, item type)
 * This is the most accurate way to find similar clothing items
 */
export async function getRecommendationsByTaxonomy(
  taxonomyId: string,
  excludeListingId?: string,
  limit: number = 8
): Promise<RecommendationScore[]> {
  // Parse taxonomy ID: "ayollar.kiyim.futbolka"
  const parts = taxonomyId.split('.')
  if (parts.length < 2) return []
  
  const audience = parts[0]
  const segment = parts[1]
  const itemType = parts[2] || null

  // Build query to find similar items
  let query = supabase
    .from('listings')
    .select('listing_id, title, category, price, attributes')
    .eq('category', 'clothing')
    .eq('status', 'active')

  if (excludeListingId) {
    query = query.neq('listing_id', excludeListingId)
  }

  const { data: candidates, error } = await query.limit(100)

  if (error || !candidates) {
    console.error('Error fetching taxonomy candidates:', error)
    return []
  }

  // Score based on taxonomy match
  const scored: RecommendationScore[] = []

  for (const candidate of candidates) {
    const tax = candidate.attributes?.taxonomy
    if (!tax) continue

    let score = 0
    const reasons: string[] = []

    // Exact item type match (highest priority)
    if (itemType && tax.id === taxonomyId) {
      score += 100
      reasons.push(`Aynan ${tax.labelUz || 'bir xil tur'}`)
    }
    // Same segment and audience
    else if (tax.audience === audience && tax.segment === segment) {
      score += 60
      if (tax.labelUz) {
        reasons.push(`${getSegmentLabel(segment)} bo'limi`)
      }
    }
    // Same audience only
    else if (tax.audience === audience) {
      score += 30
      reasons.push(getAudienceLabel(audience))
    }
    // Same segment only (useful for unisex items)
    else if (tax.segment === segment) {
      score += 20
      reasons.push(getSegmentLabel(segment))
    }

    // Bonus for same brand
    if (candidate.attributes?.brand) {
      score += 10
    }

    if (score > 0) {
      scored.push({
        listing_id: candidate.listing_id,
        score,
        reasons
      })
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Get "You may also like" recommendations
 * Combines taxonomy-based and behavior-based signals
 */
export async function getYouMayAlsoLike(
  currentListingId: string,
  userId?: number,
  limit: number = 6
): Promise<RecommendationScore[]> {
  // Get current listing
  const { data: currentListing } = await supabase
    .from('listings')
    .select('listing_id, category, attributes')
    .eq('listing_id', currentListingId)
    .single()

  if (!currentListing) return []

  const results: RecommendationScore[] = []

  // 1. Get taxonomy-based recommendations (if taxonomy exists)
  if (currentListing.attributes?.taxonomy?.id) {
    const taxonomyRecs = await getRecommendationsByTaxonomy(
      currentListing.attributes.taxonomy.id,
      currentListingId,
      Math.ceil(limit * 0.6) // 60% from taxonomy
    )
    results.push(...taxonomyRecs)
  }

  // 2. Get personalized recommendations (if user is logged in)
  if (userId) {
    const personalRecs = await getPersonalizedRecommendations(
      userId,
      Math.ceil(limit * 0.4) // 40% from personalization
    )
    // Add only items not already in results
    for (const rec of personalRecs) {
      if (!results.some(r => r.listing_id === rec.listing_id) && rec.listing_id !== currentListingId) {
        results.push(rec)
      }
    }
  }

  // 3. Fallback to general recommendations
  if (results.length < limit) {
    const generalRecs = await getRecommendationsForListing(currentListingId, limit - results.length)
    for (const rec of generalRecs) {
      if (!results.some(r => r.listing_id === rec.listing_id)) {
        results.push(rec)
      }
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
