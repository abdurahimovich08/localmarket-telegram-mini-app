import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getService } from '../lib/supabase'
import BackButton from '../components/BackButton'
import ServiceReviewForm from '../components/service/ServiceReviewForm'
import type { Service } from '../types'
import type { ServiceData } from '../services/GeminiService'

export default function ServiceEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [service, setService] = useState<Service | null>(null)
  const [serviceData, setServiceData] = useState<ServiceData | null>(null)

  // Load service data
  useEffect(() => {
    const loadService = async () => {
      if (!id || !user) return

      setLoading(true)
      try {
        const serviceData = await getService(id)
        if (!serviceData) {
          navigate('/')
          return
        }

        // Check if user is owner
        if (serviceData.provider_telegram_id !== user.telegram_user_id) {
          navigate(`/service/${id}`)
          return
        }

        setService(serviceData)

        // Convert Service to ServiceData format
        const data: ServiceData = {
          title: serviceData.title,
          description: serviceData.description,
          category: serviceData.category,
          priceType: serviceData.price_type,
          price: serviceData.price || '',
          tags: serviceData.tags || [],
        }
        setServiceData(data)
      } catch (error) {
        console.error('Error loading service:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    loadService()
  }, [id, user, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!service || !serviceData) {
    return null
  }

  return (
    <ServiceReviewForm
      data={serviceData}
      editMode={true}
      serviceId={id}
      existingService={service}
      onBack={() => navigate(`/service/${id}`)}
    />
  )
}
