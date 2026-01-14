import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { 
  getStore, 
  getStoreCategories, 
  createStoreCategory, 
  updateStoreCategory, 
  deleteStoreCategory,
  reorderStoreCategories,
  getStoreProducts,
  updateStoreProduct,
  getStorePosts,
  createStorePost,
  updateStorePost,
  deleteStorePost
} from '../lib/supabase'
import type { Store, StoreCategory, Listing, StorePost } from '../types'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import { 
  BuildingStorefrontIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PhotoIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

type TabType = 'categories' | 'products' | 'posts' | 'settings'

export default function StoreManagement() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('categories')
  
  // Categories
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null)
  const [categoryTitle, setCategoryTitle] = useState('')
  const [categoryEmoji, setCategoryEmoji] = useState('')
  
  // Products
  const [products, setProducts] = useState<Listing[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // Posts
  const [posts, setPosts] = useState<StorePost[]>([])
  const [showPostForm, setShowPostForm] = useState(false)
  const [editingPost, setEditingPost] = useState<StorePost | null>(null)
  const [postContent, setPostContent] = useState('')
  const [postImages, setPostImages] = useState<string[]>([])

  useEffect(() => {
    if (!id || !user) {
      navigate('/')
      return
    }

    loadStoreData()
  }, [id, user])

  const loadStoreData = async () => {
    if (!id) return

    setLoading(true)
    try {
      const storeData = await getStore(id, user?.telegram_user_id)
      if (!storeData) {
        navigate('/')
        return
      }

      // Check if user is owner
      if (storeData.owner_telegram_id !== user?.telegram_user_id) {
        navigate(`/store/${id}`)
        return
      }

      setStore(storeData)
      
      // Load categories
      const categoriesData = await getStoreCategories(id)
      setCategories(categoriesData)
      
      // Load products
      const productsData = await getStoreProducts(id)
      setProducts(productsData)
      
      // Load posts
      const postsData = await getStorePosts(id)
      setPosts(postsData)
    } catch (error) {
      console.error('Error loading store data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Category handlers
  const handleCreateCategory = async () => {
    if (!id || !categoryTitle.trim()) return

    const newCategory = await createStoreCategory({
      store_id: id,
      title: categoryTitle.trim(),
      emoji: categoryEmoji.trim() || undefined,
      order_index: 0,
      is_active: true
    })

    if (newCategory) {
      setCategories([...categories, newCategory])
      setCategoryTitle('')
      setCategoryEmoji('')
      setShowCategoryForm(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryTitle.trim()) return

    const updated = await updateStoreCategory(editingCategory.category_id, {
      title: categoryTitle.trim(),
      emoji: categoryEmoji.trim() || undefined
    })

    if (updated) {
      setCategories(categories.map(c => c.category_id === updated.category_id ? updated : c))
      setEditingCategory(null)
      setCategoryTitle('')
      setCategoryEmoji('')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Kategoriyani o\'chirishni tasdiqlaysizmi?')) return

    const success = await deleteStoreCategory(categoryId)
    if (success) {
      setCategories(categories.filter(c => c.category_id !== categoryId))
    }
  }

  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.category_id === categoryId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= categories.length) return

    const newCategories = [...categories]
    const temp = newCategories[index]
    newCategories[index] = newCategories[newIndex]
    newCategories[newIndex] = temp

    // Update order_index
    const orders: { [key: string]: number } = {}
    newCategories.forEach((cat, i) => {
      orders[cat.category_id] = i
    })

    await reorderStoreCategories(id!, orders)
    setCategories(newCategories)
  }

  // Post handlers
  const handleCreatePost = async () => {
    if (!id || !postContent.trim()) return

    const newPost = await createStorePost({
      store_id: id,
      content: postContent.trim(),
      images: postImages,
      order_index: 0,
      is_pinned: false
    })

    if (newPost) {
      setPosts([newPost, ...posts])
      setPostContent('')
      setPostImages([])
      setShowPostForm(false)
    }
  }

  const handleUpdatePost = async () => {
    if (!editingPost || !postContent.trim()) return

    const updated = await updateStorePost(editingPost.post_id, {
      content: postContent.trim(),
      images: postImages
    })

    if (updated) {
      setPosts(posts.map(p => p.post_id === updated.post_id ? updated : p))
      setEditingPost(null)
      setPostContent('')
      setPostImages([])
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Postni o\'chirishni tasdiqlaysizmi?')) return

    const success = await deleteStorePost(postId)
    if (success) {
      setPosts(posts.filter(p => p.post_id !== postId))
    }
  }

  const handleTogglePinPost = async (post: StorePost) => {
    const updated = await updateStorePost(post.post_id, {
      is_pinned: !post.is_pinned
    })

    if (updated) {
      setPosts(posts.map(p => p.post_id === updated.post_id ? updated : p))
    }
  }

  // Product stock update
  const handleUpdateStock = async (productId: string, stockQty: number | null) => {
    const updated = await updateStoreProduct(productId, { stock_qty: stockQty })
    if (updated) {
      setProducts(products.map(p => p.listing_id === updated.listing_id ? updated : p))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return null
  }

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.store_category_id === selectedCategory)
    : products

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center text-base font-semibold text-gray-900">Do'konni Boshqarish</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Store Info */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="w-12 h-12 rounded-xl" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{store.name[0].toUpperCase()}</span>
            </div>
          )}
          <div>
            <h2 className="font-bold text-gray-900">{store.name}</h2>
            <p className="text-xs text-gray-500">{store.subscriber_count} obunachi</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-[57px] z-40">
        <div className="flex overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'categories'
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Kategoriyalar
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'products'
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Mahsulotlar ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'posts'
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Postlar ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'settings'
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Sozlamalar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setEditingCategory(null)
                setCategoryTitle('')
                setCategoryEmoji('')
                setShowCategoryForm(true)
              }}
              className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Yangi Kategoriya</span>
            </button>

            {showCategoryForm && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Kategoriya nomi"
                  value={categoryTitle}
                  onChange={(e) => setCategoryTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  type="text"
                  placeholder="Emoji (ixtiyoriy)"
                  value={categoryEmoji}
                  onChange={(e) => setCategoryEmoji(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                  maxLength={10}
                />
                <div className="flex gap-2">
                  <button
                    onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                    className="flex-1 py-2 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                  >
                    Saqlash
                  </button>
                  <button
                    onClick={() => {
                      setShowCategoryForm(false)
                      setEditingCategory(null)
                      setCategoryTitle('')
                      setCategoryEmoji('')
                    }}
                    className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}

            {categories.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-600">Hali kategoriyalar yo'q</p>
                <p className="text-sm text-gray-500 mt-2">Yangi kategoriya yarating</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <div
                    key={category.category_id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{category.emoji || '📦'}</span>
                      <div>
                        <p className="font-medium text-gray-900">{category.title}</p>
                        <p className="text-xs text-gray-500">
                          {products.filter(p => p.store_category_id === category.category_id).length} mahsulot
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveCategory(category.category_id, 'up')}
                        disabled={index === 0}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <ArrowUpIcon className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleMoveCategory(category.category_id, 'down')}
                        disabled={index === categories.length - 1}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <ArrowDownIcon className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategory(category)
                          setCategoryTitle(category.title)
                          setCategoryEmoji(category.emoji || '')
                          setShowCategoryForm(true)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <PencilIcon className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.category_id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === null
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                Barchasi ({products.length})
              </button>
              {categories.map(category => (
                <button
                  key={category.category_id}
                  onClick={() => setSelectedCategory(category.category_id)}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.category_id
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  {category.emoji || '📦'} {category.title} ({products.filter(p => p.store_category_id === category.category_id).length})
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate(`/create?store_id=${id}`)}
              className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Yangi Mahsulot</span>
            </button>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-600">Mahsulotlar yo'q</p>
                <p className="text-sm text-gray-500 mt-2">Yangi mahsulot qo'shing</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map(product => (
                  <div
                    key={product.listing_id}
                    className="bg-white rounded-2xl border border-gray-100 p-4"
                  >
                    <div className="flex items-start gap-3">
                      {product.photos && product.photos.length > 0 ? (
                        <img
                          src={product.photos[0]}
                          alt={product.title}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                          <PhotoIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {product.old_price && (
                            <span className="text-sm text-gray-400 line-through">
                              {product.old_price.toLocaleString()} so'm
                            </span>
                          )}
                          <span className="text-sm font-semibold text-gray-900">
                            {product.price?.toLocaleString() || 'Bepul'} so'm
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500">Mavjudlik:</span>
                          <input
                            type="number"
                            value={product.stock_qty ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value)
                              handleUpdateStock(product.listing_id, value)
                            }}
                            placeholder="Cheksiz"
                            className="w-20 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/listing/${product.listing_id}/edit`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <PencilIcon className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setEditingPost(null)
                setPostContent('')
                setPostImages([])
                setShowPostForm(true)
              }}
              className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Yangi Post</span>
            </button>

            {showPostForm && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <textarea
                  placeholder="Post matni..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={editingPost ? handleUpdatePost : handleCreatePost}
                    className="flex-1 py-2 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                  >
                    Saqlash
                  </button>
                  <button
                    onClick={() => {
                      setShowPostForm(false)
                      setEditingPost(null)
                      setPostContent('')
                      setPostImages([])
                    }}
                    className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}

            {posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-600">Hali postlar yo'q</p>
                <p className="text-sm text-gray-500 mt-2">Yangi post yarating</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <div
                    key={post.post_id}
                    className="bg-white rounded-2xl border border-gray-100 p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(post.created_at).toLocaleDateString('uz-UZ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleTogglePinPost(post)}
                          className={`p-2 rounded-lg transition-colors ${
                            post.is_pinned
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'hover:bg-gray-100 text-gray-600'
                          }`}
                          title={post.is_pinned ? 'Pin olib tashlash' : 'Pin qilish'}
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPost(post)
                            setPostContent(post.content)
                            setPostImages(post.images || [])
                            setShowPostForm(true)
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.post_id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <button
              onClick={() => navigate(`/store/${id}/edit`)}
              className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <span>Do'konni Tahrirlash</span>
              <PencilIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigate(`/store/${id}`)}
              className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <span>Do'konni Ko'rish</span>
              <BuildingStorefrontIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
