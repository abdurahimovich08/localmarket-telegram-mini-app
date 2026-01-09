// Category carousel component for home page
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../types'
import { trackCategoryView } from '../lib/tracking'
import { useUser } from '../contexts/UserContext'

export default function CategoryCarousel() {
  const { user } = useUser()

  const handleCategoryClick = (categoryValue: string) => {
    if (user?.telegram_user_id) {
      trackCategoryView(user.telegram_user_id, categoryValue)
    }
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 min-w-max">
          {CATEGORIES.map((category) => (
            <Link
              key={category.value}
              to={`/search?category=${category.value}`}
              onClick={() => handleCategoryClick(category.value)}
              className="flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm">
                {category.emoji}
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                {category.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
