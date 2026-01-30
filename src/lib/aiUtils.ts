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

/**
 * Simple in-memory LRU cache for AI responses
 * Max 10 entries, 15 min TTL
 */
class AICache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly maxSize = 10
  private readonly ttl = 15 * 60 * 1000 // 15 minutes

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  set(key: string, data: any): void {
    // Remove oldest entries if at max size
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      // Remove oldest 20% (2 entries if maxSize=10)
      const toRemove = Math.floor(this.maxSize * 0.2)
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0])
      }
    }
    
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Export singleton instance
export const aiCache = new AICache()
