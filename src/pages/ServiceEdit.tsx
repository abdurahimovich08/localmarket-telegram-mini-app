import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const ServiceEdit = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center font-semibold text-gray-900">Xizmatni Tahrirlash</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Empty State */}
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tez kunda</h2>
          <p className="text-gray-600">Bu funksiya hozircha ishlab chiqilmoqda</p>
        </div>
      </div>
    </div>
  )
}

export default ServiceEdit
