// Vercel Serverless Function to track referral codes
// POST /api/track-referral
// Body: { user_telegram_id: number, referral_code: string }

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found')
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' })
  }

  try {
    const { user_telegram_id, referral_code } = req.body

    if (!user_telegram_id || !referral_code) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['user_telegram_id', 'referral_code']
      })
    }

    // Database function'ni chaqirish
    const { data, error } = await supabase.rpc('track_referral', {
      p_user_telegram_id: user_telegram_id,
      p_referral_code: referral_code
    })

    if (error) {
      console.error('Error tracking referral:', error)
      return res.status(500).json({ 
        error: 'Failed to track referral',
        details: error.message
      })
    }

    // data JSONB bo'ladi, parse qilish kerak
    const result = typeof data === 'string' ? JSON.parse(data) : data

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error || 'Invalid referral code'
      })
    }

    return res.status(200).json({
      success: true,
      store_id: result.store_id,
      store_name: result.store_name
    })
  } catch (error) {
    console.error('Error in track-referral:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
