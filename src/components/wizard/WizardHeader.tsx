/**
 * WizardHeader - Reusable header component for wizard steps
 * 
 * Displays:
 * - Back button
 * - Step title & subtitle with icon
 * - Progress indicator (X/6)
 * - Progress bar
 * - Selected taxonomy breadcrumb (if applicable)
 */

import { ArrowLeftIcon, TagIcon } from '@heroicons/react/24/outline'
import Icons8Icon from '../Icons8Icon'
import { TaxonNode } from '../../taxonomy/clothing.uz'

interface WizardStep {
  id: number
  key: string
  title: string
  subtitle: string
  icon: React.ReactNode
}

interface WizardHeaderProps {
  currentStep: number
  steps: WizardStep[]
  selectedTaxonomy: TaxonNode | null
  progressPercent: number
  onBack: () => void
}

export default function WizardHeader({
  currentStep,
  steps,
  selectedTaxonomy,
  progressPercent,
  onBack
}: WizardHeaderProps) {
  const currentStepData = steps[currentStep - 1]
  
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-white" />
        </button>
        
        <div className="text-center">
          <h1 className="text-white font-semibold text-lg flex items-center justify-center gap-2">
            <span className="flex items-center justify-center">{currentStepData.icon}</span>
            {currentStepData.title}
          </h1>
          <p className="text-white/60 text-xs">
            {currentStepData.subtitle}
          </p>
        </div>
        
        <div className="w-10 text-center">
          <span className="text-white/80 text-sm font-medium">
            {currentStep}/{steps.length}
          </span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div 
          className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Selected taxonomy breadcrumb */}
      {selectedTaxonomy && currentStep > 1 && (
        <div className="px-4 py-2 bg-white/5 border-t border-white/5">
          <p className="text-white/60 text-xs text-center flex items-center justify-center gap-2">
            <TagIcon className="w-3 h-3" />
            {selectedTaxonomy.pathUz}
          </p>
        </div>
      )}
    </header>
  )
}
