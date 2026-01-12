/**
 * Seller Dashboard - Main Overview Page
 * 
 * 4 main blocks:
 * 1. Overview (Status) - Views, clicks, contacts, orders with growth %
 * 2. Rank & Visibility - Search rankings
 * 3. AI Recommendations - Actionable insights
 * 4. Benchmarking - Category comparisons
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  LightBulbIcon,
  TrophyIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  PhoneIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { getDashboardOverview } from '../lib/dashboardStats'
import { getUserServices } from '../lib/supabase'
import { recordDashboardVisit, getDashboardStreak, getHealthStreak } from '../lib/dashboardHistory'
import ServiceListWithHealth from '../components/ServiceListWithHealth'
import type { Service } from '../types'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [period, setPeriod] = useState<'7d' | '30d'>('7d')
  const [overview, setOverview] = useState<any>(null)
  const [services, setServices] = useState<Service[]>([])
  const [streak, setStreak] = useState<any>(null)
  const [healthStreak, setHealthStreak] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Record visit (Feature C: Streak tracking)
        await recordDashboardVisit(user.telegram_user_id)

        const [overviewData, servicesData, streakData] = await Promise.all([
          getDashboardOverview(user.telegram_user_id, period),
          getUserServices(user.telegram_user_id),
          getDashboardStreak(user.telegram_user_id),
        ])

        setOverview(overviewData)
        setServices(servicesData || [])

        // Get health streak for first service (Feature C)
        if (servicesData && servicesData.length > 0) {
          const streak = await getHealthStreak(servicesData[0].service_id)
          setHealthStreak(streak)
        }

        setStreak(streakData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, period])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Iltimos, tizimga kiring</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowTrendingUpIcon className="w-4 h-4" />
        ) : (
          <ArrowTrendingDownIcon className="w-4 h-4" />
        )}
        {isPositive ? '+' : ''}{growth.toFixed(1)}%
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Xizmatlaringiz statistikasi</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod('7d')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === '7d'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                7 kun
              </button>
              <button
                onClick={() => setPeriod('30d')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === '30d'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30 kun
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Streak Badges (Feature C: History & Streak) */}
        {(streak?.currentStreak > 0 || healthStreak >= 7) && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl shadow-sm p-4 border border-orange-200">
            <div className="flex items-center gap-4">
              {streak?.currentStreak >= 7 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="font-bold text-gray-900">{streak.currentStreak} kun davomida</p>
                    <p className="text-xs text-gray-600">Dashboard zanjir</p>
                  </div>
                </div>
              )}
              {healthStreak >= 7 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🟢</span>
                  <div>
                    <p className="font-bold text-gray-900">{healthStreak} kun davomida</p>
                    <p className="text-xs text-gray-600">Health > 70 zanjir</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Today Mini-Panel (Feature 1) */}
        {overview?.today && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Bugun</h3>
              <span className="text-xs text-gray-500">{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{overview.today.views}</div>
                <div className="text-xs text-gray-600 mt-1">👁 Ko'rildi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{overview.today.clicks}</div>
                <div className="text-xs text-gray-600 mt-1">👉 Bosildi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{overview.today.contacts}</div>
                <div className="text-xs text-gray-600 mt-1">📞 Aloqa</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{overview.today.orders}</div>
                <div className="text-xs text-gray-600 mt-1">💰 Buyurtma</div>
              </div>
            </div>
          </div>
        )}

        {/* Block 1: Overview Metrics */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6 text-primary" />
              Holat qanday?
            </h2>
            <span className="text-sm text-gray-500">So'nggi {period === '7d' ? '7 kun' : '30 kun'}</span>
          </div>

          {overview ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Views */}
              <MetricCard
                icon={<EyeIcon className="w-6 h-6" />}
                label="Ko'rildi"
                value={overview.views.current.toLocaleString()}
                growth={formatGrowth(overview.views.growth)}
                color="blue"
              />

              {/* Clicks */}
              <MetricCard
                icon={<CursorArrowRaysIcon className="w-6 h-6" />}
                label="Bosildi"
                value={overview.clicks.current.toLocaleString()}
                growth={formatGrowth(overview.clicks.growth)}
                color="purple"
              />

              {/* Contacts */}
              <MetricCard
                icon={<PhoneIcon className="w-6 h-6" />}
                label="Aloqa"
                value={overview.contacts.current.toLocaleString()}
                growth={formatGrowth(overview.contacts.growth)}
                color="green"
              />

              {/* Orders */}
              <MetricCard
                icon={<CurrencyDollarIcon className="w-6 h-6" />}
                label="Buyurtma"
                value={overview.orders.current.toLocaleString()}
                growth={formatGrowth(overview.orders.growth)}
                color="yellow"
              />
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Ma'lumotlar hali mavjud emas</p>
              <p className="text-sm mt-2">Xizmat yaratib, mijoZLarni kutishingiz mumkin</p>
            </div>
          )}
        </div>

        {/* Navigation to other blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rank & Visibility */}
          <NavigationCard
            icon={<TrophyIcon className="w-8 h-8" />}
            title="Rank & Visibility"
            description="Qidiruvdagi o'rningiz"
            onClick={() => navigate('/dashboard/rank')}
            color="purple"
          />

          {/* AI Recommendations */}
          <NavigationCard
            icon={<LightBulbIcon className="w-8 h-8" />}
            title="AI Tavsiyalar"
            description="Nima qilish kerak"
            onClick={() => navigate('/dashboard/recommendations')}
            color="yellow"
          />

          {/* Benchmarking */}
          <NavigationCard
            icon={<ChartBarIcon className="w-8 h-8" />}
            title="Benchmark"
            description="Boshqalar bilan solishtirish"
            onClick={() => navigate('/dashboard/benchmark')}
            color="blue"
          />
        </div>

        {/* Services List */}
        {services.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Xizmatlarim</h2>
            <div className="space-y-3">
              {services.map((service) => (
                <button
                  key={service.service_id}
                  onClick={() => navigate(`/dashboard/services/${service.service_id}`)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {service.view_count} ko'rish • {service.category}
                      </p>
                    </div>
                    <ArrowTrendingUpIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  growth: React.ReactNode
  color: 'blue' | 'purple' | 'green' | 'yellow'
}

function MetricCard({ icon, label, value, growth, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
      <div className="text-xs">{growth}</div>
    </div>
  )
}

interface NavigationCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  color: 'blue' | 'purple' | 'yellow'
}

function NavigationCard({ icon, title, description, onClick, color }: NavigationCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  }

  return (
    <button
      onClick={onClick}
      className={`w-full p-6 rounded-xl border-2 ${colorClasses[color]} hover:shadow-md transition-all text-left`}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm opacity-75">{description}</p>
    </button>
  )
}
