/**
 * Preserve Context Helper
 * 
 * Store mode'da user boshqa page'ga o'tsa ctx ketib qolmasligi uchun
 */

import { useNavigate } from 'react-router-dom'
import { useAppMode } from '../contexts/AppModeContext'

/**
 * Navigate with context preservation
 * 
 * Store/Service mode'da ctx'ni saqlab qoladi
 */
export function useNavigateWithCtx() {
  const navigate = useNavigate()
  const { mode } = useAppMode()

  return (to: string, options?: { replace?: boolean; state?: any }) => {
    // If in branded mode, preserve context in URL
    if (mode.kind === 'store') {
      const separator = to.includes('?') ? '&' : '?'
      navigate(`${to}${separator}ctx=store:${mode.storeId}`, options)
    } else if (mode.kind === 'service') {
      const separator = to.includes('?') ? '&' : '?'
      navigate(`${to}${separator}ctx=service:${mode.serviceId}`, options)
    } else {
      navigate(to, options)
    }
  }
}

/**
 * Get context from URL params
 */
export function getCtxFromUrl(): { kind: 'store' | 'service' | 'marketplace'; id?: string } | null {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const ctx = params.get('ctx')

  if (!ctx) return null

  const [type, id] = ctx.split(':')
  
  if (type === 'store' && id) {
    return { kind: 'store', id }
  }
  
  if (type === 'service' && id) {
    return { kind: 'service', id }
  }

  return null
}
