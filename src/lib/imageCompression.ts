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
  maxSizeMB: 0.5, // 500KB
  maxWidthOrHeight: 1920,
  useWebWorker: true,
}

/**
 * Compress image file
 * 
 * @param file - Image file to compress
 * @param options - Compression options
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // Check if file is already small enough
  const maxSizeBytes = (options.maxSizeMB || DEFAULT_OPTIONS.maxSizeMB!) * 1024 * 1024
  if (file.size <= maxSizeBytes) {
    return file
  }

  // Check if browser-image-compression is available
  // If not, return original file (graceful degradation)
  try {
    // Dynamic import to avoid bundle size if not needed
    const imageCompression = await import('browser-image-compression')
    
    const compressionOptions = {
      maxSizeMB: options.maxSizeMB || DEFAULT_OPTIONS.maxSizeMB!,
      maxWidthOrHeight: options.maxWidthOrHeight || DEFAULT_OPTIONS.maxWidthOrHeight!,
      useWebWorker: options.useWebWorker !== false,
      fileType: file.type || 'image/jpeg',
      initialQuality: 0.8,
    }

    const compressedFile = await imageCompression.default(file, compressionOptions)
    
    console.log(`Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`)
    
    return compressedFile
  } catch (error) {
    console.warn('Image compression not available, using original file:', error)
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
 * @returns Array of compressed files
 */
export async function compressDataUrls(
  dataUrls: string[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const files = await Promise.all(
    dataUrls.map((dataUrl, index) => {
      const arr = dataUrl.split(',')
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
      const filename = `photo-${Date.now()}-${index}.${mime.split('/')[1] || 'jpg'}`
      return compressDataUrl(dataUrl, filename, options)
    })
  )
  
  return files
}
