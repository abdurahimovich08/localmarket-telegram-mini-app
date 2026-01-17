/**
 * Reviews API Functions
 * 
 * Handles:
 * - Purchase claims (buyer claims they bought)
 * - Review CRUD operations
 * - Helpful/not helpful voting
 */

import { supabase } from './supabase'

// Types
export interface PurchaseClaim {
  claim_id: string
  listing_id: string
  buyer_telegram_id: number
  seller_telegram_id: number
  selected_size?: string
  selected_color?: string
  status: 'pending' | 'approved' | 'rejected'
  seller_response_at?: string
  rejection_reason?: string
  purchase_type: 'offline' | 'online' | 'delivery'
  created_at: string
}

export interface Review {
  review_id: string
  reviewer_telegram_id: number
  reviewed_telegram_id: number
  listing_id: string
  rating: number
  review_text?: string
  tags?: string[]
  photos?: string[]
  is_verified_purchase: boolean
  purchase_claim_id?: string
  purchased_size?: string
  purchased_color?: string
  helpful_count: number
  not_helpful_count: number
  seller_reply?: string
  seller_reply_at?: string
  created_at: string
  reviewer?: {
    telegram_user_id: number
    first_name?: string
    username?: string
    photo_url?: string
  }
}

// ==========================================
// PURCHASE CLAIMS
// ==========================================

/**
 * Create a purchase claim (buyer says "I bought this")
 */
export async function createPurchaseClaim(
  listingId: string,
  buyerTelegramId: number,
  selectedSize?: string,
  selectedColor?: string,
  purchaseType: 'offline' | 'online' | 'delivery' = 'offline'
): Promise<PurchaseClaim | null> {
  // First get seller ID
  const { data: listing } = await supabase
    .from('listings')
    .select('seller_telegram_id')
    .eq('listing_id', listingId)
    .single()

  if (!listing) {
    console.error('Listing not found')
    return null
  }

  const { data, error } = await supabase
    .from('purchase_claims')
    .insert({
      listing_id: listingId,
      buyer_telegram_id: buyerTelegramId,
      seller_telegram_id: listing.seller_telegram_id,
      selected_size: selectedSize,
      selected_color: selectedColor,
      purchase_type: purchaseType
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating purchase claim:', error)
    return null
  }

  return data
}

/**
 * Get user's purchase claim status for a listing
 */
export async function getPurchaseClaimStatus(
  listingId: string,
  buyerTelegramId: number
): Promise<PurchaseClaim | null> {
  const { data, error } = await supabase
    .from('purchase_claims')
    .select('*')
    .eq('listing_id', listingId)
    .eq('buyer_telegram_id', buyerTelegramId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting purchase claim:', error)
  }

  return data || null
}

/**
 * Get pending claims for seller
 */
export async function getPendingClaimsForSeller(
  sellerTelegramId: number
): Promise<(PurchaseClaim & { listing?: any; buyer?: any })[]> {
  const { data, error } = await supabase
    .from('purchase_claims')
    .select(`
      *,
      listing:listings(listing_id, title, photos, price),
      buyer:users!purchase_claims_buyer_telegram_id_fkey(telegram_user_id, first_name, username, photo_url)
    `)
    .eq('seller_telegram_id', sellerTelegramId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting pending claims:', error)
    return []
  }

  return data || []
}

/**
 * Approve a purchase claim (seller confirms the sale)
 */
export async function approvePurchaseClaim(
  claimId: string,
  sellerTelegramId: number
): Promise<boolean> {
  // First verify seller owns this claim
  const { data: claim } = await supabase
    .from('purchase_claims')
    .select('*')
    .eq('claim_id', claimId)
    .eq('seller_telegram_id', sellerTelegramId)
    .single()

  if (!claim) {
    console.error('Claim not found or not authorized')
    return false
  }

  // Update claim status
  const { error: updateError } = await supabase
    .from('purchase_claims')
    .update({ 
      status: 'approved', 
      seller_response_at: new Date().toISOString() 
    })
    .eq('claim_id', claimId)

  if (updateError) {
    console.error('Error approving claim:', updateError)
    return false
  }

  // Create transaction record
  await supabase
    .from('transactions')
    .insert({
      listing_id: claim.listing_id,
      buyer_telegram_id: claim.buyer_telegram_id,
      seller_telegram_id: claim.seller_telegram_id,
      status: 'completed',
      completed_at: new Date().toISOString()
    })

  // Update seller's total sales
  await supabase.rpc('increment_column', {
    table_name: 'users',
    column_name: 'total_sales',
    row_id: sellerTelegramId,
    id_column: 'telegram_user_id'
  }).catch(() => {
    // Fallback: direct update
    supabase
      .from('users')
      .update({ total_sales: supabase.rpc('coalesce_int', { val: 'total_sales', def: 0 }) })
      .eq('telegram_user_id', sellerTelegramId)
  })

  return true
}

/**
 * Reject a purchase claim
 */
export async function rejectPurchaseClaim(
  claimId: string,
  sellerTelegramId: number,
  reason?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('purchase_claims')
    .update({ 
      status: 'rejected', 
      seller_response_at: new Date().toISOString(),
      rejection_reason: reason
    })
    .eq('claim_id', claimId)
    .eq('seller_telegram_id', sellerTelegramId)
    .eq('status', 'pending')

  if (error) {
    console.error('Error rejecting claim:', error)
    return false
  }

  return true
}

// ==========================================
// REVIEWS
// ==========================================

/**
 * Check if user can write a review (has approved purchase)
 */
export async function canWriteReview(
  listingId: string,
  userTelegramId: number
): Promise<{ canWrite: boolean; claim?: PurchaseClaim; existingReview?: Review }> {
  // Check for approved purchase claim
  const { data: claim } = await supabase
    .from('purchase_claims')
    .select('*')
    .eq('listing_id', listingId)
    .eq('buyer_telegram_id', userTelegramId)
    .eq('status', 'approved')
    .single()

  // Check for existing review
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('*')
    .eq('listing_id', listingId)
    .eq('reviewer_telegram_id', userTelegramId)
    .single()

  return {
    canWrite: !!claim && !existingReview,
    claim: claim || undefined,
    existingReview: existingReview || undefined
  }
}

/**
 * Create a verified review
 */
export async function createReview(
  listingId: string,
  reviewerTelegramId: number,
  rating: number,
  reviewText?: string,
  photos?: string[],
  purchasedSize?: string,
  purchasedColor?: string
): Promise<Review | null> {
  // First verify user has approved purchase
  const { canWrite, claim } = await canWriteReview(listingId, reviewerTelegramId)
  
  if (!canWrite || !claim) {
    console.error('User cannot write review - no approved purchase')
    return null
  }

  // Get seller ID
  const { data: listing } = await supabase
    .from('listings')
    .select('seller_telegram_id')
    .eq('listing_id', listingId)
    .single()

  if (!listing) {
    console.error('Listing not found')
    return null
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      reviewer_telegram_id: reviewerTelegramId,
      reviewed_telegram_id: listing.seller_telegram_id,
      listing_id: listingId,
      rating,
      review_text: reviewText,
      photos: photos || [],
      is_verified_purchase: true,
      purchase_claim_id: claim.claim_id,
      purchased_size: purchasedSize || claim.selected_size,
      purchased_color: purchasedColor || claim.selected_color
    })
    .select(`
      *,
      reviewer:users!reviews_reviewer_telegram_id_fkey(telegram_user_id, first_name, username, photo_url)
    `)
    .single()

  if (error) {
    console.error('Error creating review:', error)
    return null
  }

  // Update seller's rating
  await updateSellerRating(listing.seller_telegram_id)

  return data
}

/**
 * Get reviews for a listing
 */
export async function getListingReviews(listingId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_telegram_id_fkey(telegram_user_id, first_name, username, photo_url)
    `)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting reviews:', error)
    return []
  }

  return data || []
}

/**
 * Get reviews for a seller
 */
export async function getSellerReviews(sellerTelegramId: number): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_telegram_id_fkey(telegram_user_id, first_name, username, photo_url),
      listing:listings(listing_id, title, photos)
    `)
    .eq('reviewed_telegram_id', sellerTelegramId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting seller reviews:', error)
    return []
  }

  return data || []
}

/**
 * Vote on review helpfulness
 */
export async function voteReviewHelpful(
  reviewId: string,
  userTelegramId: number,
  isHelpful: boolean
): Promise<boolean> {
  // Check if user already voted (we could track this in a separate table)
  // For simplicity, just increment the counter
  const column = isHelpful ? 'helpful_count' : 'not_helpful_count'
  
  const { error } = await supabase
    .from('reviews')
    .update({ 
      [column]: supabase.rpc('increment', { x: 1 }) 
    })
    .eq('review_id', reviewId)

  // Fallback: manual increment
  if (error) {
    const { data: review } = await supabase
      .from('reviews')
      .select(column)
      .eq('review_id', reviewId)
      .single()

    if (review) {
      await supabase
        .from('reviews')
        .update({ [column]: (review[column] || 0) + 1 })
        .eq('review_id', reviewId)
    }
  }

  return true
}

/**
 * Seller replies to a review
 */
export async function replyToReview(
  reviewId: string,
  sellerTelegramId: number,
  replyText: string
): Promise<boolean> {
  // Verify seller owns the reviewed listing
  const { data: review } = await supabase
    .from('reviews')
    .select('reviewed_telegram_id')
    .eq('review_id', reviewId)
    .single()

  if (!review || review.reviewed_telegram_id !== sellerTelegramId) {
    console.error('Not authorized to reply to this review')
    return false
  }

  const { error } = await supabase
    .from('reviews')
    .update({
      seller_reply: replyText,
      seller_reply_at: new Date().toISOString()
    })
    .eq('review_id', reviewId)

  if (error) {
    console.error('Error replying to review:', error)
    return false
  }

  return true
}

/**
 * Update seller's average rating
 */
async function updateSellerRating(sellerTelegramId: number): Promise<void> {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewed_telegram_id', sellerTelegramId)

  if (!reviews || reviews.length === 0) return

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  await supabase
    .from('users')
    .update({
      rating_average: Math.round(avgRating * 10) / 10,
      total_reviews: reviews.length
    })
    .eq('telegram_user_id', sellerTelegramId)
}

/**
 * Get review statistics for a listing
 */
export async function getListingReviewStats(listingId: string): Promise<{
  averageRating: number
  totalReviews: number
  distribution: Record<number, number>
  photoReviewsCount: number
  verifiedCount: number
}> {
  const reviews = await getListingReviews(listingId)
  
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let totalRating = 0
  let photoReviewsCount = 0
  let verifiedCount = 0

  reviews.forEach(review => {
    totalRating += review.rating
    distribution[review.rating] = (distribution[review.rating] || 0) + 1
    if (review.photos && review.photos.length > 0) photoReviewsCount++
    if (review.is_verified_purchase) verifiedCount++
  })

  return {
    averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
    totalReviews: reviews.length,
    distribution,
    photoReviewsCount,
    verifiedCount
  }
}
