import { useNavigate } from 'react-router-dom'
import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'
import type { UnifiedProduct } from '../types/unified'
import { formatDistance } from '../lib/telegram'
import { cn } from '../lib/cn'

type CardVariant = 'marketplace' | 'store' | 'service'
type CardLayout = 'grid' | 'list' | 'compact'

interface UniversalCardProps {
  data: UnifiedProduct
  variant?: CardVariant
  layout?: CardLayout
  isFavorite?: boolean
  onToggleFavorite?: () => void
  onAddToCart?: () => void
  onBook?: () => void
  showDistance?: boolean
  showCategory?: boolean
}

export default function UniversalCard({
  data,
  variant = 'marketplace',
  layout = 'grid',
  isFavorite = false,
  onToggleFavorite,
  onAddToCart,
  onBook,
  showDistance = true,
  showCategory = true,
}: UniversalCardProps) {
  const navigate = useNavigate()

  // ✅ Fix pattern: onCardClick ichida switch(item.entity_type) qat'iy bo'lsin
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Qat'iy entity_type bo'yicha routing
    switch (data.type) {
      case 'service':
        navigate(`/service/${data.id}`)
        break
      case 'product':
      case 'store_product':
        navigate(`/listing/${data.id}`)
        break
      default:
        // Fallback to detailUrl
        navigate(data.detailUrl)
    }
  }
  // Variant-based styling with cn utility
  const getCardClasses = () => {
    return cn(
      'block overflow-hidden transition-shadow',
      variant === 'store' 
        ? 'neumorphic-product-card' 
        : 'bg-white rounded-lg shadow-sm hover:shadow-md'
    )
  }

  const getImageContainerClasses = () => {
    if (variant === 'store') {
      return 'relative aspect-square bg-gradient-to-br from-purple-400 to-pink-500'
    }
    return 'relative aspect-square bg-gray-100'
  }

  const getTextColorClasses = () => {
    if (variant === 'store') {
      return {
        title: 'text-white',
        category: 'text-white/70',
        price: 'text-white',
        meta: 'text-white/60',
      }
    }
    return {
      title: 'text-gray-900',
      category: 'text-gray-500',
      price: 'text-primary',
      meta: 'text-gray-500',
    }
  }

  const colors = getTextColorClasses()

  // Price display with promotion
  const renderPrice = () => {
    if (data.isFree) {
      return <span className={`text-lg font-bold ${colors.price}`}>Bepul</span>
    }

    if (data.oldPrice && data.price && data.oldPrice > data.price) {
      const discount = Math.round((1 - data.price / data.oldPrice) * 100)
      return (
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className={`text-sm line-through ${colors.meta}`}>
              {data.oldPrice.toLocaleString()} so'm
            </span>
            <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">
              -{discount}%
            </span>
          </div>
          <span className={`text-lg font-bold ${colors.price}`}>
            {data.price.toLocaleString()} so'm
          </span>
        </div>
      )
    }

    return (
      <span className={`text-lg font-bold ${colors.price}`}>
        {data.priceText || `${data.price?.toLocaleString()} so'm`}
      </span>
    )
  }

  // Stock indicator
  const renderStock = () => {
    if (data.type === 'store_product' && data.stockQty !== undefined && data.stockQty !== null) {
      if (data.stockQty === 0) {
        return (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
            Tugagan
          </span>
        )
      }
      if (data.stockQty < 5) {
        return (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
            {data.stockQty} dona qoldi
          </span>
        )
      }
    }
    return null
  }

  // Favorite button
  const renderFavoriteButton = () => {
    if (!onToggleFavorite) return null

    const buttonClasses = variant === 'store'
      ? 'absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors'
      : 'absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors'

    return (
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onToggleFavorite()
        }}
        className={buttonClasses}
      >
        {isFavorite ? (
          <HeartIconSolid className={`w-5 h-5 ${variant === 'store' ? 'text-blue-400' : 'text-red-500'}`} />
        ) : (
          <HeartIcon className={`w-5 h-5 ${variant === 'store' ? 'text-white' : 'text-gray-600'}`} />
        )}
      </button>
    )
  }

  // Action buttons (Add to Cart, Book)
  const renderActions = () => {
    if (variant === 'store' && onAddToCart && data.stockQty !== 0) {
      return (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onAddToCart()
          }}
          className="mt-2 w-full py-2 px-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingBagIcon className="w-4 h-4" />
          <span>Savatga</span>
        </button>
      )
    }

    if (variant === 'service' && onBook) {
      return (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onBook()
          }}
          className="mt-2 w-full py-2 px-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          Buyurtma berish
        </button>
      )
    }

    return null
  }

  // Layout-specific rendering
  if (layout === 'list') {
    return (
      <div onClick={handleCardClick} className={cn(getCardClasses(), 'cursor-pointer')}>
        <div className="flex gap-3 p-3">
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt={data.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${variant === 'store' ? 'bg-gradient-to-br from-purple-400 to-pink-500 text-white/80' : 'bg-gray-100 text-gray-400'}`}>
                <span className="text-xs">Rasm yo'q</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={`font-semibold ${colors.title} text-sm line-clamp-2 flex-1`}>
                {data.title}
              </h3>
              {renderPrice()}
            </div>
            {showCategory && data.categoryEmoji && (
              <p className={`text-xs ${colors.category} mb-1`}>
                {data.categoryEmoji} {data.category}
              </p>
            )}
            {renderStock()}
            {data.neighborhood && (
              <p className={`text-xs ${colors.meta} mt-1`}>{data.neighborhood}</p>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // Default grid layout
  return (
    <Link to={data.detailUrl} className={getCardClasses()}>
      <div className={getImageContainerClasses()}>
        {data.imageUrl ? (
          <img
            src={data.imageUrl}
            alt={data.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${variant === 'store' ? 'text-white/80' : 'text-gray-400'}`}>
            <span className="text-sm">Rasm yo'q</span>
          </div>
        )}
        
        {data.isBoosted && (
          <div className={`absolute top-2 left-2 ${variant === 'store' ? 'bg-white/20 backdrop-blur-sm text-white' : 'bg-primary text-white'} text-xs px-2 py-1 rounded`}>
            🚀 Targ'ib qilingan
          </div>
        )}
        
        {renderFavoriteButton()}
      </div>
      
      <div className={variant === 'store' ? 'p-4' : 'p-3'}>
        {showCategory && data.categoryEmoji && variant === 'store' && (
          <p className={`text-xs mb-1 uppercase tracking-wide ${colors.category}`}>
            {data.categoryEmoji} {data.category}
          </p>
        )}
        
        <div className="flex items-start justify-between mb-1">
          <h3 className={`font-semibold ${colors.title} ${variant === 'store' ? 'text-base' : 'text-sm'} line-clamp-2 flex-1`}>
            {data.title}
          </h3>
          {variant !== 'store' && renderPrice()}
        </div>
        
        {variant === 'store' && (
          <div className="mb-2">
            {renderPrice()}
          </div>
        )}
        
        {renderStock()}
        
        {variant !== 'store' && (
          <div className={`flex items-center gap-2 text-xs ${colors.meta}`}>
            {showCategory && data.categoryEmoji && (
              <span className="flex items-center gap-1">
                <span>{data.categoryEmoji}</span>
                <span>{data.category}</span>
              </span>
            )}
            {showDistance && data.distance !== undefined && (
              <>
                {showCategory && <span>•</span>}
                <span>{formatDistance(data.distance)}</span>
              </>
            )}
          </div>
        )}
        
        {data.neighborhood && variant !== 'store' && (
          <p className={`text-xs ${colors.meta} mt-1`}>{data.neighborhood}</p>
        )}
        
        {renderActions()}
      </div>
    </div>
  )
}
