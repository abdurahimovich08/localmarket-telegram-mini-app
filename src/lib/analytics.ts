/**
 * Listing Analytics
 * Track and retrieve analytics for seller listings
 */

import { supabase } from './supabase'

export interface ListingAnalytics {
  listing_id: string
  total_views: number
  unique_viewers: number
  favorite_count: number
  search_impressions: number
  engagement_rate: number
  views_last_7_days: number
  views_last_30_days: number
  created_at: string
}

/**
 * Get analytics for a single listing
 */
export const getListingAnalytics = async (
  listingId: string
): Promise<ListingAnalytics | null> => {
  try {
    // Get total views
    const { data: viewsData, error: viewsError } = await supabase
      .from('user_listing_interactions')
      .select('user_telegram_id, created_at')
      .eq('listing_id', listingId)
      .eq('interaction_type', 'view')

    if (viewsError) {
      console.error('Error fetching views:', viewsError)
    }

    // Get unique viewers
    const uniqueViewers = new Set(viewsData?.map(v => v.user_telegram_id) || []).size

    // Get views in last 7 and 30 days
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const viewsLast7Days = viewsData?.filter(v => 
      new Date(v.created_at) >= sevenDaysAgo
    ).length || 0

    const viewsLast30Days = viewsData?.filter(v => 
      new Date(v.created_at) >= thirtyDaysAgo
    ).length || 0

    // Get favorite count
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select('favorite_count, created_at')
      .eq('listing_id', listingId)
      .single()

    if (listingError) {
      console.error('Error fetching listing:', listingError)
    }

    const favoriteCount = listingData?.favorite_count || 0

    // Get search impressions (how many times this listing appeared in search results)
    // This is approximated by checking how many searches matched this listing's keywords
    const { data: listingDetails } = await supabase
      .from('listings')
      .select('title, description, category')
      .eq('listing_id', listingId)
      .single()

    let searchImpressions = 0
    if (listingDetails) {
      const keywords = `${listingDetails.title} ${listingDetails.description}`
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2)
        .slice(0, 10)

      // Count searches that might match this listing
      const { count } = await supabase
        .from('user_searches')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())
        .or(keywords.map(k => `search_query.ilike.%${k}%`).join(','))
        .limit(1)

      searchImpressions = count || 0
    }

    // Calculate engagement rate (favorites / views)
    const totalViews = viewsData?.length || 0
    const engagementRate = totalViews > 0 
      ? ((favoriteCount / totalViews) * 100).toFixed(1)
      : '0.0'

    return {
      listing_id: listingId,
      total_views: totalViews,
      unique_viewers: uniqueViewers,
      favorite_count: favoriteCount,
      search_impressions: searchImpressions,
      engagement_rate: parseFloat(engagementRate),
      views_last_7_days: viewsLast7Days,
      views_last_30_days: viewsLast30Days,
      created_at: listingData?.created_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('Error getting listing analytics:', error)
    return null
  }
}

/**
 * Get analytics for all listings of a seller
 */
export const getSellerAnalytics = async (
  sellerTelegramId: number
): Promise<Record<string, ListingAnalytics>> => {
  try {
    // Get all listings by this seller
    const { data: listings, error } = await supabase
      .from('listings')
      .select('listing_id')
      .eq('seller_telegram_id', sellerTelegramId)
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching seller listings:', error)
      return {}
    }

    // Get analytics for each listing
    const analyticsPromises = listings.map(listing =>
      getListingAnalytics(listing.listing_id)
    )

    const analyticsResults = await Promise.all(analyticsPromises)

    // Create a map of listing_id -> analytics
    const analyticsMap: Record<string, ListingAnalytics> = {}
    analyticsResults.forEach(analytics => {
      if (analytics) {
        analyticsMap[analytics.listing_id] = analytics
      }
    })

    return analyticsMap
  } catch (error) {
    console.error('Error getting seller analytics:', error)
    return {}
  }
}
