import { TruckIcon, CreditCardIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface StorePolicyRowProps {
  deliveryTime?: string
  paymentMethods?: string[]
  returnPolicy?: string
  className?: string
}

export default function StorePolicyRow({
  deliveryTime = "1-2 kun",
  paymentMethods = ["Naqd", "Karta"],
  returnPolicy = "7 kun",
  className = ''
}: StorePolicyRowProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide pb-2 ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0">
        <TruckIcon className="w-4 h-4" />
        <span>Yetkazib berish: {deliveryTime}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0">
        <CreditCardIcon className="w-4 h-4" />
        <span>To'lov: {paymentMethods.join(' / ')}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0">
        <ArrowPathIcon className="w-4 h-4" />
        <span>Qaytarish: {returnPolicy}</span>
      </div>
    </div>
  )
}
