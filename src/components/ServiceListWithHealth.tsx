/**
 * Service List with Health Score Component (Feature 5)
 * Shows services with health score badges
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getServiceInsights } from '../lib/sellerInsights'
import { getServiceBenchmark } from '../lib/dashboardBenchmark'
import { getServiceRankInfo } from '../lib/dashboardRanking'
import { calculateHealthScore, getHealthScoreBadge } from '../lib/serviceHealthScore'
import type { Service } from '../types'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'

interface ServiceListWithHealthProps {
  services: Service[]
  navigate: (path: string) => void
}

export default function ServiceListWithHealth({ services, navigate }: ServiceListWithHealthProps) {
  const [healthScores, setHealthScores] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHealthScores = async () => {
      if (services.length === 0) {
        setLoading(false)
        return
      }

      const scores: Record<string, any> = {}
      
      // Load health scores for all services in parallel
      await Promise.all(
        services.map(async (service) => {
          try {
            const [insights, benchmark, rankInfo] = await Promise.all([
              getServiceInsights(service.service_id),
              getServiceBenchmark(service.service_id),
              getServiceRankInfo(service.service_id, []),
            ])

            if (insights && benchmark) {
              const health = calculateHealthScore(insights, benchmark, rankInfo)
              scores[service.service_id] = health
            }
          } catch (error) {
            console.error(`Error loading health score for ${service.service_id}:`, error)
          }
        })
      )

      setHealthScores(scores)
      setLoading(false)
    }

    loadHealthScores()
  }, [services])

  if (services.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Xizmatlarim</h2>
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => {
            const health = healthScores[service.service_id]
            const badge = health ? getHealthScoreBadge(health.score) : null

            return (
              <button
                key={service.service_id}
                onClick={() => navigate(`/dashboard/services/${service.service_id}`)}
                className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{service.title}</h3>
                      {badge && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${badge.bgColor} ${badge.color}`}>
                          {badge.emoji} {health.score}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {service.view_count} ko'rish • {service.category}
                    </p>
                  </div>
                  <ArrowTrendingUpIcon className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
