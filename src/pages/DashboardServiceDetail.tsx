/**
 * Dashboard Service Detail Page
 * Detailed view for a specific service with all insights
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import { getService } from '../lib/supabase'
import { getServiceInsights } from '../lib/sellerInsights'
import { getServiceBenchmark } from '../lib/dashboardBenchmark'
import { getServiceRankInfo } from '../lib/dashboardRanking'
import { calculateHealthScore, getHealthScoreBadge } from '../lib/serviceHealthScore'
import type { Service } from '../types'

export default function DashboardServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const [service, setService] = useState<Service | null>(null)
  const [insights, setInsights] = useState<any>(null)
  const [benchmark, setBenchmark] = useState<any>(null)
  const [rankInfo, setRankInfo] = useState<any[]>([])
  const [healthScore, setHealthScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!id || !user) return

      setLoading(true)
      try {
        const [serviceData, insightsData, benchmarkData, rankData] = await Promise.all([
          getService(id),
          getServiceInsights(id),
          getServiceBenchmark(id),
          getServiceRankInfo(id, []),
        ])

        setService(serviceData)
        setInsights(insightsData)
        setBenchmark(benchmarkData)
        setRankInfo(rankData)

        // Calculate health score (Feature 5)
        if (insightsData && benchmarkData) {
          const health = calculateHealthScore(insightsData, benchmarkData, rankData)
          setHealthScore(health)
        }
      } catch (error) {
        console.error('Error loading service detail:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Xizmat topilmadi</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{service.title}</h1>
              <p className="text-sm text-gray-500">Batafsil statistikalar</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Health Score Badge (Feature 5) */}
        {healthScore && (
          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Xizmat Holati</h3>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-gray-900">{healthScore.score}</span>
                  <span className={`px-4 py-2 rounded-full font-medium ${getHealthScoreBadge(healthScore.score).bgColor} ${getHealthScoreBadge(healthScore.score).color}`}>
                    {getHealthScoreBadge(healthScore.score).emoji} {getHealthScoreBadge(healthScore.score).text}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-2">Omillar</div>
                <div className="space-y-1 text-xs">
                  <div>Conversion: {healthScore.factors.conversion}/30</div>
                  <div>Engagement: {healthScore.factors.engagement}/30</div>
                  <div>Completeness: {healthScore.factors.completeness}/20</div>
                  <div>Ranking: {healthScore.factors.ranking}/20</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/service/${id}/edit`)}
            className="flex-1 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark"
          >
            Tahrirlash
          </button>
          <button
            onClick={() => navigate(`/service/${id}`)}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            Ko'rish
          </button>
        </div>

        {/* Summary Cards */}
        {insights && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 mb-1">Ko'rish</p>
              <p className="text-2xl font-bold text-gray-900">{insights.totalViews}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 mb-1">Bosish</p>
              <p className="text-2xl font-bold text-gray-900">{insights.totalClicks}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 mb-1">Aloqa</p>
              <p className="text-2xl font-bold text-gray-900">{insights.totalContacts}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 mb-1">Buyurtma</p>
              <p className="text-2xl font-bold text-gray-900">{insights.totalOrders}</p>
            </div>
          </div>
        )}

        {/* Navigation to other views */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/dashboard/rank')}
            className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition-shadow"
          >
            <p className="font-semibold text-gray-900">Rank</p>
            <p className="text-xs text-gray-500 mt-1">Qidiruv o'rni</p>
          </button>
          <button
            onClick={() => navigate('/dashboard/recommendations')}
            className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition-shadow"
          >
            <p className="font-semibold text-gray-900">Tavsiyalar</p>
            <p className="text-xs text-gray-500 mt-1">AI maslahat</p>
          </button>
          <button
            onClick={() => navigate('/dashboard/benchmark')}
            className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition-shadow"
          >
            <p className="font-semibold text-gray-900">Benchmark</p>
            <p className="text-xs text-gray-500 mt-1">Solishtirish</p>
          </button>
        </div>

        {/* Service Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Xizmat Ma'lumotlari</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Kategoriya</p>
              <p className="font-semibold text-gray-900">{service.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Narx</p>
              <p className="font-semibold text-gray-900">{service.price} {service.price_type === 'hourly' ? '/ soat' : ''}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Teglar</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {(service.tags || []).map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
