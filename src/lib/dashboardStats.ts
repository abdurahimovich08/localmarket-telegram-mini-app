/**
 * Dashboard Statistics API (Overview Block)
 * 
 * Provides aggregated stats for seller dashboard:
 * - Views, clicks, contacts, orders
 * - Growth percentages
 * - Period comparisons (7 days, 30 days)
 */

import { supabase } from './supabase'

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
 * Get dashboard overview stats for a seller
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

    // Get services for this seller
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('service_id')
      .eq('provider_telegram_id', providerTelegramId)
      .eq('status', 'active')

    if (servicesError || !services) {
      console.error('Error fetching services:', servicesError)
      return null
    }

    const serviceIds = services.map(s => s.service_id)

    // Get today's stats (for mini-panel)
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const { data: todayInteractions } = await supabase
      .from('service_interactions')
      .select('interaction_type')
      .in('service_id', serviceIds.length > 0 ? serviceIds : [''])
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', now.toISOString())

    const today = {
      views: (todayInteractions || []).filter((i: any) => i.interaction_type === 'view').length,
      clicks: (todayInteractions || []).filter((i: any) => i.interaction_type === 'click').length,
      contacts: (todayInteractions || []).filter((i: any) => i.interaction_type === 'contact').length,
      orders: (todayInteractions || []).filter((i: any) => i.interaction_type === 'order').length,
    }

    if (serviceIds.length === 0) {
      // No services yet
      return {
        period,
        today,
        views: { current: 0, previous: 0, growth: 0 },
        clicks: { current: 0, previous: 0, growth: 0 },
        contacts: { current: 0, previous: 0, growth: 0 },
        orders: { current: 0, previous: 0, growth: 0 },
        conversionRate: 0,
        services: { total: 0, active: 0 },
      }
    }

    // Get current period interactions
    const { data: currentInteractions, error: currentError } = await supabase
      .from('service_interactions')
      .select('interaction_type')
      .in('service_id', serviceIds)
      .gte('created_at', currentStart.toISOString())
      .lte('created_at', now.toISOString())

    // Get previous period interactions
    const { data: previousInteractions, error: previousError } = await supabase
      .from('service_interactions')
      .select('interaction_type')
      .in('service_id', serviceIds)
      .gte('created_at', previousStart.toISOString())
      .lt('created_at', currentStart.toISOString())

    if (currentError || previousError) {
      console.error('Error fetching interactions:', currentError || previousError)
      return null
    }

    // Aggregate current period
    const current = {
      views: (currentInteractions || []).filter(i => i.interaction_type === 'view').length,
      clicks: (currentInteractions || []).filter(i => i.interaction_type === 'click').length,
      contacts: (currentInteractions || []).filter(i => i.interaction_type === 'contact').length,
      orders: (currentInteractions || []).filter(i => i.interaction_type === 'order').length,
    }

    // Aggregate previous period
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
        total: services.length,
        active: services.length,
      },
    }

    return overview
  } catch (error) {
    console.error('Error generating dashboard overview:', error)
    return null
  }
}
