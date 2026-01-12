import { createClient } from '@supabase/supabase-js'
import type { User, Listing, Favorite, Review, CartItem, Store, StoreSubscription, StorePost, StorePromotion, Service } from '../types'
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
  limit?: number // Maximum number of listings to return
  page?: number // Page number (1-indexed) for pagination - DEPRECATED: Use cursor-based instead
  afterTimestamp?: string // Cursor-based pagination: show listings after this timestamp (deprecated)
}): Promise<Listing[]> => {
  // IMPORTANT: Always order by created_at DESC to ensure new listings appear first
  // NEVER use OFFSET-based pagination - it breaks when new listings are added
  // Use cursor-based pagination (afterTimestamp) instead
  
  // CRITICAL: Always ORDER BY created_at DESC - NEVER use OFFSET-based pagination
  // This ensures new listings always appear first, even when other users add listings
  let query = supabase
    .from('listings')
    .select('*, seller:users(telegram_user_id, username, first_name, profile_photo_url)')
    .eq('status', 'active')
    .order('is_boosted', { ascending: false }) // Boosted listings first
    .order('created_at', { ascending: false }) // CRITICAL: Always newest first
    
  // Cursor-based pagination: only show listings created after this timestamp
  // This ensures new listings always appear even if paginated
  if (filters?.afterTimestamp) {
    query = query.lt('created_at', filters.afterTimestamp) // lt = less than (older)
  }
    
  // Add limit for performance (default 100, max 200)
  const limit = filters?.limit || 100
  query = query.limit(Math.min(limit, 200))

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

  // CRITICAL: Hech qachon WHERE created_at > last_seen_at qilmaymiz
  // Vaqtga asoslangan filtr xavfli - bir vaqtda yaratilgan listinglar o'tib ketishi mumkin
  // Eng yaxshi yondashuv: har doim to'liq listinglarni olish va frontend'da "NEW" badge ko'rsatish
  // Agar listing_id ga asoslangan filtr kerak bo'lsa, uni alohida qilish mumkin
  // Lekin bu ham tavsiya etilmaydi - har doim to'liq listinglarni olish eng xavfsiz

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

export const createListing = async (listing: Omit<Listing, 'listing_id' | 'created_at' | 'updated_at' | 'view_count' | 'favorite_count' | 'store_id'> & { subcategory_id?: string; store_id?: string }): Promise<Listing | null> => {
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

// Subcategory operations
export interface Subcategory {
  subcategory_id: string
  parent_category: string
  name: string
  name_uz: string
  slug: string
  description?: string
  description_uz?: string
  parent_subcategory_id?: string
  display_order: number
  created_at: string
  updated_at: string
}

export const getSubcategories = async (parentCategory: string, parentSubcategoryId?: string): Promise<Subcategory[]> => {
  let query = supabase
    .from('subcategories')
    .select('*')
    .eq('parent_category', parentCategory)
    .order('display_order', { ascending: true })
    .order('name_uz', { ascending: true })

  if (parentSubcategoryId) {
    query = query.eq('parent_subcategory_id', parentSubcategoryId)
  } else {
    query = query.is('parent_subcategory_id', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching subcategories:', error)
    return []
  }

  return data || []
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

// ============================================
// STORE OPERATIONS
// ============================================

export const createStore = async (store: Omit<Store, 'store_id' | 'created_at' | 'updated_at' | 'subscriber_count' | 'is_verified' | 'is_active'>): Promise<Store | null> => {
  const { data, error } = await supabase
    .from('stores')
    .insert(store)
    .select('*, owner:users(*)')
    .single()

  if (error) {
    console.error('Error creating store:', error)
    if (error.code === '23505') {
      // Unique constraint violation - user already has a store
      throw new Error('Sizda allaqachon do\'kon mavjud. Bitta foydalanuvchi faqat bitta do\'kon yarata oladi.')
    }
    throw new Error(`Database error: ${error.message}`)
  }

  return data
}

export const getStore = async (storeId: string, userTelegramId?: number): Promise<Store | null> => {
  let query = supabase
    .from('stores')
    .select('*, owner:users(*)')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .single()

  const { data, error } = await query

  if (error) {
    console.error('Error fetching store:', error)
    return null
  }

  // Check if user is subscribed
  if (userTelegramId && data) {
    const isSubscribed = await isSubscribedToStore(userTelegramId, storeId)
    data.is_subscribed = isSubscribed
  }

  return data
}

export const getStores = async (limit: number = 3, userTelegramId?: number): Promise<Store[]> => {
  // Get random stores
  const { data, error } = await supabase
    .from('stores')
    .select('*, owner:users(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching stores:', error)
    return []
  }

  // Shuffle array for randomness
  const shuffled = [...(data || [])].sort(() => Math.random() - 0.5)

  // Check subscriptions if user provided
  if (userTelegramId && shuffled.length > 0) {
    const storeIds = shuffled.map(s => s.store_id)
    const subscriptions = await getStoreSubscriptions(userTelegramId, storeIds)
    const subscribedStoreIds = new Set(subscriptions.map(s => s.store_id))

    shuffled.forEach(store => {
      store.is_subscribed = subscribedStoreIds.has(store.store_id)
    })
  }

  return shuffled.slice(0, limit)
}

// Get user's single store (since one user can only have one store)
export const getUserStore = async (ownerTelegramId: number): Promise<Store | null> => {
  const { data, error } = await supabase
    .from('stores')
    .select('*, owner:users(*)')
    .eq('owner_telegram_id', ownerTelegramId)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No store found
      return null
    }
    console.error('Error fetching user store:', error)
    return null
  }

  return data
}

export const getUserStores = async (ownerTelegramId: number): Promise<Store[]> => {
  const { data, error } = await supabase
    .from('stores')
    .select('*, owner:users(*)')
    .eq('owner_telegram_id', ownerTelegramId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user stores:', error)
    return []
  }

  return data || []
}

export const updateStore = async (storeId: string, updates: Partial<Store>): Promise<Store | null> => {
  const { data, error } = await supabase
    .from('stores')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('store_id', storeId)
    .select('*, owner:users(*)')
    .single()

  if (error) {
    console.error('Error updating store:', error)
    return null
  }

  return data
}

export const subscribeToStore = async (userTelegramId: number, storeId: string): Promise<StoreSubscription | null> => {
  const { data, error } = await supabase
    .from('store_subscriptions')
    .insert({
      user_telegram_id: userTelegramId,
      store_id: storeId
    })
    .select()
    .single()

  if (error) {
    console.error('Error subscribing to store:', error)
    return null
  }

  return data
}

export const unsubscribeFromStore = async (userTelegramId: number, storeId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('store_subscriptions')
    .delete()
    .eq('user_telegram_id', userTelegramId)
    .eq('store_id', storeId)

  if (error) {
    console.error('Error unsubscribing from store:', error)
    return false
  }

  return true
}

export const isSubscribedToStore = async (userTelegramId: number, storeId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('store_subscriptions')
    .select('subscription_id')
    .eq('user_telegram_id', userTelegramId)
    .eq('store_id', storeId)
    .single()

  if (error) return false
  return !!data
}

export const getStoreSubscriptions = async (userTelegramId: number, storeIds?: string[]): Promise<StoreSubscription[]> => {
  let query = supabase
    .from('store_subscriptions')
    .select('*')
    .eq('user_telegram_id', userTelegramId)

  if (storeIds && storeIds.length > 0) {
    query = query.in('store_id', storeIds)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching store subscriptions:', error)
    return []
  }

  return data || []
}

export const getStoreListings = async (storeId: string): Promise<Listing[]> => {
  const { data, error } = await supabase
    .from('listings')
    .select('*, seller:users(telegram_user_id, username, first_name, profile_photo_url), store:stores(*)')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching store listings:', error)
    return []
  }

  return data || []
}

export const getStorePosts = async (storeId: string): Promise<StorePost[]> => {
  const { data, error } = await supabase
    .from('store_posts')
    .select('*, store:stores(*)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching store posts:', error)
    return []
  }

  return data || []
}

export const createStorePost = async (post: Omit<StorePost, 'post_id' | 'created_at' | 'updated_at' | 'view_count'>): Promise<StorePost | null> => {
  const { data, error } = await supabase
    .from('store_posts')
    .insert(post)
    .select('*, store:stores(*)')
    .single()

  if (error) {
    console.error('Error creating store post:', error)
    return null
  }

  return data
}

export const getStorePromotions = async (storeId: string): Promise<StorePromotion[]> => {
  const { data, error } = await supabase
    .from('store_promotions')
    .select('*, store:stores(*)')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .gt('end_date', new Date().toISOString())
    .order('end_date', { ascending: false })

  if (error) {
    console.error('Error fetching store promotions:', error)
    return []
  }

  return data || []
}

export const getPromotionListings = async (promotionId: string): Promise<Listing[]> => {
  const { data: promotion, error: promoError } = await supabase
    .from('store_promotions')
    .select('listing_ids')
    .eq('promotion_id', promotionId)
    .single()

  if (promoError || !promotion || !promotion.listing_ids || promotion.listing_ids.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('listings')
    .select('*, seller:users(telegram_user_id, username, first_name, profile_photo_url)')
    .in('listing_id', promotion.listing_ids)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching promotion listings:', error)
    return []
  }

  return data || []
}

// Service operations (Service type is imported from types/index.ts)
import { validateAndNormalizeTags } from './tagUtils'

/**
 * Update tag usage statistics when a service is created/updated
 */
async function updateTagUsageStats(tags: string[]): Promise<void> {
  if (!tags || tags.length === 0) return

  try {
    // Call the database function to update tag usage
    const { error } = await supabase.rpc('update_tag_usage', {
      tags_array: tags,
    })

    if (error) {
      console.error('Error updating tag usage stats:', error)
      // Don't throw - this is non-critical
    }
  } catch (error) {
    console.error('Error calling update_tag_usage function:', error)
    // Don't throw - this is non-critical
  }
}

export const createService = async (serviceData: {
  title: string
  description: string
  category: string
  priceType: 'fixed' | 'hourly' | 'negotiable'
  price: string
  tags: string[]
  logo_url?: string | null
  portfolio_images?: string[]
  image_url?: string | null // Deprecated, use logo_url instead
  provider_telegram_id: number
}): Promise<string | null> => {
  // Validate and normalize tags before saving (backend validation)
  const validatedTags = validateAndNormalizeTags(serviceData.tags)
  
  const { data, error } = await supabase
    .from('services')
    .insert({
      provider_telegram_id: serviceData.provider_telegram_id,
      title: serviceData.title,
      description: serviceData.description,
      category: serviceData.category,
      price_type: serviceData.priceType,
      price: serviceData.price,
      tags: validatedTags, // Use validated tags
      logo_url: serviceData.logo_url || serviceData.image_url || null,
      portfolio_images: serviceData.portfolio_images || [],
      image_url: serviceData.logo_url || serviceData.image_url || null, // Backward compatibility
      status: 'active',
    })
    .select('service_id')
    .single()

  if (error) {
    console.error('Error creating service:', error)
    throw new Error(`Failed to create service: ${error.message}`)
  }

  // Update tag usage statistics (non-blocking)
  updateTagUsageStats(validatedTags).catch(err => 
    console.error('Failed to update tag usage stats:', err)
  )

  return data?.service_id || null
}

export const getService = async (serviceId: string): Promise<Service | null> => {
  const { data, error } = await supabase
    .from('services')
    .select('*, provider:users!provider_telegram_id(*)')
    .eq('service_id', serviceId)
    .eq('status', 'active')
    .single()

  if (error) {
    console.error('Error fetching service:', error)
    return null
  }

  return data as Service
}

export const getUserServices = async (providerTelegramId: number): Promise<Service[]> => {
  const { data, error } = await supabase
    .from('services')
    .select('*, provider:users!provider_telegram_id(*)')
    .eq('provider_telegram_id', providerTelegramId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user services:', error)
    return []
  }

  return (data || []) as Service[]
}

export const updateService = async (serviceId: string, updates: Partial<Service>): Promise<Service | null> => {
  // Validate and normalize tags if they're being updated (backend validation)
  const validatedUpdates = { ...updates }
  if (updates.tags && Array.isArray(updates.tags)) {
    validatedUpdates.tags = validateAndNormalizeTags(updates.tags)
  }
  
  const { data, error } = await supabase
    .from('services')
    .update({ ...validatedUpdates, updated_at: new Date().toISOString() })
    .eq('service_id', serviceId)
    .select('*, provider:users!provider_telegram_id(*)')
    .single()

  if (error) {
    console.error('Error updating service:', error)
    return null
  }

  // Update tag usage statistics if tags were updated (non-blocking)
  if (validatedUpdates.tags && Array.isArray(validatedUpdates.tags)) {
    updateTagUsageStats(validatedUpdates.tags).catch(err => 
      console.error('Failed to update tag usage stats:', err)
    )
  }

  return data as Service
}
