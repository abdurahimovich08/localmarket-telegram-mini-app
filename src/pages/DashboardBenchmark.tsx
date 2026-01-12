/**
 * Dashboard Benchmarking Page (Block 4)
 * Compare with category average and similar services
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import { getServiceBenchmark } from '../lib/dashboardBenchmark'
import { getUserServices } from '../lib/supabase'
import type { Service } from '../types'
import { ChartBarIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function DashboardBenchmark() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [benchmark, setBenchmark] = useState<any>(null)
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
          const benchmarkData = await getServiceBenchmark(userServices[0].service_id)
          setBenchmark(benchmarkData)
        }
      } catch (error) {
        console.error('Error loading benchmark:', error)
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
      const benchmarkData = await getServiceBenchmark(service.service_id)
      setBenchmark(benchmarkData)
    } catch (error) {
      console.error('Error loading benchmark:', error)
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
            <ChartBarIcon className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Benchmark</h1>
              <p className="text-sm text-gray-500">Boshqalar bilan solishtirish</p>
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
        ) : benchmark ? (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Umumiy Ball</h3>
                  <p className="text-sm text-gray-600">Kategoriya bo'yicha</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-primary">
                    {benchmark.overallScore.toFixed(0)}
                  </p>
                  <p className="text-sm text-gray-500">/ 100</p>
                </div>
              </div>
            </div>

            {/* Metrics Comparison */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Ko'rsatkichlar</h3>
              <div className="space-y-4">
                {benchmark.metrics.map((metric: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{metric.metric}</h4>
                      {metric.status === 'above' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                          <CheckCircleIcon className="w-4 h-4" />
                          Yuqori
                        </span>
                      ) : metric.status === 'below' ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1">
                          <XCircleIcon className="w-4 h-4" />
                          Past
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          O'rtacha
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sizning ko'rsatkishingiz</span>
                        <span className="font-bold text-gray-900">
                          {metric.yourValue.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Kategoriya o'rtachasi</span>
                        <span className="text-gray-700">
                          {metric.categoryAverage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Platform o'rtachasi</span>
                        <span className="text-gray-500">
                          {metric.platformAverage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>0%</span>
                        <span>{metric.categoryAverage.toFixed(0)}% (o'rtacha)</span>
                        <span>100%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, metric.yourValue)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {benchmark.recommendations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Tavsiyalar</h3>
                <ul className="space-y-2">
                  {benchmark.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-primary mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Benchmark ma'lumotlari hali mavjud emas</p>
            <p className="text-sm text-gray-400 mt-2">Ko'proq ma'lumot to'plangandan keyin solishtirish mumkin bo'ladi</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
