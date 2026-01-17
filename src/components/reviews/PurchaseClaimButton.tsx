/**
 * PurchaseClaimButton - "Sotib oldim" button
 * 
 * Shows different states:
 * - Not claimed: "Sotib oldingizmi?"
 * - Pending: "Tasdiq kutilmoqda"
 * - Approved: "Sharx yozing"
 * - Rejected: "Rad etildi"
 */

import { useState, useEffect } from 'react'
import { 
  ShoppingBagIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon
} from '@heroicons/react/24/solid'
import { 
  createPurchaseClaim, 
  getPurchaseClaimStatus,
  type PurchaseClaim 
} from '../../lib/reviews'

interface PurchaseClaimButtonProps {
  listingId: string
  buyerTelegramId: number
  selectedSize?: string
  selectedColor?: string
  onClaimApproved?: () => void
  onWriteReview?: () => void
}

export default function PurchaseClaimButton({
  listingId,
  buyerTelegramId,
  selectedSize,
  selectedColor,
  onClaimApproved,
  onWriteReview
}: PurchaseClaimButtonProps) {
  const [claim, setClaim] = useState<PurchaseClaim | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    loadClaimStatus()
  }, [listingId, buyerTelegramId])

  const loadClaimStatus = async () => {
    setLoading(true)
    const status = await getPurchaseClaimStatus(listingId, buyerTelegramId)
    setClaim(status)
    setLoading(false)
    
    if (status?.status === 'approved') {
      onClaimApproved?.()
    }
  }

  const handleCreateClaim = async () => {
    setSubmitting(true)
    const newClaim = await createPurchaseClaim(
      listingId,
      buyerTelegramId,
      selectedSize,
      selectedColor,
      'offline'
    )
    
    if (newClaim) {
      setClaim(newClaim)
    }
    setSubmitting(false)
    setShowConfirmModal(false)
  }

  if (loading) {
    return (
      <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
    )
  }

  // Already approved - show write review button
  if (claim?.status === 'approved') {
    return (
      <button
        onClick={onWriteReview}
        className="w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:from-violet-600 hover:to-fuchsia-600 transition-all active:scale-[0.98]"
      >
        <PencilSquareIcon className="w-5 h-5" />
        Sharx yozing
      </button>
    )
  }

  // Pending approval
  if (claim?.status === 'pending') {
    return (
      <div className="py-3 px-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
        <ClockIcon className="w-5 h-5 text-amber-400" />
        <div className="flex-1">
          <p className="text-amber-400 font-medium text-sm">Tasdiq kutilmoqda</p>
          <p className="text-white/50 text-xs">Sotuvchi xaridni tasdiqlashi kerak</p>
        </div>
      </div>
    )
  }

  // Rejected
  if (claim?.status === 'rejected') {
    return (
      <div className="py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
        <XCircleIcon className="w-5 h-5 text-red-400" />
        <div className="flex-1">
          <p className="text-red-400 font-medium text-sm">Rad etildi</p>
          {claim.rejection_reason && (
            <p className="text-white/50 text-xs">{claim.rejection_reason}</p>
          )}
        </div>
      </div>
    )
  }

  // No claim yet - show create claim button
  return (
    <>
      <button
        onClick={() => setShowConfirmModal(true)}
        className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white/80 font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
      >
        <ShoppingBagIcon className="w-5 h-5" />
        Sotib oldingizmi? Tasdiqlang
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="relative bg-slate-900 rounded-2xl p-6 max-w-sm w-full animate-slideUp border border-white/10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBagIcon className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Xaridni tasdiqlash</h3>
              <p className="text-white/60 text-sm">
                Bu mahsulotni sotib olganingizni tasdiqlaysizmi? 
                Sotuvchi tasdiqlagandan so'ng sharx yozishingiz mumkin.
              </p>
            </div>

            {(selectedSize || selectedColor) && (
              <div className="flex items-center justify-center gap-2 mb-4 text-sm">
                <span className="text-white/50">Tanlangan:</span>
                {selectedColor && (
                  <span className="px-2 py-1 bg-white/10 rounded-lg text-white">{selectedColor}</span>
                )}
                {selectedSize && (
                  <span className="px-2 py-1 bg-white/10 rounded-lg text-white">{selectedSize}</span>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-white/5 rounded-xl text-white/60 font-medium hover:bg-white/10 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleCreateClaim}
                disabled={submitting}
                className="flex-1 py-3 bg-violet-500 rounded-xl text-white font-semibold hover:bg-violet-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Tasdiqlash
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
