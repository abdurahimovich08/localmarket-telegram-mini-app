/**
 * WizardFooter - Reusable footer component for wizard navigation
 * 
 * Displays:
 * - Back button (if not first step)
 * - Next/Submit button (with validation)
 * - Loading state
 */

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import Icons8Icon from '../Icons8Icon'

interface WizardFooterProps {
  currentStep: number
  totalSteps: number
  canProceed: boolean
  isValid: boolean
  onBack: () => void
  onNext: () => void
  isSubmitting?: boolean
  submitLabel?: string
  nextLabel?: string
}

export default function WizardFooter({
  currentStep,
  totalSteps,
  canProceed,
  isValid,
  onBack,
  onNext,
  isSubmitting = false,
  submitLabel = "E'lonni joylash",
  nextLabel = "Keyingi"
}: WizardFooterProps) {
  const isLastStep = currentStep === totalSteps
  const showBack = currentStep > 1
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent pt-8 pb-safe">
      <div className="px-4 pb-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {/* Back Button */}
          {showBack && (
            <button
              onClick={onBack}
              disabled={isSubmitting}
              className="flex-1 px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white font-medium hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Orqaga
            </button>
          )}
          
          {/* Next/Submit Button */}
          <button
            onClick={onNext}
            disabled={!canProceed || !isValid || isSubmitting}
            className={`flex-1 px-4 py-4 rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isLastStep
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 active:scale-95'
                : canProceed && isValid
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 active:scale-95'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Kutilmoqda...</span>
              </>
            ) : isLastStep ? (
              <>
                <Icons8Icon name="rocket" size={20} className="opacity-90" />
                <span>{submitLabel}</span>
              </>
            ) : (
              <>
                <span>{nextLabel}</span>
                <ArrowRightIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
