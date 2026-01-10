export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export interface User {
  telegram_user_id: number
  username?: string
  first_name: string
  last_name?: string
  phone_number?: string
  bio?: string
  profile_photo_url?: string
  neighborhood?: string
  latitude?: number
  longitude?: number
  search_radius_miles: number
  is_premium: boolean
  rating_average: number
  total_reviews: number
  items_sold_count: number
  last_active?: string
  created_at: string
}

export type ListingStatus = 'active' | 'sold' | 'deleted'
export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor'
export type ListingCategory = 
  | 'electronics'
  | 'furniture'
  | 'clothing'
  | 'baby_kids'
  | 'home_garden'
  | 'games_hobbies'
  | 'books_media'
  | 'sports_outdoors'
  | 'other'

export interface Listing {
  listing_id: string
  seller_telegram_id: number
  title: string
  description: string
  price?: number
  is_free: boolean
  category: ListingCategory
  condition: ListingCondition
  photos: string[]
  neighborhood?: string
  latitude?: number
  longitude?: number
  status: ListingStatus
  view_count: number
  favorite_count: number
  is_boosted: boolean
  boosted_until?: string
  created_at: string
  updated_at: string
  distance?: number // Calculated distance in miles
  relevanceScore?: number // Search relevance score (0-100+)
  seller?: User // Populated seller info
}

export interface Favorite {
  favorite_id: string
  user_telegram_id: number
  listing_id: string
  created_at: string
  listing?: Listing
}

export interface CartItem {
  cart_item_id: string
  user_telegram_id: number
  listing_id: string
  quantity: number
  created_at: string
  updated_at: string
  listing?: Listing
}

export interface Review {
  review_id: string
  reviewer_telegram_id: number
  reviewed_telegram_id: number
  listing_id: string
  rating: number
  review_text?: string
  tags: string[]
  created_at: string
  reviewer?: User
}

export interface Transaction {
  transaction_id: string
  listing_id: string
  buyer_telegram_id: number
  seller_telegram_id: number
  status: 'initiated' | 'completed' | 'cancelled'
  completed_at?: string
  created_at: string
}

export interface Report {
  report_id: string
  reporter_telegram_id: number
  reported_listing_id?: string
  reported_user_telegram_id?: number
  reason: 'spam' | 'fraud' | 'inappropriate' | 'other'
  description?: string
  status: 'pending' | 'resolved' | 'dismissed'
  created_at: string
}

export const CATEGORIES: { value: ListingCategory; label: string; emoji: string }[] = [
  { value: 'electronics', label: 'Elektronika', emoji: '📱' },
  { value: 'furniture', label: 'Mebel', emoji: '🪑' },
  { value: 'clothing', label: 'Kiyim-kechak', emoji: '👕' },
  { value: 'baby_kids', label: 'Bolalar uchun', emoji: '👶' },
  { value: 'home_garden', label: 'Uy-ro\'zg\'or', emoji: '🏠' },
  { value: 'games_hobbies', label: 'O\'yinchoqlar', emoji: '🎮' },
  { value: 'books_media', label: 'Kitoblar', emoji: '📚' },
  { value: 'sports_outdoors', label: 'Sport', emoji: '🏋️' },
  { value: 'other', label: 'Boshqalar', emoji: '🎁' },
]

export const CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: 'new', label: 'Yangi' },
  { value: 'like_new', label: 'Dekoratsiya uchun' },
  { value: 'good', label: 'Yaxshi holatda' },
  { value: 'fair', label: 'Qoniqarli' },
  { value: 'poor', label: 'Yomon holatda' },
]
