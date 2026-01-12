/**
 * Dashboard Rank & Visibility Page (Block 2)
 * Shows search rankings and explainability
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import { getServiceRankInfo, getPopularQueriesForCategory } from '../lib/dashboardRanking'
import { getUserServices } from '../lib/supabase'
import type { Service } from '../types'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, TrophyIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function DashboardRank() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [rankInfo, setRankInfo] = useState<any[]>([])
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
          
          // Get popular queries for category
          const popularQueries = await getPopularQueriesForCategory(userServices[0].category, 5)
          const ranks = await getServiceRankInfo(userServices[0].service_id, popularQueries)
          setRankInfo(ranks)
        }
      } catch (error) {
        console.error('Error loading rank data:', error)
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
      const popularQueries = await getPopularQueriesForCategory(service.category, 5)
      const ranks = await getServiceRankInfo(service.service_id, popularQueries)
      setRankInfo(ranks)
    } catch (error) {
      console.error('Error loading rank info:', error)
    } finally {
      setLoading(false)
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
            <TrophyIcon className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Rank & Visibility</h1>
              <p className="text-sm text-gray-500">Qidiruvdagi o'rningiz</p>
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
        ) : selectedService ? (
          rankInfo.length > 0 ? (
            <div className="space-y-4">
              {/* Rank Drop Alert (Feature 3) */}
              {rankInfo.some(r => r.isDrop && r.dropSeverity) && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-red-900 mb-1">🚨 Visibility pasaydi</h3>
                      <p className="text-sm text-red-700 mb-2">
                        {rankInfo.filter(r => r.isDrop).length} ta qidiruvda o'rningiz pasaygan.
                      </p>
                      <button
                        onClick={() => navigate('/dashboard/recommendations')}
                        className="text-sm text-red-700 hover:text-red-900 font-medium underline"
                      >
                        AI tavsiyalarini ko'rish →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {rankInfo.map((rank, index) => (
                <div key={index} className={`bg-white rounded-xl shadow-sm p-6 ${rank.isDrop ? 'border-2 border-red-200' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        "{rank.query}"
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {rank.rank}
                        </span>
                        <span className="text-gray-500">-o'rin</span>
                        {rank.rankChange !== 0 && (
                          <span className={`flex items-center gap-1 text-sm ${
                            rank.rankChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {rank.rankChange > 0 ? (
                              <ArrowTrendingUpIcon className="w-4 h-4" />
                            ) : (
                              <ArrowTrendingDownIcon className="w-4 h-4" />
                            )}
                            {Math.abs(rank.rankChange)}
                          </span>
                        )}
                      </div>
                    </div>
                    {rank.rank <= 10 && (
                      <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Top 10
                      </div>
                    )}
                  </div>

                  {/* Explanation */}
                  {rank.explanation.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Sabab:</p>
                      <div className="space-y-2">
                        {rank.explanation.map((reason: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            {reason.includes('To\'g\'ri') || reason.includes('Yuqori') ? (
                              <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <p className="text-sm text-gray-600">{reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matched Tags */}
                  {rank.matchedTags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {rank.matchedTags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Qidiruv natijalari hali mavjud emas</p>
              <p className="text-sm text-gray-400 mt-2">Xizmatingiz tez orada qidiruvda ko'rinadi</p>
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500">Sizda hali xizmatlar mavjud emas</p>
            <button
              onClick={() => navigate('/create-service')}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Xizmat Yaratish
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
