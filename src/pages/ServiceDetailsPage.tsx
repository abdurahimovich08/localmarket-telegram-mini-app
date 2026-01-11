import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, ShieldCheck, ChevronRight, Share2, ArrowLeft } from 'lucide-react'
import { getService } from '../lib/supabase'
import type { Service } from '../types'

const ServiceDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFullDescription, setShowFullDescription] = useState(false)

  useEffect(() => {
    const loadService = async () => {
      if (!id) {
        navigate('/')
        return
      }

      try {
        setLoading(true)
        const serviceData = await getService(id)
        if (serviceData) {
          setService(serviceData)
        } else {
          navigate('/')
        }
      } catch (error) {
        console.error('Error loading service:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    loadService()
  }, [id, navigate])

  const handleOrder = () => {
    if (!service?.provider?.username) return
    // Open Telegram chat with provider
    const message = `Salom! Men sizning "${service.title}" xizmatingiz bilan qiziqaman. Narxi: ${service.price || 'Kelishiladi'}. Qanday murojaat qilishim mumkin?`
    window.open(`https://t.me/${service.provider.username}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleShare = () => {
    if (navigator.share && service) {
      navigator.share({
        title: service.title,
        text: service.description,
        url: window.location.href,
      }).catch(() => {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href)
        alert('Link nusxalandi!')
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link nusxalandi!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Xizmat topilmadi</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline"
          >
            Bosh sahifaga qaytish
          </button>
        </div>
      </div>
    )
  }

  const providerName = service.provider?.first_name || service.provider?.username || 'Noma\'lum'
  const description = service.description || ''
  const shortDescription = description.length > 200 ? description.substring(0, 200) + '...' : description

  return (
    <div className="bg-white min-h-screen pb-24 font-sans">
      {/* 1. Header Navigation */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-white z-10 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-full">
          <Share2 className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* 2. Main Info (Play Market Style) */}
      <div className="px-5 pt-4 flex gap-4 mb-6">
        {/* Logo/Avatar */}
        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md flex-shrink-0 bg-gray-100">
          {service.image_url ? (
            <img 
              src={service.image_url} 
              alt="Service Icon" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl font-bold">
              {service.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Title & Developer */}
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <h1 className="text-xl font-bold leading-tight text-gray-900 mb-1">
            {service.title}
          </h1>
          <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
            <span>{providerName}</span>
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* 3. Stats Row */}
      <div className="flex justify-between items-center px-6 mb-6">
        <div className="flex flex-col items-center border-r border-gray-200 w-1/3">
          <div className="flex items-center gap-1 font-bold text-gray-800">
            <span>4.9</span>
            <Star className="w-3.5 h-3.5 fill-black text-black" />
          </div>
          <span className="text-xs text-gray-500">0 sharh</span>
        </div>
        <div className="flex flex-col items-center border-r border-gray-200 w-1/3">
          <span className="font-bold text-gray-800">0</span>
          <span className="text-xs text-gray-500">Buyurtma</span>
        </div>
        <div className="flex flex-col items-center w-1/3">
          <span className="font-bold text-gray-800">1+</span>
          <span className="text-xs text-gray-500">Yil tajriba</span>
        </div>
      </div>

      {/* 4. Action Button (Install o'rniga Order) */}
      <div className="px-5 mb-8">
        <button 
          onClick={handleOrder}
          className="w-full bg-[#0088CC] hover:bg-[#0077b5] text-white font-semibold py-3 rounded-full shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2"
        >
          Buyurtma berish — {service.price || 'Kelishiladi'}
        </button>
      </div>

      {/* 5. Screenshots (Carousel) - Portfolio images */}
      {service.image_url && (
        <div className="mb-8">
          <div className="px-5 mb-3 flex justify-between items-end">
            <h3 className="font-bold text-lg text-gray-900">Portfolio</h3>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex overflow-x-auto px-5 gap-3 pb-2 scrollbar-hide">
            <img 
              src={service.image_url} 
              alt="Portfolio" 
              className="w-64 h-40 object-cover rounded-xl border border-gray-100 shadow-sm flex-shrink-0"
            />
          </div>
        </div>
      )}

      {/* 6. About This Service (AI Text) */}
      <div className="px-5 mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg text-gray-900">Xizmat haqida</h3>
          {description.length > 200 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-blue-600 text-sm font-medium"
            >
              {showFullDescription ? 'Kamroq' : 'Ko\'proq'}
            </button>
          )}
        </div>
        <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
          {showFullDescription ? description : shortDescription}
        </div>
      </div>

      {/* 7. Tags (Chips) */}
      {service.tags && service.tags.length > 0 && (
        <div className="px-5 flex flex-wrap gap-2 mb-8">
          {service.tags.map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium border border-gray-200">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Category */}
      {service.category && (
        <div className="px-5 mb-8">
          <div className="text-sm text-gray-500 mb-1">Kategoriya</div>
          <div className="text-gray-900 font-medium">{service.category}</div>
        </div>
      )}

      {/* 8. Sticky Bottom Bar (Telegram style) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 pb-8">
        <button 
          onClick={() => service.provider?.username && window.open(`https://t.me/${service.provider.username}`, '_blank')}
          className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50"
        >
          Chat
        </button>
        <button 
          onClick={handleOrder}
          className="flex-[2] bg-[#0088CC] text-white font-semibold py-3 rounded-xl hover:bg-[#0077b5] shadow-lg"
        >
          Hozir buyurtma berish
        </button>
      </div>
    </div>
  )
}

export default ServiceDetailsPage
