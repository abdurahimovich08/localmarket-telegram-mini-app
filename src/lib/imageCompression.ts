/**
 * Image Compression Utility
 * 
 * Compresses images before upload to reduce file size
 * and improve app performance
 */

export interface CompressionOptions {
  maxSizeMB?: number // Maximum file size in MB (default: 0.5)
  maxWidthOrHeight?: number // Maximum width or height (default: 1920)
  useWebWorker?: boolean // Use web worker for compression (default: true)
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.5, // 500KB (for listings)
  maxWidthOrHeight: 1920,
  useWebWorker: true,
}

// Different compression settings for different use cases
export const COMPRESSION_PRESETS = {
  listing: {
    maxSizeMB: 0.5, // 500KB
    maxWidthOrHeight: 1920,
    initialQuality: 0.8,
  },
  banner: {
    maxSizeMB: 2, // 2MB (banners need higher quality)
    maxWidthOrHeight: 2560,
    initialQuality: 0.85,
  },
  logo: {
    maxSizeMB: 0.3, // 300KB (logos are small)
    maxWidthOrHeight: 1024,
    initialQuality: 0.9, // Higher quality for logos
  },
  portfolio: {
    maxSizeMB: 1, // 1MB (portfolio images)
    maxWidthOrHeight: 1920,
    initialQuality: 0.8,
  },
} as const

export type CompressionPreset = keyof typeof COMPRESSION_PRESETS

/**
 * Compress image file
 * 
 * @param file - Image file to compress
 * @param options - Compression options
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {},
  preset?: CompressionPreset
): Promise<File> {
  // Use preset if provided
  const finalOptions = preset 
    ? { ...COMPRESSION_PRESETS[preset], ...options }
    : { ...DEFAULT_OPTIONS, ...options }

  // Check if file is already small enough
  const maxSizeBytes = finalOptions.maxSizeMB! * 1024 * 1024
  if (file.size <= maxSizeBytes) {
    console.log(`Image already small enough: ${(file.size / 1024).toFixed(2)}KB`)
    return file
  }

  // Check if browser-image-compression is available
  // If not, return original file (graceful degradation)
  try {
    // Dynamic import to avoid bundle size if not needed
    const imageCompression = await import('browser-image-compression')
    
    // Convert HEIC to JPEG if needed
    let fileToCompress = file
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      // HEIC files need special handling
      // For now, browser-image-compression will handle it
      console.log('HEIC file detected, converting to JPEG...')
    }
    
    const compressionOptions = {
      maxSizeMB: finalOptions.maxSizeMB!,
      maxWidthOrHeight: finalOptions.maxWidthOrHeight!,
      useWebWorker: finalOptions.useWebWorker !== false,
      fileType: 'image/jpeg', // Always convert to JPEG for consistency
      initialQuality: preset === 'logo' ? 0.9 : preset === 'banner' ? 0.85 : 0.8,
    }

    const compressedFile = await imageCompression.default(fileToCompress, compressionOptions)
    
    const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1)
    console.log(`Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB (${compressionRatio}% reduction)`)
    
    // Validate compressed file size
    if (compressedFile.size > maxSizeBytes * 1.1) {
      console.warn(`Compressed file still large: ${(compressedFile.size / 1024).toFixed(2)}KB, max: ${(maxSizeBytes / 1024).toFixed(2)}KB`)
    }
    
    return compressedFile
  } catch (error) {
    console.warn('Image compression not available, using original file:', error)
    // If compression fails, return original (better than blocking upload)
    return file
  }
}

/**
 * Compress multiple images
 * 
 * @param files - Array of image files
 * @param options - Compression options
 * @returns Array of compressed files
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const compressedFiles = await Promise.all(
    files.map(file => compressImage(file, options))
  )
  
  return compressedFiles
}

/**
 * Convert data URL to File and compress
 * 
 * @param dataUrl - Data URL string
 * @param filename - Output filename
 * @param options - Compression options
 * @returns Compressed file
 */
export async function compressDataUrl(
  dataUrl: string,
  filename: string = 'image.jpg',
  options: CompressionOptions = {}
): Promise<File> {
  // Convert data URL to File
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const file = new File([blob], filename, { type: blob.type })
  
  // Compress
  return compressImage(file, options)
}

/**
 * Compress multiple data URLs
 * 
 * @param dataUrls - Array of data URL strings
 * @param options - Compression options
 * @param preset - Compression preset (listing, banner, logo, portfolio)
 * @returns Array of compressed files
 */
export async function compressDataUrls(
  dataUrls: string[],
  options: CompressionOptions = {},
  preset: CompressionPreset = 'listing'
): Promise<File[]> {
  const files = await Promise.all(
    dataUrls.map((dataUrl, index) => {
      const arr = dataUrl.split(',')
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
      const filename = `photo-${Date.now()}-${index}.${mime.split('/')[1] || 'jpg'}`
      return compressDataUrl(dataUrl, filename, options, preset)
    })
  )
  
  return files
}

/**
 * Convert data URL to File and compress with preset
 */
export async function compressDataUrl(
  dataUrl: string,
  filename: string = 'image.jpg',
  options: CompressionOptions = {},
  preset?: CompressionPreset
): Promise<File> {
  // Convert data URL to File
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const file = new File([blob], filename, { type: blob.type })
  
  // Compress with preset
  return compressImage(file, options, preset)
}
