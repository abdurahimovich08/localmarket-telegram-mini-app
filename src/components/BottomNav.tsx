import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, MagnifyingGlassIcon, PlusCircleIcon, HeartIcon, UserIcon } from '@heroicons/react/24/outline'
import { HomeIcon as HomeIconSolid, MagnifyingGlassIcon as MagnifyingGlassIconSolid, PlusCircleIcon as PlusCircleIconSolid, HeartIcon as HeartIconSolid, UserIcon as UserIconSolid } from '@heroicons/react/24/solid'

export default function BottomNav() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { path: '/', icon: HomeIcon, iconSolid: HomeIconSolid, label: 'Bosh' },
    { path: '/search', icon: MagnifyingGlassIcon, iconSolid: MagnifyingGlassIconSolid, label: 'Qidiruv' },
    { path: '/create', icon: PlusCircleIcon, iconSolid: PlusCircleIconSolid, label: 'Sotish' },
    { path: '/favorites', icon: HeartIcon, iconSolid: HeartIconSolid, label: 'Sevimlilar' },
    { path: '/profile', icon: UserIcon, iconSolid: UserIconSolid, label: 'Profil' },
  ]

  return (
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
      </div>
    </nav>
  )
}
