import { useEffect } from 'react'

interface ActionSheetOption {
  emoji: string
  label: string
  onClick: () => void
  disabled?: boolean
}

interface ActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  options: ActionSheetOption[]
}

export default function ActionSheet({ isOpen, onClose, title, options }: ActionSheetProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] animate-fade-in"
        onClick={onClose}
      />
      
      {/* Action Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[101] safe-area-bottom animate-slide-up shadow-2xl">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Title */}
        <div className="px-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900 text-center">{title}</h2>
        </div>

        {/* Options */}
        <div className="px-4 pb-4 space-y-2">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                if (!option.disabled) {
                  option.onClick()
                  onClose()
                }
              }}
              disabled={option.disabled}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                option.disabled
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-50 hover:bg-primary/10 active:bg-primary/20 text-gray-900'
              }`}
            >
              <span className="text-3xl">{option.emoji}</span>
              <span className={`flex-1 text-left font-medium ${option.disabled ? 'text-gray-400' : 'text-gray-900'}`}>
                {option.label}
              </span>
              {option.disabled && (
                <span className="text-xs text-gray-400">Tez orada</span>
              )}
            </button>
          ))}
        </div>

        {/* Cancel button */}
        <div className="px-4 pb-6 pt-2">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 font-medium rounded-xl transition-colors"
          >
            Bekor qilish
          </button>
        </div>
      </div>
    </>
  )
}
