/**
 * Seller-facing Insights (Priority 1: Revenue Driver)
 * 
 * Provides sellers with actionable insights about their service tags:
 * - Which tags are working (converting)
 * - Which tags are not working
 * - How to improve
 */

import { supabase } from './supabase'
import type { Service } from '../types'

export interface TagInsight {
  tag: string
  viewCount: number
  clickCount: number
  contactCount: number
  orderCount: number
  clickThroughRate: number
  contactRate: number
  conversionRate: number
  performance: 'excellent' | 'good' | 'average' | 'poor'
  recommendation: string
}

export interface ServiceInsights {
  serviceId: string
  serviceTitle: string
  totalViews: number
  totalClicks: number
  totalContacts: number
  totalOrders: number
  overallConversionRate: number
  tagInsights: TagInsight[]
  topPerformingTags: string[]
  underperformingTags: string[]
  suggestions: string[]
}

/**
 * Get comprehensive insights for a seller's service
 */
export async function getServiceInsights(
  serviceId: string
): Promise<ServiceInsights | null> {
  try {
    // Get service data
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('service_id', serviceId)
      .single()

    if (serviceError || !service) {
      console.error('Error fetching service:', serviceError)
      return null
    }

    // Get all interactions for this service
    const { data: interactions, error: interactionsError } = await supabase
      .from('service_interactions')
      .select('*')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false })

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError)
      return null
    }

    // Aggregate by tag
    const tagStats = new Map<string, {
      views: number
      clicks: number
      contacts: number
      orders: number
    }>()

    let totalViews = 0
    let totalClicks = 0
    let totalContacts = 0
    let totalOrders = 0

    for (const interaction of interactions || []) {
      const tags = interaction.matched_tags || []
      const type = interaction.interaction_type

      // Count totals
      if (type === 'view') totalViews++
      if (type === 'click') totalClicks++
      if (type === 'contact') totalContacts++
      if (type === 'order') totalOrders++

      // Count by tag
      for (const tag of tags) {
        if (!tagStats.has(tag)) {
          tagStats.set(tag, { views: 0, clicks: 0, contacts: 0, orders: 0 })
        }

        const stats = tagStats.get(tag)!
        if (type === 'view') stats.views++
        if (type === 'click') stats.clicks++
        if (type === 'contact') stats.contacts++
        if (type === 'order') stats.orders++
      }
    }

    // Calculate insights for each tag
    const tagInsights: TagInsight[] = []
    const serviceTags = (service.tags || []) as string[]

    for (const tag of serviceTags) {
      const stats = tagStats.get(tag) || { views: 0, clicks: 0, contacts: 0, orders: 0 }
      
      const ctr = stats.views > 0 ? stats.clicks / stats.views : 0
      const contactRate = stats.clicks > 0 ? stats.contacts / stats.clicks : 0
      const conversionRate = stats.contacts > 0 ? stats.orders / stats.contacts : 0

      // Determine performance level
      let performance: TagInsight['performance'] = 'poor'
      let recommendation = ''

      if (ctr > 0.3 && contactRate > 0.2 && conversionRate > 0.1) {
        performance = 'excellent'
        recommendation = 'Bu teg juda yaxshi ishlayapti. Boshqa xizmatlarda ham ishlatishni tavsiya qilamiz.'
      } else if (ctr > 0.2 && contactRate > 0.15) {
        performance = 'good'
        recommendation = 'Bu teg yaxshi natija ko\'rsatmoqda. Tavsifni yanada yaxshilash mumkin.'
      } else if (ctr > 0.1 || contactRate > 0.1) {
        performance = 'average'
        recommendation = 'Bu teg o\'rtacha natija ko\'rsatmoqda. Tavsif yoki narxni optimallashtirish tavsiya etiladi.'
      } else {
        performance = 'poor'
        recommendation = 'Bu teg past natija ko\'rsatmoqda. Boshqa, aniqroq teglarni qo\'shish yoki bu tegni o\'zgartirish tavsiya etiladi.'
      }

      tagInsights.push({
        tag,
        viewCount: stats.views,
        clickCount: stats.clicks,
        contactCount: stats.contacts,
        orderCount: stats.orders,
        clickThroughRate: ctr,
        contactRate,
        conversionRate,
        performance,
        recommendation,
      })
    }

    // Sort by performance
    tagInsights.sort((a, b) => {
      const scoreA = a.clickThroughRate * 0.3 + a.contactRate * 0.4 + a.conversionRate * 0.3
      const scoreB = b.clickThroughRate * 0.3 + b.contactRate * 0.4 + b.conversionRate * 0.3
      return scoreB - scoreA
    })

    // Get top and underperforming tags
    const topPerformingTags = tagInsights
      .filter(insight => insight.performance === 'excellent' || insight.performance === 'good')
      .slice(0, 3)
      .map(insight => insight.tag)

    const underperformingTags = tagInsights
      .filter(insight => insight.performance === 'poor')
      .map(insight => insight.tag)

    // Generate suggestions
    const suggestions: string[] = []
    const overallConversion = totalViews > 0 ? totalOrders / totalViews : 0

    if (overallConversion < 0.05) {
      suggestions.push('Umumiy konversiya past. Tavsifni yanada jalb qiluvchi qilish tavsiya etiladi.')
    }

    if (underperformingTags.length > 0) {
      suggestions.push(`${underperformingTags.length} ta teg past natija ko\'rsatmoqda. Ularni o\'zgartirish yoki olib tashlashni ko\'rib chiqing.`)
    }

    if (topPerformingTags.length === 0) {
      suggestions.push('Hech qanday teg yaxshi natija ko\'rsatmayapti. AI orqali teglarni to\'g\'irlashni tavsiya qilamiz.')
    } else {
      suggestions.push(`${topPerformingTags.length} ta teg yaxshi ishlayapti. Ushbu teglarni boshqa xizmatlarda ham ishlatish mumkin.`)
    }

    return {
      serviceId,
      serviceTitle: service.title,
      totalViews,
      totalClicks,
      totalContacts,
      totalOrders,
      overallConversionRate: overallConversion,
      tagInsights,
      topPerformingTags,
      underperformingTags,
      suggestions,
    }
  } catch (error) {
    console.error('Error generating service insights:', error)
    return null
  }
}

/**
 * Get insights for all seller's services
 */
export async function getSellerInsights(
  providerTelegramId: number
): Promise<ServiceInsights[]> {
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('service_id')
      .eq('provider_telegram_id', providerTelegramId)
      .eq('status', 'active')

    if (error || !services) {
      console.error('Error fetching seller services:', error)
      return []
    }

    const insights = await Promise.all(
      services.map(service => getServiceInsights(service.service_id))
    )

    return insights.filter((insight): insight is ServiceInsights => insight !== null)
  } catch (error) {
    console.error('Error generating seller insights:', error)
    return []
  }
}
