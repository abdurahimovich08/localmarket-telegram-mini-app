// Telegram Stars payment integration
import { initTelegram } from './telegram'

interface InvoiceParams {
  title: string
  description: string
  payload: Record<string, any>
  prices: Array<{ label: string; amount: number }>
}

// Create invoice for Telegram Stars
export const createStarsInvoice = (params: InvoiceParams): string => {
  // In production, this should call your backend to create an invoice
  // For now, returning a placeholder
  // The backend should use Telegram Bot API to create invoice
  return JSON.stringify(params)
}

// Boost listing (10 Stars)
export const boostListing = async (listingId: string): Promise<boolean> => {
  const webApp = initTelegram()
  if (!webApp) {
    console.error('Telegram WebApp not available')
    return false
  }

  // In production, call your backend to create invoice
  // Backend should use bot.createInvoice() from node-telegram-bot-api
  const invoiceUrl = await createInvoiceOnBackend({
    title: 'Boost Listing',
    description: 'Move your listing to top for 24 hours',
    payload: { type: 'boost', listing_id: listingId },
    prices: [{ label: 'Boost', amount: 10 }], // 10 Telegram Stars
  })

  return new Promise((resolve) => {
    webApp.openInvoice(invoiceUrl, (status: string) => {
      if (status === 'paid') {
        // Call backend to mark listing as boosted
        markListingAsBoosted(listingId)
          .then(() => resolve(true))
          .catch(() => resolve(false))
      } else {
        resolve(false)
      }
    })
  })
}

// Premium seller badge (50 Stars/month)
export const purchasePremiumBadge = async (telegramUserId: number): Promise<boolean> => {
  const webApp = initTelegram()
  if (!webApp) {
    console.error('Telegram WebApp not available')
    return false
  }

  const invoiceUrl = await createInvoiceOnBackend({
    title: 'Premium Seller Badge',
    description: 'Get a premium badge for 1 month',
    payload: { type: 'premium', user_id: telegramUserId },
    prices: [{ label: 'Premium Badge', amount: 50 }], // 50 Telegram Stars
  })

  return new Promise((resolve) => {
    webApp.openInvoice(invoiceUrl, (status: string) => {
      if (status === 'paid') {
        // Call backend to activate premium
        activatePremium(telegramUserId)
          .then(() => resolve(true))
          .catch(() => resolve(false))
      } else {
        resolve(false)
      }
    })
  })
}

// Helper functions (should call your backend API)
async function createInvoiceOnBackend(params: InvoiceParams): Promise<string> {
  // TODO: Replace with actual backend API call
  // Your backend should use Telegram Bot API:
  // bot.createInvoice({
  //   title: params.title,
  //   description: params.description,
  //   payload: JSON.stringify(params.payload),
  //   provider_token: '', // Empty for Stars
  //   currency: 'XTR', // Telegram Stars
  //   prices: params.prices,
  // })
  
  const response = await fetch('/api/create-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create invoice')
  }
  
  const data = await response.json()
  return data.invoice_url
}

async function markListingAsBoosted(listingId: string): Promise<void> {
  const response = await fetch('/api/boost-listing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing_id: listingId }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to boost listing')
  }
}

async function activatePremium(telegramUserId: number): Promise<void> {
  const response = await fetch('/api/activate-premium', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_user_id: telegramUserId }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to activate premium')
  }
}
