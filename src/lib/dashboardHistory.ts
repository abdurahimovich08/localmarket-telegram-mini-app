/**
 * Dashboard History & Streak System (Feature C: Gamification)
 * 
 * Tracks:
 * - Health score history (7-day streak)
 * - Rank improvement charts
 * - Dashboard visit streaks
 */

import { supabase } from './supabase'
import { calculateHealthScore } from './serviceHealthScore'
import { getServiceInsights } from './sellerInsights'
import { getServiceBenchmark } from './dashboardBenchmark'
import { getServiceRankInfo } from './dashboardRanking'

export interface HealthHistory {
  date: string
  score: number
  status: 'healthy' | 'needs_improvement' | 'critical'
}

export interface RankHistory {
  date: string
  query: string
  rank: number
  change: number
}

export interface DashboardStreak {
  currentStreak: number // Days in a row
  longestStreak: number
  healthStreak: number // Days with health > 70
  lastVisitDate: string
}

/**
 * Record dashboard visit
 */
export async function recordDashboardVisit(userTelegramId: number): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    
    // Check if already recorded today
    const { data: existing } = await supabase
      .from('dashboard_visits')
      .select('id')
      .eq('user_telegram_id', userTelegramId)
      .eq('visit_date', today)
      .single()

    if (!existing) {
      // Record new visit
      await supabase
        .from('dashboard_visits')
        .insert({
          user_telegram_id: userTelegramId,
          visit_date: today,
        })
    }
  } catch (error) {
    console.error('Error recording dashboard visit:', error)
    // Don't throw - non-critical
  }
}

/**
 * Get dashboard streak
 */
export async function getDashboardStreak(userTelegramId: number): Promise<DashboardStreak> {
  try {
    const { data: visits, error } = await supabase
      .from('dashboard_visits')
      .select('visit_date')
      .eq('user_telegram_id', userTelegramId)
      .order('visit_date', { ascending: false })
      .limit(30)

    if (error || !visits || visits.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        healthStreak: 0,
        lastVisitDate: '',
      }
    }

    // Calculate current streak
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < visits.length; i++) {
      const visitDate = new Date(visits[i].visit_date)
      visitDate.setHours(0, 0, 0, 0)
      const daysDiff = Math.floor((today.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === i) {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 1
    let tempStreak = 1
    for (let i = 1; i < visits.length; i++) {
      const prevDate = new Date(visits[i - 1].visit_date)
      const currDate = new Date(visits[i].visit_date)
      const daysDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }

    return {
      currentStreak,
      longestStreak,
      healthStreak: 0, // Will be calculated separately
      lastVisitDate: visits[0]?.visit_date || '',
    }
  } catch (error) {
    console.error('Error getting dashboard streak:', error)
    return {
      currentStreak: 0,
      longestStreak: 0,
      healthStreak: 0,
      lastVisitDate: '',
    }
  }
}

/**
 * Get health score history (last 7 days)
 */
export async function getHealthScoreHistory(
  serviceId: string,
  days: number = 7
): Promise<HealthHistory[]> {
  try {
    // For now, we'll calculate current health and return sample data
    // In production, you'd query a health_history table
    const [insights, benchmark, rankInfo] = await Promise.all([
      getServiceInsights(serviceId),
      getServiceBenchmark(serviceId),
      getServiceRankInfo(serviceId, []),
    ])

    if (!insights || !benchmark) {
      return []
    }

    const currentHealth = calculateHealthScore(insights, benchmark, rankInfo)
    const history: HealthHistory[] = []

    // Generate history (in production, query actual historical data)
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      // Simulate slight variations (in production, use real data)
      const variation = (Math.random() - 0.5) * 10
      const score = Math.max(0, Math.min(100, currentHealth.score + variation))

      history.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(score),
        status: score >= 70 ? 'healthy' : score >= 40 ? 'needs_improvement' : 'critical',
      })
    }

    return history
  } catch (error) {
    console.error('Error getting health score history:', error)
    return []
  }
}

/**
 * Get health streak (consecutive days with health > 70)
 */
export async function getHealthStreak(serviceId: string): Promise<number> {
  try {
    const history = await getHealthScoreHistory(serviceId, 30)
    
    let streak = 0
    for (const day of history.reverse()) {
      if (day.status === 'healthy') {
        streak++
      } else {
        break
      }
    }

    return streak
  } catch (error) {
    console.error('Error getting health streak:', error)
    return 0
  }
}

/**
 * Get rank improvement history
 */
export async function getRankHistory(
  serviceId: string,
  days: number = 7
): Promise<RankHistory[]> {
  try {
    // In production, query rank_history table
    // For now, return empty array
    return []
  } catch (error) {
    console.error('Error getting rank history:', error)
    return []
  }
}
