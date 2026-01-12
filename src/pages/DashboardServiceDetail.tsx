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
  const [showHealthBreakdown, setShowHealthBreakdown] = useState(false)
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
        {/* Health Score Badge with Breakdown View (Feature A) */}
        {healthScore && (
          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-200">
            <button
              onClick={() => setShowHealthBreakdown(!showHealthBreakdown)}
              className="w-full"
            >
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
                  <div className="text-xs text-gray-500 mb-2">Umumiy ball</div>
                  <div className="text-lg font-bold text-gray-900">{healthScore.score}/100</div>
                </div>
              </div>
            </button>

            {/* Breakdown View (Feature A) */}
            {showHealthBreakdown && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                <h4 className="font-semibold text-gray-900 mb-3">Batafsil Tahlil</h4>
                
                {/* Conversion */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Conversion</span>
                    <span className={`text-sm font-semibold ${healthScore.factors.conversion >= 20 ? 'text-green-600' : healthScore.factors.conversion >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {healthScore.factors.conversion}/30
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        healthScore.factors.conversion >= 20 ? 'bg-green-500' : 
                        healthScore.factors.conversion >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(healthScore.factors.conversion / 30) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {healthScore.factors.conversion >= 20 ? '✅ Yaxshi' : 
                     healthScore.factors.conversion >= 10 ? '⚠️ O\'rtacha' : 
                     '❌ Yaxshilash kerak'} - Konversiya darajasi
                  </p>
                </div>

                {/* Engagement */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Engagement</span>
                    <span className={`text-sm font-semibold ${healthScore.factors.engagement >= 20 ? 'text-green-600' : healthScore.factors.engagement >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {healthScore.factors.engagement}/30
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        healthScore.factors.engagement >= 20 ? 'bg-green-500' : 
                        healthScore.factors.engagement >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(healthScore.factors.engagement / 30) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {healthScore.factors.engagement >= 20 ? '✅ Yaxshi' : 
                     healthScore.factors.engagement >= 10 ? '⚠️ O\'rtacha' : 
                     '❌ Yaxshilash kerak'} - Foydalanuvchi interaksiyasi
                  </p>
                </div>

                {/* Completeness */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Completeness</span>
                    <span className={`text-sm font-semibold ${healthScore.factors.completeness >= 15 ? 'text-green-600' : healthScore.factors.completeness >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {healthScore.factors.completeness}/20
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        healthScore.factors.completeness >= 15 ? 'bg-green-500' : 
                        healthScore.factors.completeness >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(healthScore.factors.completeness / 20) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {healthScore.factors.completeness >= 15 ? '✅ To\'liq' : 
                     healthScore.factors.completeness >= 10 ? '⚠️ Qisman' : 
                     '❌ Yaxshilash kerak'} - Ma'lumot to'liqligi
                  </p>
                </div>

                {/* Ranking */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Ranking</span>
                    <span className={`text-sm font-semibold ${healthScore.factors.ranking >= 15 ? 'text-green-600' : healthScore.factors.ranking >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {healthScore.factors.ranking}/20
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        healthScore.factors.ranking >= 15 ? 'bg-green-500' : 
                        healthScore.factors.ranking >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(healthScore.factors.ranking / 20) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {healthScore.factors.ranking >= 15 ? '✅ Yuqori' : 
                     healthScore.factors.ranking >= 10 ? '⚠️ O\'rtacha' : 
                     '❌ Yaxshilash kerak'} - Qidiruvdagi o'rni
                  </p>
                </div>

                {/* Recommendations from health score */}
                {healthScore.recommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Tavsiyalar:</p>
                    <ul className="space-y-1">
                      {healthScore.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
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
