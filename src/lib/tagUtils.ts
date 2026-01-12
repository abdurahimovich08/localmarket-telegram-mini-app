/**
 * Centralized Tag Rules and Utilities
 * 
 * This file contains all tag-related rules and validation logic
 * used across AI generation, Frontend, and Backend.
 * 
 * Inspired by: LinkedIn, Upwork, Fiverr tag systems
 */

// ============================================
// TAG RULES (Single Source of Truth)
// ============================================

export const TAG_RULES = {
  MAX: 7,                    // Maximum number of tags
  MIN: 3,                    // Minimum number of tags (for AI generation)
  MIN_LENGTH: 1,             // Minimum tag length
  MAX_LENGTH: 20,            // Maximum tag length
  REGEX: /^[a-z0-9-]+$/,     // Only lowercase letters, numbers, and hyphens
  SEPARATOR: '-',            // Word separator (hyphen, not space)
} as const

// ============================================
// FALLBACK TAGS (When AI returns 0 or invalid tags)
// ============================================

export const FALLBACK_TAGS = [
  'service',
  'local',
  'professional',
] as const

// ============================================
// INTENT-BASED TAG CATEGORIES
// ============================================
// Inspired by LinkedIn Skills and Service Marketplaces

export const TAG_CATEGORIES = {
  // Technology
  tech: {
    web: ['web-development', 'frontend', 'backend', 'fullstack', 'responsive-design'],
    mobile: ['mobile-app', 'ios', 'android', 'react-native', 'flutter'],
    desktop: ['desktop-app', 'windows', 'macos', 'linux'],
    database: ['database', 'sql', 'mongodb', 'postgresql'],
    cloud: ['cloud', 'aws', 'azure', 'gcp', 'devops'],
    ai: ['ai', 'machine-learning', 'chatbot', 'automation'],
  },
  
  // Design
  design: {
    graphic: ['logo-design', 'brand-identity', 'business-card', 'flyer', 'poster'],
    web: ['web-design', 'ui-design', 'ux-design', 'landing-page', 'ecommerce'],
    print: ['print-design', 'brochure', 'catalog', 'packaging'],
    social: ['social-media-design', 'instagram-post', 'facebook-cover'],
  },
  
  // Marketing
  marketing: {
    seo: ['seo', 'keyword-research', 'on-page-seo', 'link-building'],
    social: ['social-media-marketing', 'content-creation', 'influencer-marketing'],
    ads: ['google-ads', 'facebook-ads', 'instagram-ads', 'ppc'],
    email: ['email-marketing', 'newsletter', 'automation'],
  },
  
  // Business
  business: {
    consulting: ['business-consulting', 'strategy', 'market-research'],
    finance: ['accounting', 'bookkeeping', 'tax-preparation'],
    legal: ['legal-advice', 'contract-review', 'documentation'],
    hr: ['recruitment', 'hr-consulting', 'training'],
  },
  
  // Writing & Content
  writing: {
    content: ['content-writing', 'blog-writing', 'article-writing', 'copywriting'],
    translation: ['translation', 'localization', 'proofreading'],
    technical: ['technical-writing', 'documentation', 'user-manual'],
  },
  
  // Services
  services: {
    delivery: ['fast-delivery', 'express', '24-7-support'],
    quality: ['premium', 'professional', 'certified', 'guaranteed'],
    pricing: ['affordable', 'budget-friendly', 'competitive'],
  },
} as const

// ============================================
// VALIDATION & NORMALIZATION
// ============================================

/**
 * Normalize a single tag: lowercase, remove invalid chars, replace spaces with hyphens
 */
export function normalizeTag(tag: string): string {
  if (!tag || typeof tag !== 'string') return ''
  
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, TAG_RULES.SEPARATOR)  // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '')            // Remove non-Latin characters
    .replace(/-+/g, TAG_RULES.SEPARATOR)   // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')                 // Remove leading/trailing hyphens
}

/**
 * Validate a single tag against rules
 */
export function validateTag(tag: string): boolean {
  if (!tag || typeof tag !== 'string') return false
  
  const normalized = normalizeTag(tag)
  
  if (normalized.length < TAG_RULES.MIN_LENGTH) return false
  if (normalized.length > TAG_RULES.MAX_LENGTH) return false
  if (!TAG_RULES.REGEX.test(normalized)) return false
  
  return true
}

/**
 * Validate and normalize an array of tags
 * - Normalizes each tag
 * - Removes duplicates
 * - Filters invalid tags
 * - Limits to MAX tags
 * - Adds fallback tags if result is empty
 */
export function validateAndNormalizeTags(tags: string[]): string[] {
  if (!Array.isArray(tags)) return [...FALLBACK_TAGS]
  
  // Normalize and validate
  const normalized = tags
    .map(tag => normalizeTag(tag))
    .filter(tag => validateTag(tag))
  
  // Remove duplicates (case-insensitive)
  const unique = Array.from(new Set(normalized))
  
  // Limit to MAX tags
  const limited = unique.slice(0, TAG_RULES.MAX)
  
  // If no valid tags, use fallback
  if (limited.length === 0) {
    return [...FALLBACK_TAGS]
  }
  
  // If less than MIN (for AI generation), add fallback tags (but don't exceed MAX)
  if (limited.length < TAG_RULES.MIN) {
    const fallbackToAdd = FALLBACK_TAGS.slice(0, TAG_RULES.MAX - limited.length)
    return [...limited, ...fallbackToAdd].slice(0, TAG_RULES.MAX)
  }
  
  return limited
}

/**
 * Sanitize AI-generated tags (strict validation)
 * This is called after AI returns tags to ensure they meet all requirements
 */
export function sanitizeAITags(aiTags: string[]): string[] {
  if (!Array.isArray(aiTags)) return [...FALLBACK_TAGS]
  
  // First pass: normalize and validate
  let sanitized = validateAndNormalizeTags(aiTags)
  
  // Second pass: remove semantically similar tags
  sanitized = removeSimilarTags(sanitized)
  
  // Third pass: ensure minimum count
  if (sanitized.length < TAG_RULES.MIN) {
    const fallbackToAdd = FALLBACK_TAGS.slice(0, TAG_RULES.MIN - sanitized.length)
    sanitized = [...sanitized, ...fallbackToAdd].slice(0, TAG_RULES.MAX)
  }
  
  // Fourth pass: ensure maximum count
  if (sanitized.length > TAG_RULES.MAX) {
    sanitized = sanitized.slice(0, TAG_RULES.MAX)
  }
  
  return sanitized
}

/**
 * Remove semantically similar tags
 * Example: ['web', 'web-development', 'website'] → ['web-development']
 */
function removeSimilarTags(tags: string[]): string[] {
  const result: string[] = []
  
  for (const tag of tags) {
    // Check if this tag is a substring of any existing tag (or vice versa)
    const isSimilar = result.some(existing => {
      const tagLower = tag.toLowerCase()
      const existingLower = existing.toLowerCase()
      
      // If one contains the other, they're similar
      if (tagLower.includes(existingLower) || existingLower.includes(tagLower)) {
        // Keep the longer, more specific one
        return tagLower.length <= existingLower.length
      }
      
      return false
    })
    
    if (!isSimilar) {
      result.push(tag)
    }
  }
  
  return result
}

/**
 * Suggest intent-based tags based on service title and description
 * This helps AI generate more specific, semantic tags
 */
export function suggestIntentBasedTags(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase()
  const suggestions: string[] = []
  
  // Check for technology keywords
  if (text.match(/\b(web|website|site|html|css|javascript|react|vue|angular)\b/)) {
    suggestions.push('web-development')
  }
  if (text.match(/\b(mobile|app|ios|android|react-native|flutter)\b/)) {
    suggestions.push('mobile-app')
  }
  if (text.match(/\b(logo|brand|identity|graphic)\b/)) {
    suggestions.push('logo-design')
  }
  if (text.match(/\b(design|ui|ux|interface)\b/)) {
    suggestions.push('web-design')
  }
  if (text.match(/\b(seo|search|optimization)\b/)) {
    suggestions.push('seo')
  }
  if (text.match(/\b(telegram|bot|mini-app)\b/)) {
    suggestions.push('telegram-bot')
  }
  if (text.match(/\b(fast|quick|express|urgent)\b/)) {
    suggestions.push('fast-delivery')
  }
  if (text.match(/\b(professional|expert|certified)\b/)) {
    suggestions.push('professional')
  }
  
  return validateAndNormalizeTags(suggestions)
}

/**
 * Get tag category for grouping/sorting
 */
export function getTagCategory(tag: string): string | null {
  const normalized = normalizeTag(tag)
  
  // Check each category
  for (const [category, subcategories] of Object.entries(TAG_CATEGORIES)) {
    for (const tags of Object.values(subcategories)) {
      if (tags.includes(normalized)) {
        return category
      }
    }
  }
  
  return null
}
