import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found')
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

/**
 * Get user context (stores, services, listings)
 * Used by AI to understand user's current state
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabase) {
    console.error('Supabase not configured. Missing:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      url: supabaseUrl ? 'present' : 'missing',
      key: supabaseKey ? 'present' : 'missing'
    })
    return res.status(500).json({ 
      error: 'Database not configured',
      details: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables'
    })
  }

  try {
    const { telegram_user_id } = req.body

    if (!telegram_user_id) {
      return res.status(400).json({ error: 'telegram_user_id is required' })
    }

    // Get user's store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('store_id, name')
      .eq('owner_telegram_id', telegram_user_id)
      .eq('is_active', true)
      .single()

    if (storeError && storeError.code !== 'PGRST116') {
      console.error('Error fetching store:', storeError)
    }

    // Get user's services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('service_id')
      .eq('provider_telegram_id', telegram_user_id)
      .eq('is_active', true)

    if (servicesError) {
      console.error('Error fetching services:', servicesError)
    }

    // Get user's listings count
    const { count: listingsCount, error: listingsError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('seller_telegram_id', telegram_user_id)
      .eq('status', 'active')

    if (listingsError) {
      console.error('Error fetching listings count:', listingsError)
    }

    const userContext = {
      hasStore: !!store,
      hasServices: (services?.length || 0) > 0,
      hasListings: (listingsCount || 0) > 0,
      storeId: store?.store_id,
      storeName: store?.name,
      serviceIds: services?.map(s => s.service_id) || []
    }

    res.status(200).json(userContext)
  } catch (error) {
    console.error('Error in user-context:', error)
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
