/**
 * WizardStepIndicators - Visual step indicators
 * 
 * Shows progress dots with:
 * - Current step (highlighted)
 * - Completed steps (check icon)
 * - Future steps (gray)
 */

import { CheckIcon } from '@heroicons/react/24/outline'

interface WizardStep {
  id: number
  key: string
  title: string
  subtitle: string
  icon: React.ReactNode
}

interface WizardStepIndicatorsProps {
  steps: WizardStep[]
  currentStep: number
  isStepValid: (step: number) => boolean
  onStepClick?: (step: number) => void
}

export default function WizardStepIndicators({
  steps,
  currentStep,
  isStepValid,
  onStepClick
}: WizardStepIndicatorsProps) {
  return (
    <div className="px-4 py-4">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => {
                if (onStepClick && isStepValid(step.id - 1)) {
                  onStepClick(step.id)
                }
              }}
              disabled={!isStepValid(step.id - 1) && step.id !== currentStep}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentStep === step.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white scale-110 shadow-lg shadow-purple-500/50'
                  : currentStep > step.id
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-white/40'
              }`}
            >
              {currentStep > step.id ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <span className="flex items-center justify-center">{step.icon}</span>
              )}
            </button>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 transition-colors duration-300 ${
                currentStep > step.id ? 'bg-green-500' : 'bg-white/10'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
