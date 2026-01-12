/**
 * Service Fingerprint System (Prevent Cold Start Abuse)
 * 
 * Creates a unique fingerprint for each service based on seller + title
 * Prevents sellers from deleting and recreating services to get cold start boost
 */

import { createHash } from 'crypto'

/**
 * Generate service fingerprint
 * Based on: seller_id + normalized title
 * This prevents abuse: same seller can't recreate same service to get cold start boost
 */
export function generateServiceFingerprint(
  providerTelegramId: number,
  title: string
): string {
  // Normalize title: lowercase, remove extra spaces, remove special chars
  const normalizedTitle = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/g, '')

  // Create hash: seller_id + normalized_title
  const hashInput = `${providerTelegramId}:${normalizedTitle}`
  
  // Use simple hash (can use crypto.createHash in Node.js, or simple hash in browser)
  // For browser compatibility, using a simple hash function
  let hash = 0
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return `fp_${Math.abs(hash).toString(36)}`
}

/**
 * Check if service is eligible for cold start boost
 * Returns true only if:
 * 1. Service is < 7 days old
 * 2. This is the FIRST service with this fingerprint (not a recreation)
 */
export async function isEligibleForColdStart(
  serviceId: string,
  fingerprint: string,
  createdAt: string,
  supabaseClient: any
): Promise<boolean> {
  // Check age
  const daysSinceCreation = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreation >= 7) {
    return false // Too old for cold start
  }

  // Check if this fingerprint was used before (abuse prevention)
  // We'll need to store fingerprint in database
  // For now, check if there are older services with same fingerprint
  const { data, error } = await supabaseClient
    .from('services')
    .select('service_id, created_at')
    .eq('fingerprint', fingerprint)
    .neq('service_id', serviceId)
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) {
    console.error('Error checking service fingerprint:', error)
    return true // Allow if check fails (fail open)
  }

  // If older service with same fingerprint exists, this is a recreation
  if (data && data.length > 0) {
    return false // Abuse detected: same seller recreating same service
  }

  return true // First service with this fingerprint
}
