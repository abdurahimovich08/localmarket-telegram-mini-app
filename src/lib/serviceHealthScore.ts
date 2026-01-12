/**
 * Service Health Score System (Feature 5)
 * 
 * Calculates overall health score for a service (0-100)
 * Based on multiple factors: conversion, engagement, completeness
 */

import type { ServiceInsights } from './sellerInsights'
import type { ServiceBenchmark } from './dashboardBenchmark'

export interface HealthScore {
  score: number // 0-100
  status: 'healthy' | 'needs_improvement' | 'critical'
  factors: {
    conversion: number // 0-30 points
    engagement: number // 0-30 points
    completeness: number // 0-20 points
    ranking: number // 0-20 points
  }
  recommendations: string[]
}

/**
 * Calculate health score for a service
 */
export function calculateHealthScore(
  insights: ServiceInsights | null,
  benchmark: ServiceBenchmark | null,
  rankInfo: any[] = []
): HealthScore {
  let score = 0
  const factors = {
    conversion: 0,
    engagement: 0,
    completeness: 0,
    ranking: 0,
  }
  const recommendations: string[] = []

  // Factor 1: Conversion Rate (0-30 points)
  if (insights) {
    const conversionRate = insights.overallConversionRate * 100
    if (conversionRate >= 10) {
      factors.conversion = 30
    } else if (conversionRate >= 5) {
      factors.conversion = 20
    } else if (conversionRate >= 2) {
      factors.conversion = 15
    } else if (conversionRate >= 1) {
      factors.conversion = 10
    } else {
      factors.conversion = 5
      recommendations.push('Konversiya juda past. Tavsif va narxni optimallashtirish tavsiya etiladi.')
    }
  }

  // Factor 2: Engagement (0-30 points)
  if (insights) {
    const totalInteractions = insights.totalViews + insights.totalClicks + insights.totalContacts
    if (totalInteractions >= 100) {
      factors.engagement = 30
    } else if (totalInteractions >= 50) {
      factors.engagement = 25
    } else if (totalInteractions >= 20) {
      factors.engagement = 20
    } else if (totalInteractions >= 10) {
      factors.engagement = 15
    } else if (totalInteractions >= 5) {
      factors.engagement = 10
    } else {
      factors.engagement = 5
      recommendations.push('Javob bermayapti. Teglarni yaxshilash yoki kategoriyani tekshirish tavsiya etiladi.')
    }
  }

  // Factor 3: Completeness (0-20 points)
  // Check if service has all required fields
  let completenessPoints = 20
  // Logo (5 points)
  // Portfolio (5 points)
  // Tags count (5 points)
  // Description quality (5 points)
  // For now, we'll use basic heuristics
  if (insights) {
    const tagCount = insights.tagInsights.length
    if (tagCount < 3) {
      completenessPoints -= 5
      recommendations.push('Teglar sonini 3-7 tagacha oshirish tavsiya etiladi.')
    }
  }

  factors.completeness = completenessPoints

  // Factor 4: Ranking (0-20 points)
  if (rankInfo.length > 0) {
    const avgRank = rankInfo.reduce((sum, r) => sum + (r.rank > 50 ? 50 : r.rank), 0) / rankInfo.length
    if (avgRank <= 5) {
      factors.ranking = 20
    } else if (avgRank <= 10) {
      factors.ranking = 15
    } else if (avgRank <= 20) {
      factors.ranking = 10
    } else if (avgRank <= 30) {
      factors.ranking = 5
    } else {
      factors.ranking = 0
      recommendations.push('Qidiruvdagi o\'rningiz past. Teglarni va tavsifni optimallashtirish tavsiya etiladi.')
    }
  } else {
    factors.ranking = 10 // Default if no rank data
  }

  score = factors.conversion + factors.engagement + factors.completeness + factors.ranking

  // Determine status
  let status: HealthScore['status'] = 'healthy'
  if (score < 40) {
    status = 'critical'
  } else if (score < 70) {
    status = 'needs_improvement'
  }

  // Add general recommendations based on score
  if (score < 50) {
    recommendations.unshift('Xizmat holati kritik. AI orqali teglarni to\'g\'irlash va tavsifni yanada yaxshilash tavsiya etiladi.')
  }

  return {
    score,
    status,
    factors,
    recommendations,
  }
}

/**
 * Get health score badge component data
 */
export function getHealthScoreBadge(score: number): {
  text: string
  color: string
  bgColor: string
  emoji: string
} {
  if (score >= 70) {
    return {
      text: 'Healthy',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      emoji: '🟢',
    }
  } else if (score >= 40) {
    return {
      text: 'Needs improvement',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      emoji: '🟡',
    }
  } else {
    return {
      text: 'Critical',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      emoji: '🔴',
    }
  }
}
