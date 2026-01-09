// Image upload utilities
// Supports both Supabase Storage and Cloudinary

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// Compress image before upload
export const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Upload to Cloudinary
export const uploadToCloudinary = async (file: File): Promise<string> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary credentials not configured')
  }

  const compressed = await compressImage(file)
  const formData = new FormData()
  formData.append('file', compressed)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error('Failed to upload image to Cloudinary')
  }

  const data = await response.json()
  return data.secure_url
}

// Upload to Supabase Storage
export const uploadToSupabase = async (
  file: File,
  bucket: string = 'listings',
  folder: string = 'listings'
): Promise<string> => {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL not configured')
  }

  const { supabase } = await import('./supabase')
  const compressed = await compressImage(file)
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, compressed, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

// Upload image (tries Cloudinary first, falls back to Supabase, then base64)
export const uploadImage = async (file: File): Promise<string> => {
  try {
    // Try Cloudinary first if configured
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
      return await uploadToCloudinary(file)
    }
  } catch (error) {
    console.warn('Cloudinary upload failed, trying Supabase:', error)
  }

  try {
    // Try Supabase Storage
    if (SUPABASE_URL) {
      return await uploadToSupabase(file)
    }
  } catch (error) {
    console.warn('Supabase upload failed, using base64:', error)
  }

  // Fallback to base64 (not recommended for production)
  const compressed = await compressImage(file)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(compressed)
  })
}

// Upload multiple images
export const uploadImages = async (files: File[]): Promise<string[]> => {
  const uploadPromises = files.map((file) => uploadImage(file))
  return Promise.all(uploadPromises)
}
