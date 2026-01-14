/**
 * Error Mapping Utility
 * 
 * Centralized error mapping: Supabase error code → UI message
 * Prevents "Unknown error" messages
 */

export interface MappedError {
  message: string
  code?: string
  userFriendly: boolean
}

/**
 * Map Supabase error to user-friendly message
 */
export function mapSupabaseError(error: any): MappedError {
  // If already a MappedError, return as is
  if (error && typeof error === 'object' && error.userFriendly) {
    return error
  }

  // Extract error code and message
  const code = error?.code || error?.error?.code
  const message = error?.message || error?.error?.message || 'Noma\'lum xatolik'

  // RLS Policy Violations
  if (code === '42501' || message.includes('row-level security')) {
    return {
      message: 'Sizda bu amalni bajarish uchun ruxsat yo\'q',
      code: 'RLS_VIOLATION',
      userFriendly: true,
    }
  }

  // Foreign Key Violations
  if (code === '23503') {
    return {
      message: 'Bog\'liq ma\'lumot topilmadi',
      code: 'FOREIGN_KEY_VIOLATION',
      userFriendly: true,
    }
  }

  // Unique Constraint Violations
  if (code === '23505') {
    return {
      message: 'Bu ma\'lumot allaqachon mavjud',
      code: 'UNIQUE_VIOLATION',
      userFriendly: true,
    }
  }

  // Not Null Violations
  if (code === '23502') {
    return {
      message: 'Majburiy maydon to\'ldirilmagan',
      code: 'NOT_NULL_VIOLATION',
      userFriendly: true,
    }
  }

  // Network Errors
  if (message.includes('network') || message.includes('fetch')) {
    return {
      message: 'Internet aloqasi bilan muammo. Qayta urinib ko\'ring',
      code: 'NETWORK_ERROR',
      userFriendly: true,
    }
  }

  // Storage Errors
  if (message.includes('storage') || message.includes('bucket')) {
    return {
      message: 'Rasm yuklashda xatolik. Qayta urinib ko\'ring',
      code: 'STORAGE_ERROR',
      userFriendly: true,
    }
  }

  // Image Compression Errors
  if (message.includes('compression') || message.includes('image')) {
    return {
      message: 'Rasmni qayta ishlashda xatolik. Boshqa rasm tanlang',
      code: 'IMAGE_ERROR',
      userFriendly: true,
    }
  }

  // Generic error with original message
  return {
    message: message || 'Xatolik yuz berdi. Qayta urinib ko\'ring',
    code: code || 'UNKNOWN',
    userFriendly: false,
  }
}

/**
 * Format error for display
 */
export function formatError(error: any): string {
  const mapped = mapSupabaseError(error)
  return mapped.message
}
