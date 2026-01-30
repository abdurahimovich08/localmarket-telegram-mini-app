/**
 * Step 4: Price
 * 
 * Handles:
 * - Price input (formatted)
 * - Price negotiable toggle
 * - Discount toggle
 * - Discount details (original price, reason)
 */

interface PriceFormData {
  price: string
  priceNegotiable: boolean
  hasDiscount: boolean
  originalPrice: string
  discountReason: string
}

interface Step4PriceProps {
  formData: PriceFormData
  onFormDataChange: (data: Partial<PriceFormData>) => void
  formatPrice: (value: string) => string
}

export default function Step4Price({
  formData,
  onFormDataChange,
  formatPrice
}: Step4PriceProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Price input */}
      <div className="space-y-2">
        <label className="text-white/80 text-sm font-medium">
          Narx *
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.price}
            onChange={(e) => onFormDataChange({ price: formatPrice(e.target.value) })}
            placeholder="500 000"
            className="w-full px-4 py-5 pr-16 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-white text-2xl font-bold placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 font-medium">
            so'm
          </span>
        </div>
      </div>

      {/* Price Negotiable */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
        <input
          type="checkbox"
          id="priceNegotiable"
          checked={formData.priceNegotiable}
          onChange={(e) => onFormDataChange({ priceNegotiable: e.target.checked })}
          className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500"
        />
        <label htmlFor="priceNegotiable" className="flex-1 text-white/80 text-sm cursor-pointer">
          Narx kelishiladi
        </label>
      </div>

      {/* Discount Toggle */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
        <input
          type="checkbox"
          id="hasDiscount"
          checked={formData.hasDiscount}
          onChange={(e) => onFormDataChange({ hasDiscount: e.target.checked })}
          className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500"
        />
        <label htmlFor="hasDiscount" className="flex-1 text-white/80 text-sm cursor-pointer">
          Chegirma bor
        </label>
      </div>

      {/* Discount Details */}
      {formData.hasDiscount && (
        <div className="space-y-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="space-y-2">
            <label className="text-white/80 text-sm font-medium">
              Asl narx *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.originalPrice}
                onChange={(e) => onFormDataChange({ originalPrice: formatPrice(e.target.value) })}
                placeholder="600 000"
                className="w-full px-4 py-3 pr-16 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 text-sm">
                so'm
              </span>
            </div>
            {formData.price && formData.originalPrice && (
              <p className="text-purple-300 text-sm font-medium">
                Chegirma: {Math.round((1 - parseFloat(formData.price.replace(/\s/g, '')) / parseFloat(formData.originalPrice.replace(/\s/g, ''))) * 100)}%
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-white/80 text-sm font-medium">
              Chegirma sababi (ixtiyoriy)
            </label>
            <input
              type="text"
              value={formData.discountReason}
              onChange={(e) => onFormDataChange({ discountReason: e.target.value })}
              placeholder="Masalan: Mavsumiy chegirma, Yangi kolleksiya"
              maxLength={100}
              className="w-full px-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all text-sm"
            />
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <p className="text-white/80 text-sm font-medium mb-2">
          💡 Maslahat
        </p>
        <ul className="text-white/60 text-xs space-y-1">
          <li>• Bozor narxini tekshiring</li>
          <li>• O'xshash mahsulotlarni solishtiring</li>
          <li>• Chegirma bo'lsa, aniq ko'rsating</li>
        </ul>
      </div>
    </div>
  )
}
