import { useState } from 'react'
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface TrustScoreTooltipProps {
  children: React.ReactNode
}

export default function TrustScoreTooltip({ children }: TrustScoreTooltipProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => setShowModal(true)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Ishonch ko'rsatkichlari haqida"
        >
          <InformationCircleIcon className="w-4 h-4" />
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Ishonch ko'rsatkichlari</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <div className="font-semibold text-gray-900 mb-1">⭐ Reyting</div>
                <p className="text-gray-600">Mijozlar sharhlari asosida hisoblanadi</p>
              </div>
              
              <div>
                <div className="font-semibold text-gray-900 mb-1">⚡ Javob berish tezligi</div>
                <p className="text-gray-600">Sotuvchi xabarlarga qancha tez javob beradi</p>
              </div>
              
              <div>
                <div className="font-semibold text-gray-900 mb-1">✅ Tasdiqlangan</div>
                <p className="text-gray-600">Do'kon ma'lumotlari tekshirilgan va tasdiqlangan</p>
              </div>
              
              <div>
                <div className="font-semibold text-gray-900 mb-1">📊 Statistika</div>
                <p className="text-gray-600">Obunachilar va sotilgan mahsulotlar soni</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
