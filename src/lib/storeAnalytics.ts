/**
 * Store Analytics - CRO Event Tracking
 * 
 * Tracks all conversion-related events for StoreDetail page
 */

import { supabase } from './supabase'

export type StoreEventType = 
  | 'store_view'
  | 'product_impression'
  | 'product_click'
  | 'add_to_cart'
  | 'open_cart'
  | 'checkout_start'
  | 'search_store'
  | 'category_select'
  | 'cross_sell_click'
  | 'floating_cart_click'
  | 'subscribe_store'
  | 'trust_score_view'

export interface StoreEvent {
  event_type: StoreEventType
  store_id: string
  user_telegram_id?: number
  listing_id?: string
  metadata?: Record<string, any>
}

/**
 * Track store event
 */
export async function trackStoreEvent(event: StoreEvent): Promise<void> {
  try {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Store Analytics]', event)
    }

    // Store in localStorage for batch upload (optional)
    const events = JSON.parse(localStorage.getItem('store_analytics_events') || '[]')
    events.push({
      ...event,
      timestamp: new Date().toISOString()
    })
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.shift()
    }
    
    localStorage.setItem('store_analytics_events', JSON.stringify(events))

    // Send to Supabase (non-blocking)
    supabase.from('dashboard_analytics').insert({
      event_type: event.event_type,
      store_id: event.store_id,
      user_telegram_id: event.user_telegram_id || null,
      listing_id: event.listing_id || null,
      metadata: event.metadata || {},
      created_at: new Date().toISOString()
    }).catch(err => {
      console.error('Error tracking store event:', err)
      // Don't throw - tracking is non-critical
    })
  } catch (error) {
    console.error('Error in trackStoreEvent:', error)
    // Don't throw - tracking is non-critical
  }
}

/**
 * Track product impression (when product appears in viewport)
 */
export function trackProductImpression(storeId: string, listingId: string, userId?: number) {
  trackStoreEvent({
    event_type: 'product_impression',
    store_id: storeId,
    listing_id: listingId,
    user_telegram_id: userId
  })
}

/**
 * Track add to cart
 */
export function trackAddToCart(storeId: string, listingId: string, userId?: number) {
  trackStoreEvent({
    event_type: 'add_to_cart',
    store_id: storeId,
    listing_id: listingId,
    user_telegram_id: userId,
    metadata: {
      source: 'store_detail'
    }
  })
}

/**
 * Track cross-sell click
 */
export function trackCrossSellClick(storeId: string, listingId: string, userId?: number) {
  trackStoreEvent({
    event_type: 'cross_sell_click',
    store_id: storeId,
    listing_id: listingId,
    user_telegram_id: userId
  })
}
