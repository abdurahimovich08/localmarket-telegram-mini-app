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

  const navItems = [
    { path: '/', icon: HomeIcon, iconSolid: HomeIconSolid, label: 'Bosh' },
    { path: '/search', icon: MagnifyingGlassIcon, iconSolid: MagnifyingGlassIconSolid, label: 'Qidiruv' },
    { path: '/favorites', icon: HeartIcon, iconSolid: HeartIconSolid, label: 'Sevimlilar' },
    { path: '/profile', icon: UserIcon, iconSolid: UserIconSolid, label: 'Profil' },
  ]

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
      onClick: () => {
        // TODO: Implement service creation
        alert('Tez orada qo\'shiladi')
      },
      disabled: true,
    },
  ]

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const active = isActive(item.path)
            const Icon = active ? item.iconSolid : item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary transition-colors"
              >
                <Icon className={`w-6 h-6 ${active ? 'text-primary' : ''}`} />
                <span className={`text-xs mt-1 ${active ? 'text-primary font-medium' : ''}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
          
          {/* SOQQA Button */}
          <button
            onClick={handleSoqqaClick}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary transition-colors"
          >
            <span className="text-2xl">💰</span>
            <span className="text-xs mt-1 font-medium">SOQQA</span>
          </button>
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
