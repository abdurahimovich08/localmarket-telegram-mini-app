import { useState, useEffect } from 'react'
import { initTelegram } from '../lib/telegram'

interface OnboardingProps {
  onComplete: () => void
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const pages = [
    {
      emoji: '🏪',
      title: 'LocalMarket\'ga Xush Kelibsiz!',
      description: 'Mahallangizdagi odamlar bilan to\'g\'ridan-to\'g\'ri savdo qiling. Qo\'shnilar orasida xavfsiz va tez aloqa.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      emoji: '✨',
      title: 'Kuchli Imkoniyatlar',
      description: '📸 Ko\'p rasmli e\'lonlar\n📍 Joylashuv asosida qidiruv\n⭐ Sevimlilar ro\'yxati\n💬 To\'g\'ridan-to\'g\'ri aloqa\n📊 Foydalanuvchi reytingi',
      color: 'from-purple-500 to-pink-500'
    },
    {
      emoji: '🚀',
      title: 'Qanday Ishlatiladi?',
      description: '1️⃣ Rasm qo\'shib e\'lon yarating\n2️⃣ Mahallangizdagi e\'lonlarni ko\'ring\n3️⃣ Qiziqtirgan buyumlarni sevimlilariga qo\'shing\n4️⃣ Sotuvchilar bilan bog\'laning\n5️⃣ Xavfsiz va qulay savdo qiling',
      color: 'from-orange-500 to-red-500'
    },
    {
      emoji: '📈',
      title: 'Ajoyib Natijalar',
      description: '✅ 1000+ faol foydalanuvchi\n✅ 5000+ muvaffaqiyatli savdo\n✅ 4.8 ⭐ o\'rtacha reyting\n✅ Mahallangizda top 1 platforma\n\nHozir qo\'shiling va savdo qilishni boshlang!',
      color: 'from-green-500 to-emerald-500'
    }
  ]

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
    if (isRightSwipe && currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem('localmarket_onboarding_completed', 'true')
    onComplete()
  }

  // Initialize Telegram WebApp
  useEffect(() => {
    const webApp = initTelegram()
    if (webApp) {
      webApp.expand()
    }
  }, [])

  const isLastPage = currentPage === pages.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br via-white to-gray-50 flex flex-col overflow-hidden">
      {/* Skip button */}
      {!isLastPage && (
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-50 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          O'tkazib yuborish
        </button>
      )}

      {/* Main content */}
      <div
        className="flex-1 flex overflow-hidden relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {pages.map((pageData, index) => (
          <div
            key={index}
            className="min-w-full flex flex-col items-center justify-center px-6 py-12 transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${-currentPage * 100 + index * 100}%)` }}
          >
            {/* Emoji */}
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${pageData.color} flex items-center justify-center mb-8 shadow-lg transform transition-transform duration-300 ${currentPage === index ? 'scale-100' : 'scale-90'}`}>
              <span className="text-6xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                {pageData.emoji}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-6 leading-tight px-4">
              {pageData.title}
            </h1>

            {/* Description */}
            <div className="text-center text-gray-700 leading-relaxed max-w-md px-4">
              <p className="whitespace-pre-line text-base">
                {pageData.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Page indicators */}
      <div className="flex justify-center gap-2 mb-8">
        {pages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index)}
            className={`transition-all duration-300 rounded-full ${
              currentPage === index
                ? 'w-8 h-2 bg-blue-500'
                : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`${index + 1}-sahifaga o'tish`}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="px-6 pb-8 space-y-3">
        <button
          onClick={handleNext}
          className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg transform transition-all duration-200 active:scale-95 ${
            isLastPage
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
          }`}
        >
          {isLastPage ? '🎉 Boshlash' : 'Keyingisi →'}
        </button>

        {!isLastPage && (
          <button
            onClick={handleComplete}
            className="w-full py-3 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            O'tkazib yuborish
          </button>
        )}
      </div>
    </div>
  )
}
