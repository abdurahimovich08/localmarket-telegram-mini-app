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
      title: 'Rasmga oling, AI sotadi',
      description: 'Telefon kamerangizni ochib, buyumga qarab turing. AI avtomatik ravishda e\'lon yaratadi va sotadi.',
      gradientFrom: '#20B2AA',
      gradientTo: '#00CED1',
      accentColor: '#00CED1',
      illustration: 'camera'
    },
    {
      title: 'Tavsif va Narx — Avtomatik',
      description: 'Siz faqat rasm tashlang. AI tavsif, narx va kategoriyani avtomatik aniqlaydi. Siz shunchaki tasdiqlaysiz.',
      gradientFrom: '#E8A87C',
      gradientTo: '#FFD700',
      accentColor: '#D4AF37',
      illustration: 'automation'
    },
    {
      title: 'Tez, Halol va Qulay',
      description: 'Mahallangizdagi odamlar bilan to\'g\'ridan-to\'g\'ri aloqa. Xavfsiz, tez va qulay savdo platformasi.',
      gradientFrom: '#F4A460',
      gradientTo: '#E8A87C',
      accentColor: '#CD853F',
      illustration: 'community'
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

  // Camera Illustration Component
  const CameraIllustration = ({ isActive }: { isActive: boolean }) => (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Phone Frame */}
      <div className={`relative w-28 h-48 rounded-[2rem] bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl transition-all duration-700 ${isActive ? 'scale-100 rotate-0' : 'scale-90 rotate-3'}`}>
        {/* Screen */}
        <div className="absolute inset-[3px] rounded-[1.6rem] bg-gradient-to-br from-gray-100 to-white overflow-hidden">
          {/* Camera Viewfinder */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-24 rounded-lg border-2 border-gray-300 flex items-center justify-center">
            <div className="w-20 h-16 rounded bg-gradient-to-br from-blue-400 to-cyan-400 relative overflow-hidden">
              {/* Scan Lines Animation */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-b bottom-0 from-transparent via-white/30 to-transparent animate-pulse"></div>
              )}
            </div>
          </div>
          {/* Camera Button */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gray-800 border-4 border-gray-600"></div>
        </div>
      </div>
      
      {/* AI Sparkles */}
      {isActive && (
        <>
          <div className="absolute top-8 -right-4 w-3 h-3 rounded-full bg-cyan-400 animate-ping"></div>
          <div className="absolute top-16 -left-4 w-2 h-2 rounded-full bg-blue-400 animate-ping" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute bottom-16 -right-6 w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping" style={{ animationDelay: '0.6s' }}></div>
        </>
      )}
      
      {/* Object Being Scanned (Teapot Silhouette) */}
      <div className={`absolute -left-8 top-1/2 -translate-y-1/2 transition-all duration-700 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        <div className="w-16 h-20 relative">
          {/* Teapot Shape */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-14 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-2xl"></div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-6 bg-gradient-to-b from-amber-700 to-amber-600 rounded-t-full"></div>
          {/* Handle */}
          <div className="absolute top-8 left-0 w-4 h-8 border-4 border-amber-700 rounded-l-full"></div>
          {/* Spout */}
          <div className="absolute top-10 right-0 w-6 h-3 bg-amber-700 rounded-r-full"></div>
        </div>
      </div>
    </div>
  )

  // Automation Illustration Component
  const AutomationIllustration = ({ isActive }: { isActive: boolean }) => (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Person Silhouette (Relaxed) */}
      <div className={`relative transition-all duration-700 ${isActive ? 'scale-100' : 'scale-90'}`}>
        {/* Head */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 mb-2 mx-auto"></div>
        {/* Body (Sitting) */}
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl relative">
          {/* Tea Cup */}
          <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full border-4 border-amber-700 bg-amber-100 transition-all duration-700 ${isActive ? 'rotate-12' : 'rotate-0'}`}>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-600"></div>
            {/* Steam */}
            {isActive && (
              <>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1 h-4 bg-amber-300 rounded-full animate-pulse"></div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-3 bg-amber-200 rounded-full animate-pulse" style={{ animationDelay: '0.2s', marginLeft: '4px' }}></div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-3 bg-amber-200 rounded-full animate-pulse" style={{ animationDelay: '0.4s', marginLeft: '-4px' }}></div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Automation Elements (Background) */}
      <div className={`absolute inset-0 transition-all duration-700 ${isActive ? 'opacity-30' : 'opacity-0'}`}>
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(212, 175, 55, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(212, 175, 55, 0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
        
        {/* Floating Labels */}
        {isActive && (
          <>
            <div className="absolute top-8 left-0 text-xs font-semibold text-amber-700 bg-amber-100/80 px-2 py-1 rounded-full animate-fade-in">
              Tavsif...
            </div>
            <div className="absolute top-16 right-0 text-xs font-semibold text-amber-700 bg-amber-100/80 px-2 py-1 rounded-full animate-fade-in" style={{ animationDelay: '0.3s' }}>
              Narx...
            </div>
            <div className="absolute bottom-16 left-1/4 text-xs font-semibold text-amber-700 bg-amber-100/80 px-2 py-1 rounded-full animate-fade-in" style={{ animationDelay: '0.6s' }}>
              Kategoriya...
            </div>
          </>
        )}
      </div>
    </div>
  )

  // Community Illustration Component
  const CommunityIllustration = ({ isActive }: { isActive: boolean }) => (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Two People */}
      <div className={`flex items-end gap-4 transition-all duration-700 ${isActive ? 'scale-100' : 'scale-90'}`}>
        {/* Person 1 */}
        <div className="relative">
          {/* Head */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 mb-2"></div>
          {/* Body */}
          <div className="w-14 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl relative">
            {/* Hand Over Heart */}
            <div className={`absolute -left-2 top-4 w-6 h-8 bg-amber-300 rounded-full transition-all duration-700 ${isActive ? 'rotate-45 scale-100' : 'rotate-0 scale-90'}`}></div>
            {/* Heart */}
            {isActive && (
              <div className="absolute -left-4 top-2 text-red-400 text-xl animate-pulse">❤️</div>
            )}
          </div>
        </div>
        
        {/* Person 2 */}
        <div className="relative">
          {/* Head */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-amber-400 mb-2"></div>
          {/* Body */}
          <div className="w-14 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl relative">
            {/* Hand Over Heart */}
            <div className={`absolute -right-2 top-4 w-6 h-8 bg-amber-400 rounded-full transition-all duration-700 ${isActive ? '-rotate-45 scale-100' : 'rotate-0 scale-90'}`}></div>
            {/* Heart */}
            {isActive && (
              <div className="absolute -right-4 top-2 text-red-400 text-xl animate-pulse" style={{ animationDelay: '0.2s' }}>❤️</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mahalla Gate (Stylized Arch) */}
      <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-16 transition-all duration-700 ${isActive ? 'opacity-20 scale-100' : 'opacity-0 scale-75'}`}>
        <div className="relative w-full h-full">
          {/* Arch Shape */}
          <svg viewBox="0 0 128 64" className="w-full h-full">
            <path
              d="M 0 64 L 0 32 Q 32 16 64 32 Q 96 48 128 32 L 128 64 Z"
              fill="none"
              stroke="#CD853F"
              strokeWidth="2"
              opacity="0.4"
            />
          </svg>
        </div>
      </div>
      
      {/* Connection Glow */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  )

  const renderIllustration = (type: string, isActive: boolean) => {
    switch (type) {
      case 'camera':
        return <CameraIllustration isActive={isActive} />
      case 'automation':
        return <AutomationIllustration isActive={isActive} />
      case 'community':
        return <CommunityIllustration isActive={isActive} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative" style={{ backgroundColor: '#FFFEF7' }}>
      {/* Subtle Ikat Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(32, 178, 170, 0.1) 10px,
            rgba(32, 178, 170, 0.1) 20px
          )`
        }} />
      </div>

      {/* Skip button */}
      {!isLastPage && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 z-50 px-4 py-2 text-sm transition-colors font-medium hover:opacity-70"
          style={{ color: '#4A4A4A' }}
        >
          O'tkazib yuborish
        </button>
      )}

      {/* Main content */}
      <div
        className="flex-1 flex overflow-hidden relative z-10"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {pages.map((pageData, index) => {
          const isActive = currentPage === index
          return (
            <div
              key={index}
              className="min-w-full flex flex-col items-center justify-center px-6 py-8 transition-transform duration-500 ease-out"
              style={{ transform: `translateX(${-currentPage * 100 + index * 100}%)` }}
            >
              {/* Illustration Container */}
              <div className={`relative mb-10 transition-all duration-700 ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-50'}`}>
                {/* Gradient Circle Background */}
                <div 
                  className="w-48 h-48 rounded-full p-1 shadow-2xl relative"
                  style={{
                    background: `linear-gradient(135deg, ${pageData.gradientFrom}, ${pageData.gradientTo})`,
                    boxShadow: `0 20px 60px rgba(0, 0, 0, 0.15), 0 0 40px ${pageData.accentColor}20`
                  }}
                >
                  <div className="w-full h-full rounded-full bg-[#FFFEF7] flex items-center justify-center overflow-hidden">
                    {/* CSS-based Illustration */}
                    {renderIllustration(pageData.illustration, isActive)}
                  </div>
                </div>

                {/* Decorative Floating Elements */}
                {isActive && (
                  <>
                    <div 
                      className="absolute -top-3 -right-3 w-8 h-8 rounded-full blur-md opacity-60 animate-pulse"
                      style={{ backgroundColor: pageData.accentColor }}
                    ></div>
                    <div 
                      className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full blur-md opacity-40 animate-pulse"
                      style={{ backgroundColor: pageData.gradientFrom, animationDelay: '0.5s' }}
                    ></div>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 
                className={`text-3xl font-bold text-center mb-4 leading-tight px-4 transition-all duration-700 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ color: '#2C2C2C' }}
              >
                {pageData.title}
              </h1>

              {/* Description */}
              <div 
                className={`text-center leading-relaxed max-w-sm px-4 transition-all duration-700 delay-100 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ color: '#4A4A4A' }}
              >
                <p className="text-base whitespace-pre-line leading-relaxed">
                  {pageData.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Page indicators */}
      <div className="flex justify-center gap-2 mb-6 z-10">
        {pages.map((pageData, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index)}
            className={`transition-all duration-300 rounded-full ${
              currentPage === index
                ? 'w-8 h-2 shadow-lg'
                : 'w-2 h-2 bg-gray-300 opacity-60 hover:opacity-80'
            }`}
            style={currentPage === index ? { 
              backgroundColor: pageData.accentColor,
              boxShadow: `0 2px 8px ${pageData.accentColor}40`
            } : {}}
            aria-label={`${index + 1}-sahifaga o'tish`}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="px-6 pb-8 space-y-3 z-10">
        <button
          onClick={handleNext}
          className="w-full py-4 font-bold text-white shadow-2xl transform transition-all duration-200 active:scale-95 hover:opacity-90"
          style={{
            borderRadius: '1.5rem',
            background: isLastPage 
              ? 'linear-gradient(135deg, #D4AF37, #F4A460)' 
              : `linear-gradient(135deg, ${pages[currentPage].gradientFrom}, ${pages[currentPage].gradientTo})`,
            boxShadow: isLastPage 
              ? '0 10px 40px rgba(212, 175, 55, 0.3)' 
              : `0 10px 40px ${pages[currentPage].accentColor}30`
          }}
        >
          {isLastPage ? '🎉 Boshlash' : 'Keyingisi →'}
        </button>

        {!isLastPage && (
          <button
            onClick={handleComplete}
            className="w-full py-3 transition-colors font-medium text-sm hover:opacity-70"
            style={{ color: '#4A4A4A' }}
          >
            O'tkazib yuborish
          </button>
        )}
      </div>
    </div>
  )
}
