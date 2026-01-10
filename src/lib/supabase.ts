import { createClient } from '@supabase/supabase-js'
import type { User, Listing, Favorite, Review, CartItem } from '../types'
import { buildSearchVariations, scoreListingRelevance } from './searchAlgorithms'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// User operations
export const getUser = async (telegramUserId: number): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }
  return data
}

export const createOrUpdateUser = async (userData: Partial<User>): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .upsert(userData, {
      onConflict: 'telegram_user_id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating/updating user:', error)
    return null
  }
  return data
}

// Listing operations
export const getListings = async (filters?: {
  category?: string
  minPrice?: number
  maxPrice?: number
  condition?: string
  radius?: number
  userLat?: number
  userLon?: number
  search?: string
  recentOnly?: boolean // only listings from last 7 days
  boostedOnly?: boolean // only boosted listings
}): Promise<Listing[]> => {
  let query = supabase
    .from('listings')
    .select('*, seller:users(*)')
    .eq('status', 'active')
    .order('is_boosted', { ascending: false })
    .order('created_at', { ascending: false })

  // Category filter
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  // Price filters
  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice)
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice)
  }

  // Condition filter
  if (filters?.condition) {
    query = query.eq('condition', filters.condition)
  }

  // Boosted only filter
  if (filters?.boostedOnly) {
    query = query.eq('is_boosted', true)
  }

  // Recent only filter (last 7 days)
  if (filters?.recentOnly) {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    query = query.gte('created_at', sevenDaysAgo.toISOString())
  }

  // Advanced search with fuzzy matching, synonyms, transliteration
  if (filters?.search && filters.search.trim()) {
    // Get search term and escape it
    const searchTerm = filters.search.trim()
    const escaped = searchTerm.replace(/'/g, "''")
    
    // Use simple ILIKE for basic search (Supabase compatible)
    // This will match title or description containing the search term
    query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching listings:', error)
    return []
  }

  let results = data || []

  // Filter by distance if location provided
  if (filters?.userLat && filters?.userLon && filters?.radius) {
    const listingsWithDistance = results.filter((listing: Listing) => {
      if (!listing.latitude || !listing.longitude) return false
      const distance = calculateDistance(
        filters.userLat!,
        filters.userLon!,
        listing.latitude,
        listing.longitude
      )
      listing.distance = distance
      return distance <= filters.radius!
    })
    
    results = listingsWithDistance
  }

  // Score listings by relevance if search query exists
  if (filters?.search && filters.search.trim()) {
    // Get search variations for enhanced matching
    const variations = buildSearchVariations(filters.search.trim())
    const searchTerm = filters.search.trim().toLowerCase()
    
    // Client-side filtering and scoring for fuzzy matching
    const scoredResults = results.map((listing: Listing) => {
      const titleLower = listing.title.toLowerCase()
      const descLower = (listing.description || '').toLowerCase()
      let relevanceScore = scoreListingRelevance(listing, filters.search!)
      
      // Check variations for better matching
      variations.forEach(variation => {
        const varLower = variation.toLowerCase()
        if (titleLower.includes(varLower)) {
          relevanceScore += 30 // Bonus for variation match in title
        } else if (descLower.includes(varLower)) {
          relevanceScore += 10 // Bonus for variation match in description
        }
      })
      
      // Exact match bonus (title has higher weight)
      if (titleLower.includes(searchTerm)) {
        relevanceScore += 50
      } else if (descLower.includes(searchTerm)) {
        relevanceScore += 20
      }
      
      return {
        ...listing,
        relevanceScore,
      }
    })
    
    // Don't filter out results - show all matches but sort by relevance
    // Sort by relevance score (higher is better)
    scoredResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    results = scoredResults
  } else {
    // Basic distance sort if location provided
    if (filters?.userLat && filters?.userLon) {
      results.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }
  }

  return results
}

export const getListing = async (listingId: string): Promise<Listing | null> => {
  const { data, error } = await supabase
    .from('listings')
    .select('*, seller:users(*)')
    .eq('listing_id', listingId)
    .single()

  if (error) {
    console.error('Error fetching listing:', error)
    return null
  }
  return data
}

export const createListing = async (listing: Omit<Listing, 'listing_id' | 'created_at' | 'updated_at' | 'view_count' | 'favorite_count'>): Promise<Listing | null> => {
  console.log('Creating listing with data:', listing)
  
  const { data, error } = await supabase
    .from('listings')
    .insert(listing)
    .select('*, seller:users(*)')
    .single()

  if (error) {
    console.error('Error creating listing:', error)
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw new Error(`Database error: ${error.message}`)
  }
  
  console.log('Listing created successfully:', data)
  return data
}

export const updateListing = async (listingId: string, updates: Partial<Listing>): Promise<Listing | null> => {
  const { data, error } = await supabase
    .from('listings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('listing_id', listingId)
    .select('*, seller:users(*)')
    .single()

  if (error) {
    console.error('Error updating listing:', error)
    return null
  }
  return data
}

export const deleteListing = async (listingId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'deleted' })
    .eq('listing_id', listingId)

  if (error) {
    console.error('Error deleting listing:', error)
    return false
  }
  return true
}

export const incrementViewCount = async (listingId: string): Promise<void> => {
  await supabase.rpc('increment_view_count', { listing_id: listingId })
}

// Favorite operations
export const getFavorites = async (telegramUserId: number): Promise<Favorite[]> => {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, listing:listings(*, seller:users(*))')
    .eq('user_telegram_id', telegramUserId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching favorites:', error)
    return []
  }
  return data || []
}

export const addFavorite = async (telegramUserId: number, listingId: string): Promise<Favorite | null> => {
  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_telegram_id: telegramUserId,
      listing_id: listingId
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding favorite:', error)
    return null
  }

  // Increment favorite count
  await supabase.rpc('increment_favorite_count', { listing_id: listingId })
  return data
}

export const removeFavorite = async (telegramUserId: number, listingId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_telegram_id', telegramUserId)
    .eq('listing_id', listingId)

  if (error) {
    console.error('Error removing favorite:', error)
    return false
  }

  // Decrement favorite count
  await supabase.rpc('decrement_favorite_count', { listing_id: listingId })
  return true
}

export const isFavorite = async (telegramUserId: number, listingId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('favorites')
    .select('favorite_id')
    .eq('user_telegram_id', telegramUserId)
    .eq('listing_id', listingId)
    .single()

  if (error) return false
  return !!data
}

// Cart operations
export const getCart = async (telegramUserId: number): Promise<CartItem[]> => {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, listing:listings(*, seller:users(*))')
    .eq('user_telegram_id', telegramUserId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching cart:', error)
    return []
  }
  return data || []
}

export const addToCart = async (
  telegramUserId: number,
  listingId: string,
  quantity: number = 1
): Promise<CartItem | null> => {
  // Check if item already in cart
  const { data: existing } = await supabase
    .from('cart_items')
    .select('cart_item_id, quantity')
    .eq('user_telegram_id', telegramUserId)
    .eq('listing_id', listingId)
    .single()

  if (existing) {
    // Update quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('cart_item_id', existing.cart_item_id)
      .select('*, listing:listings(*, seller:users(*))')
      .single()

    if (error) {
      console.error('Error updating cart:', error)
      return null
    }
    return data
  } else {
    // Insert new item
    const { data, error } = await supabase
      .from('cart_items')
      .insert({
        user_telegram_id: telegramUserId,
        listing_id: listingId,
        quantity
      })
      .select('*, listing:listings(*, seller:users(*))')
      .single()

    if (error) {
      console.error('Error adding to cart:', error)
      return null
    }
    return data
  }
}

export const removeFromCart = async (telegramUserId: number, cartItemId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_telegram_id', telegramUserId)
    .eq('cart_item_id', cartItemId)

  if (error) {
    console.error('Error removing from cart:', error)
    return false
  }
  return true
}

export const updateCartQuantity = async (
  telegramUserId: number,
  cartItemId: string,
  quantity: number
): Promise<CartItem | null> => {
  if (quantity <= 0) {
    // Remove if quantity is 0 or negative
    await removeFromCart(telegramUserId, cartItemId)
    return null
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('user_telegram_id', telegramUserId)
    .eq('cart_item_id', cartItemId)
    .select('*, listing:listings(*, seller:users(*))')
    .single()

  if (error) {
    console.error('Error updating cart quantity:', error)
    return null
  }
  return data
}

export const clearCart = async (telegramUserId: number): Promise<boolean> => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_telegram_id', telegramUserId)

  if (error) {
    console.error('Error clearing cart:', error)
    return false
  }
  return true
}

export const getCartCount = async (telegramUserId: number): Promise<number> => {
  const { count, error } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_telegram_id', telegramUserId)

  if (error) {
    console.error('Error getting cart count:', error)
    return 0
  }
  return count || 0
}

export const isInCart = async (telegramUserId: number, listingId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('cart_items')
    .select('cart_item_id')
    .eq('user_telegram_id', telegramUserId)
    .eq('listing_id', listingId)
    .single()

  if (error) return false
  return !!data
}

// Review operations
export const getReviews = async (telegramUserId: number): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewer:users!reviewer_telegram_id(*)')
    .eq('reviewed_telegram_id', telegramUserId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
  return data || []
}

export const createReview = async (review: Omit<Review, 'review_id' | 'created_at'>): Promise<Review | null> => {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select('*, reviewer:users!reviewer_telegram_id(*)')
    .single()

  if (error) {
    console.error('Error creating review:', error)
    return null
  }

  // Update user rating
  await supabase.rpc('update_user_rating', { user_id: review.reviewed_telegram_id })
  return data
}

// Helper function for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
