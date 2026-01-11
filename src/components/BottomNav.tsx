import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HomeIcon, MagnifyingGlassIcon, HeartIcon, UserIcon } from '@heroicons/react/24/outline'
import { HomeIcon as HomeIconSolid, MagnifyingGlassIcon as MagnifyingGlassIconSolid, HeartIcon as HeartIconSolid, UserIcon as UserIconSolid } from '@heroicons/react/24/solid'
import ActionSheet from './ActionSheet'

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showActionSheet, setShowActionSheet] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const handleSoqqaClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowActionSheet(true)
  }

  const actionSheetOptions = [
    {
      emoji: '📦',
      label: 'Narsa sotaman',
      onClick: () => navigate('/create'),
    },
    {
      emoji: '🛠',
      label: 'Xizmat ko\'rsataman',
      onClick: () => navigate('/create-service'),
    },
  ]

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {/* Bosh */}
          <Link
            to="/"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary transition-colors"
          >
            {isActive('/') ? (
              <>
                <HomeIconSolid className="w-6 h-6 text-primary" />
                <span className="text-xs mt-1 text-primary font-medium">Bosh</span>
              </>
            ) : (
              <>
                <HomeIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Bosh</span>
              </>
            )}
          </Link>

          {/* Qidiruv */}
          <Link
            to="/search"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary transition-colors"
          >
            {isActive('/search') ? (
              <>
                <MagnifyingGlassIconSolid className="w-6 h-6 text-primary" />
                <span className="text-xs mt-1 text-primary font-medium">Qidiruv</span>
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Qidiruv</span>
              </>
            )}
          </Link>

          {/* SOQQA Button - O'rtada */}
          <button
            onClick={handleSoqqaClick}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary transition-colors"
          >
            <span className="text-2xl">💰</span>
            <span className="text-xs mt-1 font-medium">SOQQA</span>
          </button>

          {/* Sevimlilar */}
          <Link
            to="/favorites"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary transition-colors"
          >
            {isActive('/favorites') ? (
              <>
                <HeartIconSolid className="w-6 h-6 text-primary" />
                <span className="text-xs mt-1 text-primary font-medium">Sevimlilar</span>
              </>
            ) : (
              <>
                <HeartIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Sevimlilar</span>
              </>
            )}
          </Link>

          {/* Profil */}
          <Link
            to="/profile"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary transition-colors"
          >
            {isActive('/profile') ? (
              <>
                <UserIconSolid className="w-6 h-6 text-primary" />
                <span className="text-xs mt-1 text-primary font-medium">Profil</span>
              </>
            ) : (
              <>
                <UserIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Profil</span>
              </>
            )}
          </Link>
        </div>
      </nav>

      {/* Action Sheet */}
      <ActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="Xo'sh, qanday soqqa qilamiz?"
        options={actionSheetOptions}
      />
    </>
  )
}
