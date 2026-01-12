/**
 * Dashboard Statistics API (Overview Block)
 * 
 * Phase 3: Unified analytics - includes services, products, and store products
 * Provides aggregated stats for seller dashboard:
 * - Views, clicks, contacts, orders
 * - Growth percentages
 * - Period comparisons (7 days, 30 days)
 */

import { supabase } from './supabase'
import { getUserUnifiedListings } from './unifiedListingFeedback'

export interface DashboardOverview {
  period: '7d' | '30d'
  today?: {
    views: number
    clicks: number
    contacts: number
    orders: number
  }
  views: {
    current: number
    previous: number
    growth: number // percentage
  }
  clicks: {
    current: number
    previous: number
    growth: number
  }
  contacts: {
    current: number
    previous: number
    growth: number
  }
  orders: {
    current: number
    previous: number
    growth: number
  }
  conversionRate: number // orders / views
  services: {
    total: number
    active: number
  }
}

/**
 * Get dashboard overview stats for a seller (Phase 3: Unified - services + products + store products)
 */
export async function getDashboardOverview(
  providerTelegramId: number,
  period: '7d' | '30d' = '7d'
): Promise<DashboardOverview | null> {
  try {
    const days = period === '7d' ? 7 : 30
    const now = new Date()
    const currentStart = new Date(now)
    currentStart.setDate(currentStart.getDate() - days)
    
    const previousStart = new Date(currentStart)
    previousStart.setDate(previousStart.getDate() - days)

    // Get unified listings (Phase 3: services + products + store products)
    const unifiedListings = await getUserUnifiedListings(providerTelegramId)
    
    // Debug logging
    console.log('[DashboardStats] Unified listings count:', unifiedListings.length)
    console.log('[DashboardStats] Listing types:', {
      services: unifiedListings.filter(l => l.type === 'service').length,
      products: unifiedListings.filter(l => l.type === 'product').length,
      storeProducts: unifiedListings.filter(l => l.type === 'store_product').length,
    })
    
    if (!unifiedListings || unifiedListings.length === 0) {
      console.log('[DashboardStats] No unified listings found for user:', providerTelegramId)
      return {
        period,
        today: { views: 0, clicks: 0, contacts: 0, orders: 0 },
        views: { current: 0, previous: 0, growth: 0 },
        clicks: { current: 0, previous: 0, growth: 0 },
        contacts: { current: 0, previous: 0, growth: 0 },
        orders: { current: 0, previous: 0, growth: 0 },
        conversionRate: 0,
        services: { total: 0, active: 0 },
      }
    }

    // Get all listing IDs (services + products + store products)
    const allListingIds = unifiedListings.map(l => l.listing_id)
    console.log('[DashboardStats] All listing IDs:', allListingIds.length)

    // Get today's stats (for mini-panel)
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const { data: todayInteractions, error: todayError } = await supabase
      .from('listing_interactions')
      .select('interaction_type')
      .in('listing_id', allListingIds.length > 0 ? allListingIds : [''])
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', now.toISOString())

    if (todayError) {
      console.error('[DashboardStats] Error fetching today interactions:', todayError)
      // If table doesn't exist, this is expected - user needs to run migration
    }

    const today = {
      views: (todayInteractions || []).filter((i: any) => i.interaction_type === 'view').length,
      clicks: (todayInteractions || []).filter((i: any) => i.interaction_type === 'click').length,
      contacts: (todayInteractions || []).filter((i: any) => i.interaction_type === 'contact').length,
      orders: (todayInteractions || []).filter((i: any) => i.interaction_type === 'order').length,
    }

    // Get current period interactions (unified)
    const { data: currentInteractions, error: currentError } = await supabase
      .from('listing_interactions')
      .select('interaction_type')
      .in('listing_id', allListingIds)
      .gte('created_at', currentStart.toISOString())
      .lte('created_at', now.toISOString())

    // Get previous period interactions (for growth)
    const { data: previousInteractions, error: previousError } = await supabase
      .from('listing_interactions')
      .select('interaction_type')
      .in('listing_id', allListingIds)
      .gte('created_at', previousStart.toISOString())
      .lt('created_at', currentStart.toISOString())

    if (currentError || previousError) {
      console.error('[DashboardStats] Error fetching interactions:', currentError || previousError)
      // If table doesn't exist, return empty stats but don't fail
      // User needs to run database migration
    }

    // Calculate current period metrics
    const current = {
      views: (currentInteractions || []).filter(i => i.interaction_type === 'view').length,
      clicks: (currentInteractions || []).filter(i => i.interaction_type === 'click').length,
      contacts: (currentInteractions || []).filter(i => i.interaction_type === 'contact').length,
      orders: (currentInteractions || []).filter(i => i.interaction_type === 'order').length,
    }

    // Calculate previous period metrics
    const previous = {
      views: (previousInteractions || []).filter(i => i.interaction_type === 'view').length,
      clicks: (previousInteractions || []).filter(i => i.interaction_type === 'click').length,
      contacts: (previousInteractions || []).filter(i => i.interaction_type === 'contact').length,
      orders: (previousInteractions || []).filter(i => i.interaction_type === 'order').length,
    }

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    // Count services (for backward compatibility)
    const servicesCount = unifiedListings.filter(l => l.type === 'service').length
    const productsCount = unifiedListings.filter(l => l.type === 'product').length
    const storeProductsCount = unifiedListings.filter(l => l.type === 'store_product').length

    console.log('[DashboardStats] Overview:', {
      totalListings: unifiedListings.length,
      servicesCount,
      productsCount,
      storeProductsCount,
      currentInteractions: current.views + current.clicks + current.contacts + current.orders,
    })

    const overview: DashboardOverview = {
      period,
      today,
      views: {
        current: current.views,
        previous: previous.views,
        growth: calculateGrowth(current.views, previous.views),
      },
      clicks: {
        current: current.clicks,
        previous: previous.clicks,
        growth: calculateGrowth(current.clicks, previous.clicks),
      },
      contacts: {
        current: current.contacts,
        previous: previous.contacts,
        growth: calculateGrowth(current.contacts, previous.contacts),
      },
      orders: {
        current: current.orders,
        previous: previous.orders,
        growth: calculateGrowth(current.orders, previous.orders),
      },
      conversionRate: current.views > 0 ? (current.orders / current.views) * 100 : 0,
      services: {
        total: servicesCount + productsCount + storeProductsCount, // Show total listings
        active: servicesCount + productsCount + storeProductsCount,
      },
    }

    return overview
  } catch (error) {
    console.error('[DashboardStats] Error generating dashboard overview:', error)
    return null
  }
}

/**
 * Get today's stats for mini-panel
 */
export async function getTodayStats(providerTelegramId: number): Promise<{
  views: number
  clicks: number
  contacts: number
  orders: number
} | null> {
  try {
    const unifiedListings = await getUserUnifiedListings(providerTelegramId)
    if (!unifiedListings || unifiedListings.length === 0) {
      return { views: 0, clicks: 0, contacts: 0, orders: 0 }
    }

    const allListingIds = unifiedListings.map(l => l.listing_id)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const now = new Date()

    const { data: interactions, error } = await supabase
      .from('listing_interactions')
      .select('interaction_type')
      .in('listing_id', allListingIds)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', now.toISOString())

    if (error) {
      console.error('Error fetching today stats:', error)
      return null
    }

    return {
      views: (interactions || []).filter(i => i.interaction_type === 'view').length,
      clicks: (interactions || []).filter(i => i.interaction_type === 'click').length,
      contacts: (interactions || []).filter(i => i.interaction_type === 'contact').length,
      orders: (interactions || []).filter(i => i.interaction_type === 'order').length,
    }
  } catch (error) {
    console.error('Error getting today stats:', error)
    return null
  }
}
