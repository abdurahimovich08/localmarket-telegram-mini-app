/**
 * Dashboard AI Recommendations Page (Block 3)
 * Actionable insights: what tags work, what to change
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import { getServiceInsights } from '../lib/sellerInsights'
import { getUserServices } from '../lib/supabase'
import type { Service } from '../types'
import { LightBulbIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function DashboardRecommendations() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      setLoading(true)
      try {
        const userServices = await getUserServices(user.telegram_user_id)
        setServices(userServices || [])
        
        if (userServices && userServices.length > 0) {
          setSelectedService(userServices[0])
          const serviceInsights = await getServiceInsights(userServices[0].service_id)
          setInsights(serviceInsights)
        }
      } catch (error) {
        console.error('Error loading recommendations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const handleServiceChange = async (service: Service) => {
    setSelectedService(service)
    setLoading(true)
    try {
      const serviceInsights = await getServiceInsights(service.service_id)
      setInsights(serviceInsights)
    } catch (error) {
      console.error('Error loading insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return 'text-green-600 bg-green-50'
      case 'good':
        return 'text-blue-600 bg-blue-50'
      case 'average':
        return 'text-yellow-600 bg-yellow-50'
      case 'poor':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Iltimos, tizimga kiring</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <LightBulbIcon className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Tavsiyalar</h1>
              <p className="text-sm text-gray-500">Nima qilish kerak</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Service Selector */}
        {services.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xizmatni tanlang
            </label>
            <select
              value={selectedService?.service_id || ''}
              onChange={(e) => {
                const service = services.find(s => s.service_id === e.target.value)
                if (service) handleServiceChange(service)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              {services.map((service) => (
                <option key={service.service_id} value={service.service_id}>
                  {service.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : insights ? (
          <div className="space-y-6">
            {/* Overall Suggestions */}
            {insights.suggestions.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-sm p-6 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <SparklesIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">AI Tavsiyalari</h3>
                    <ul className="space-y-2">
                      {insights.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-yellow-600 mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Top Performing Tags */}
            {insights.topPerformingTags.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  Yaxshi Ishlayotgan Teglar
                </h3>
                <div className="flex flex-wrap gap-2">
                  {insights.topPerformingTags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Underperforming Tags */}
            {insights.underperformingTags.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                  Past Natija Ko'rsatayotgan Teglar
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {insights.underperformingTags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Bu teglarni o'zgartirish yoki olib tashlash tavsiya etiladi
                </p>
              </div>
            )}

            {/* Tag Insights */}
            {insights.tagInsights.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Batafsil Tag Tahlili</h3>
                <div className="space-y-4">
                  {insights.tagInsights.map((tagInsight: any, index: number) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg font-medium">
                            {tagInsight.tag}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceColor(tagInsight.performance)}`}>
                            {tagInsight.performance === 'excellent' ? 'Ajoyib' :
                             tagInsight.performance === 'good' ? 'Yaxshi' :
                             tagInsight.performance === 'average' ? 'O\'rtacha' : 'Past'}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                        <div>
                          <p className="text-gray-500">Ko'rish</p>
                          <p className="font-semibold">{tagInsight.viewCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Bosish</p>
                          <p className="font-semibold">{tagInsight.clickCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Aloqa</p>
                          <p className="font-semibold">{tagInsight.contactCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Buyurtma</p>
                          <p className="font-semibold">{tagInsight.orderCount}</p>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{tagInsight.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <LightBulbIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Tavsiyalar uchun ma'lumotlar yetarli emas</p>
            <p className="text-sm text-gray-400 mt-2">Ko'proq mijozlar bilan aloqa qilgandan keyin tavsiyalar paydo bo'ladi</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
