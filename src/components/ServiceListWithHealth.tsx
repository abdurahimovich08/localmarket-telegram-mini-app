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
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import type { Service } from '../types'

interface ServiceListWithHealthProps {
  services: Service[]
  navigate: (path: string) => void
}

export default function ServiceListWithHealth({ services, navigate }: ServiceListWithHealthProps) {
  const [healthScores, setHealthScores] = useState<Record<string, any>>({})
  const [expandedService, setExpandedService] = useState<string | null>(null)
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
              <div
                key={service.service_id}
                className="rounded-lg border border-gray-200 hover:border-primary transition-colors"
              >
                <button
                  onClick={() => setExpandedService(expandedService === service.service_id ? null : service.service_id)}
                  className="w-full text-left p-4 hover:bg-primary/5 transition-colors"
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/dashboard/services/${service.service_id}`)
                        }}
                        className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        Batafsil
                      </button>
                      {expandedService === service.service_id ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Health Breakdown (Feature A) */}
                {expandedService === service.service_id && health && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-200">
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Conversion</span>
                          <span className="font-semibold">{health.factors.conversion}/30</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${(health.factors.conversion / 30) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Engagement</span>
                          <span className="font-semibold">{health.factors.engagement}/30</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${(health.factors.engagement / 30) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Completeness</span>
                          <span className="font-semibold">{health.factors.completeness}/20</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${(health.factors.completeness / 20) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Ranking</span>
                          <span className="font-semibold">{health.factors.ranking}/20</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500"
                            style={{ width: `${(health.factors.ranking / 20) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
