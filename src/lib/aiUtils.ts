/**
 * AI Utility Functions
 * Production-ready helpers for AI operations
 */

/**
 * Sanitize text to prevent PII leakage
 */
export function sanitizeText(text: string): string {
  if (!text) return ''
  
  // Remove phone numbers (Uzbek format: +998XXXXXXXXX or 998XXXXXXXXX)
  text = text.replace(/\b\+?998\d{9}\b/g, '[PHONE_REMOVED]')
  
  // Remove email addresses
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REMOVED]')
  
  // Remove potential addresses (common patterns)
  text = text.replace(/\b(ko'cha|tuman|shahar|viloyat)\s+[A-Za-zА-Яа-яЁё\s]+/gi, '[ADDRESS_REMOVED]')
  
  return text.trim()
}

/**
 * Check if text contains PII
 */
export function containsPII(text: string): boolean {
  if (!text) return false
  
  // Phone number patterns
  const phonePattern = /\b\+?998\d{9}\b/
  // Email pattern
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  
  return phonePattern.test(text) || emailPattern.test(text)
}

/**
 * Generate simple hash for cache key
 */
export function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}
