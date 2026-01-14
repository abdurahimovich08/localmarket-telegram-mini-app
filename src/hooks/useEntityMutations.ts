import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createListing,
  updateListing,
  deleteListing,
  createService,
  updateService,
  createStore,
  updateStore,
  createStoreCategory,
  updateStoreCategory,
  deleteStoreCategory,
  createStorePost,
  updateStorePost,
  deleteStorePost,
} from '../lib/supabase'
import { uploadImages } from '../lib/imageUpload'
import { compressDataUrls } from '../lib/imageCompression'
import type { Listing, Service, Store, StoreCategory, StorePost } from '../types'

type EntityType = 'listing' | 'service' | 'store' | 'store_category' | 'store_post'

interface UseEntityMutationsOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  redirectOnSuccess?: string
}

export function useEntityMutations(
  entityType: EntityType,
  options: UseEntityMutationsOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const navigate = useNavigate()

  const { onSuccess, onError, redirectOnSuccess } = options

  // Universal image upload handler with compression
  const handleImageUpload = async (photos: string[]): Promise<string[]> => {
    if (photos.length === 0) return []

    try {
      // Compress images before upload (use appropriate preset)
      const preset = entityType === 'store' ? 'banner' : 'listing'
      const compressedFiles = await compressDataUrls(photos, {}, preset)

      // Upload compressed images
      const photoUrls = await uploadImages(compressedFiles)
      return photoUrls
    } catch (err) {
      console.error('Error uploading images:', err)
      throw new Error('Rasm yuklashda xatolik yuz berdi')
    }
  }

  // Create function
  const create = async (data: any) => {
    setIsLoading(true)
    setError(null)

    try {
      let result: any

      // Handle image upload if photos exist
      if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
        data.photos = await handleImageUpload(data.photos)
      }

      // Entity type-based creation
      switch (entityType) {
        case 'listing':
          result = await createListing(data)
          break
        case 'service':
          result = await createService(data)
          break
        case 'store':
          result = await createStore(data)
          break
        case 'store_category':
          result = await createStoreCategory(data)
          break
        case 'store_post':
          result = await createStorePost(data)
          break
        default:
          throw new Error(`Unknown entity type: ${entityType}`)
      }

      if (result) {
        onSuccess?.(result)
        if (redirectOnSuccess) {
          navigate(redirectOnSuccess)
        }
        return result
      } else {
        throw new Error('Yaratish muvaffaqiyatsiz')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Noma\'lum xatolik')
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Update function
  const update = async (id: string, updates: any) => {
    setIsLoading(true)
    setError(null)

    try {
      // Handle image upload if photos exist
      if (updates.photos && Array.isArray(updates.photos) && updates.photos.length > 0) {
        // Check if photos are data URLs (need upload) or URLs (already uploaded)
        const needsUpload = updates.photos.some((photo: string) => photo.startsWith('data:'))
        if (needsUpload) {
          updates.photos = await handleImageUpload(updates.photos)
        }
      }

      let result: any

      switch (entityType) {
        case 'listing':
          result = await updateListing(id, updates)
          break
        case 'service':
          result = await updateService(id, updates)
          break
        case 'store':
          result = await updateStore(id, updates)
          break
        case 'store_category':
          result = await updateStoreCategory(id, updates)
          break
        case 'store_post':
          result = await updateStorePost(id, updates)
          break
        default:
          throw new Error(`Unknown entity type: ${entityType}`)
      }

      if (result) {
        onSuccess?.(result)
        if (redirectOnSuccess) {
          navigate(redirectOnSuccess)
        }
        return result
      } else {
        throw new Error('Yangilash muvaffaqiyatsiz')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Noma\'lum xatolik')
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Delete function
  const remove = async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      let success: boolean

      switch (entityType) {
        case 'listing':
          success = await deleteListing(id)
          break
        case 'service':
          // Services use soft delete (status = 'deleted')
          const serviceResult = await updateService(id, { status: 'deleted' })
          success = !!serviceResult
          break
        case 'store':
          // Stores use soft delete (is_active = false)
          const storeResult = await updateStore(id, { is_active: false } as any)
          success = !!storeResult
          break
        case 'store_category':
          success = await deleteStoreCategory(id)
          break
        case 'store_post':
          success = await deleteStorePost(id)
          break
        default:
          throw new Error(`Unknown entity type: ${entityType}`)
      }

      if (success) {
        onSuccess?.(null)
        if (redirectOnSuccess) {
          navigate(redirectOnSuccess)
        }
        return true
      } else {
        throw new Error('O\'chirish muvaffaqiyatsiz')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Noma\'lum xatolik')
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    create,
    update,
    remove,
    isLoading,
    error,
  }
}
