/**
 * Dashboard Benchmarking API (Benchmark Block)
 * 
 * Compares seller's performance against:
 * - Category average
 * - Similar services
 * - Platform average
 */

import { supabase } from './supabase'
import type { Service } from '../types'

export interface BenchmarkMetrics {
  metric: string
  yourValue: number
  categoryAverage: number
  platformAverage: number
  percentile: number // 0-100 (your rank)
  status: 'above' | 'average' | 'below'
}

export interface ServiceBenchmark {
  serviceId: string
  serviceTitle: string
  category: string
  metrics: BenchmarkMetrics[]
  overallScore: number // 0-100
  recommendations: string[]
}

/**
 * Get benchmark comparison for a service
 */
export async function getServiceBenchmark(
  serviceId: string
): Promise<ServiceBenchmark | null> {
  try {
    // Get service data
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('service_id', serviceId)
      .eq('status', 'active')
      .single()

    if (serviceError || !service) {
      console.error('Error fetching service:', serviceError)
      return null
    }

    // Get service interactions
    const { data: interactions, error: interactionsError } = await supabase
      .from('service_interactions')
      .select('interaction_type')
      .eq('service_id', serviceId)

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError)
      return null
    }

    // Calculate your metrics
    const yourStats = {
      views: (interactions || []).filter(i => i.interaction_type === 'view').length,
      clicks: (interactions || []).filter(i => i.interaction_type === 'click').length,
      contacts: (interactions || []).filter(i => i.interaction_type === 'contact').length,
      orders: (interactions || []).filter(i => i.interaction_type === 'order').length,
    }

    const yourCTR = yourStats.views > 0 ? (yourStats.clicks / yourStats.views) * 100 : 0
    const yourContactRate = yourStats.clicks > 0 ? (yourStats.contacts / yourStats.clicks) * 100 : 0
    const yourConversionRate = yourStats.contacts > 0 ? (yourStats.orders / yourStats.contacts) * 100 : 0

    // Get category average
    const categoryBenchmark = await getCategoryBenchmark(service.category)
    const platformBenchmark = await getPlatformBenchmark()

    // Build metrics
    const metrics: BenchmarkMetrics[] = [
      {
        metric: 'Click-through Rate (CTR)',
        yourValue: yourCTR,
        categoryAverage: categoryBenchmark.ctr,
        platformAverage: platformBenchmark.ctr,
        percentile: calculatePercentile(yourCTR, categoryBenchmark.ctr),
        status: getStatus(yourCTR, categoryBenchmark.ctr),
      },
      {
        metric: 'Contact Rate',
        yourValue: yourContactRate,
        categoryAverage: categoryBenchmark.contactRate,
        platformAverage: platformBenchmark.contactRate,
        percentile: calculatePercentile(yourContactRate, categoryBenchmark.contactRate),
        status: getStatus(yourContactRate, categoryBenchmark.contactRate),
      },
      {
        metric: 'Conversion Rate',
        yourValue: yourConversionRate,
        categoryAverage: categoryBenchmark.conversionRate,
        platformAverage: platformBenchmark.conversionRate,
        percentile: calculatePercentile(yourConversionRate, categoryBenchmark.conversionRate),
        status: getStatus(yourConversionRate, categoryBenchmark.conversionRate),
      },
    ]

    // Calculate overall score
    const overallScore = metrics.reduce((sum, m) => sum + m.percentile, 0) / metrics.length

    // Generate recommendations
    const recommendations = generateRecommendations(metrics, overallScore)

    return {
      serviceId,
      serviceTitle: service.title,
      category: service.category,
      metrics,
      overallScore,
      recommendations,
    }
  } catch (error) {
    console.error('Error generating service benchmark:', error)
    return null
  }
}

/**
 * Get category average metrics
 */
async function getCategoryBenchmark(category: string): Promise<{
  ctr: number
  contactRate: number
  conversionRate: number
}> {
  try {
    // Get all services in this category
    const { data: services, error } = await supabase
      .from('services')
      .select('service_id')
      .eq('category', category)
      .eq('status', 'active')

    if (error || !services || services.length === 0) {
      return { ctr: 10, contactRate: 15, conversionRate: 5 } // Defaults
    }

    const serviceIds = services.map(s => s.service_id)

    // Get interactions for this category
    const { data: interactions, error: interactionsError } = await supabase
      .from('service_interactions')
      .select('interaction_type')
      .in('service_id', serviceIds)

    if (interactionsError || !interactions) {
      return { ctr: 10, contactRate: 15, conversionRate: 5 }
    }

    const stats = {
      views: interactions.filter(i => i.interaction_type === 'view').length,
      clicks: interactions.filter(i => i.interaction_type === 'click').length,
      contacts: interactions.filter(i => i.interaction_type === 'contact').length,
      orders: interactions.filter(i => i.interaction_type === 'order').length,
    }

    const ctr = stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0
    const contactRate = stats.clicks > 0 ? (stats.contacts / stats.clicks) * 100 : 0
    const conversionRate = stats.contacts > 0 ? (stats.orders / stats.contacts) * 100 : 0

    return { ctr, contactRate, conversionRate }
  } catch (error) {
    console.error('Error getting category benchmark:', error)
    return { ctr: 10, contactRate: 15, conversionRate: 5 }
  }
}

/**
 * Get platform average metrics
 */
async function getPlatformBenchmark(): Promise<{
  ctr: number
  contactRate: number
  conversionRate: number
}> {
  try {
    const { data: interactions, error } = await supabase
      .from('service_interactions')
      .select('interaction_type')
      .limit(10000) // Sample size

    if (error || !interactions) {
      return { ctr: 8, contactRate: 12, conversionRate: 4 } // Defaults
    }

    const stats = {
      views: interactions.filter(i => i.interaction_type === 'view').length,
      clicks: interactions.filter(i => i.interaction_type === 'click').length,
      contacts: interactions.filter(i => i.interaction_type === 'contact').length,
      orders: interactions.filter(i => i.interaction_type === 'order').length,
    }

    const ctr = stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0
    const contactRate = stats.clicks > 0 ? (stats.contacts / stats.clicks) * 100 : 0
    const conversionRate = stats.contacts > 0 ? (stats.orders / stats.contacts) * 100 : 0

    return { ctr, contactRate, conversionRate }
  } catch (error) {
    console.error('Error getting platform benchmark:', error)
    return { ctr: 8, contactRate: 12, conversionRate: 4 }
  }
}

function calculatePercentile(yourValue: number, average: number): number {
  if (average === 0) return 50
  const ratio = yourValue / average
  // If you're at average, you're at 50th percentile
  // If you're 2x average, you're at ~75th percentile
  // If you're 0.5x average, you're at ~25th percentile
  return Math.min(100, Math.max(0, (ratio - 0.5) * 50 + 50))
}

function getStatus(yourValue: number, average: number): 'above' | 'average' | 'below' {
  if (yourValue > average * 1.1) return 'above'
  if (yourValue < average * 0.9) return 'below'
  return 'average'
}

function generateRecommendations(metrics: BenchmarkMetrics[], overallScore: number): string[] {
  const recommendations: string[] = []

  for (const metric of metrics) {
    if (metric.status === 'below') {
      if (metric.metric.includes('CTR')) {
        recommendations.push(`CTR past. Title va tavsifni yanada jalb qiluvchi qilish tavsiya etiladi. Potentsial: +${(metric.categoryAverage - metric.yourValue).toFixed(1)}%`)
      } else if (metric.metric.includes('Contact')) {
        recommendations.push(`Aloqa darajasi past. Narxni optimallashtirish yoki qo'shimcha ma'lumot qo'shish tavsiya etiladi.`)
      } else if (metric.metric.includes('Conversion')) {
        recommendations.push(`Konversiya past. Sifatni yaxshilash yoki kafolat berish tavsiya etiladi.`)
      }
    }
  }

  if (overallScore < 40) {
    recommendations.push('Umumiy ko\'rsatkich past. AI orqali teglarni to\'g\'irlash va tavsifni yanada yaxshilash tavsiya etiladi.')
  } else if (overallScore > 70) {
    recommendations.push('Ajoyib! Sizning ko\'rsatkichlaringiz kategoriya o\'rtachasidan yuqori. Boshqa xizmatlarda ham shu strategiyani qo\'llash mumkin.')
  }

  return recommendations
}
