/**
 * Icons8 Icons Helper
 * 
 * Utility functions for using Icons8 icons in the project
 */

// Icon name mappings for easy access
export const Icons8 = {
  // Shopping & Cart
  shoppingCart: '/icons/icons8-shopping-cart-50.png',
  shoppingBag: '/icons/icons8-shopping-bag-50.png',
  shoppingBasket: '/icons/icons8-shopping-basket-50.png',
  addShoppingCart: '/icons/icons8-add-shopping-cart-50.png',
  fastCart: '/icons/icons8-fast-cart-50.png',
  
  // Price & Money
  priceTag: '/icons/icons8-price-tag-50.png',
  priceTagUsd: '/icons/icons8-price-tag-usd-50.png',
  discount: '/icons/icons8-discount-50.png',
  getDiscount: '/icons/icons8-get-a-discount-50.png',
  hotPrice: '/icons/icons8-hot-price-50.png',
  lowPrice: '/icons/icons8-low-price-50.png',
  sale: '/icons/icons8-sale-50.png',
  coupon: '/icons/icons8-coupon-50.png',
  voucher: '/icons/icons8-voucher-50.png',
  
  // Payment & Money
  cash: '/icons/icons8-cash-50.png',
  banknotes: '/icons/icons8-banknotes-50.png',
  coins: '/icons/icons8-coins-50.png',
  dollarBag: '/icons/icons8-dollar-bag-50.png',
  dollarCoin: '/icons/icons8-dollar-coin-50.png',
  stackOfCoins: '/icons/icons8-stack-of-coins-50.png',
  wallet: '/icons/icons8-wallet-50.png',
  cardWallet: '/icons/icons8-card-wallet-50.png',
  coinWallet: '/icons/icons8-coin-wallet-50.png',
  purse: '/icons/icons8-purse-50.png',
  cashRegister: '/icons/icons8-cash-register-50.png',
  cheque: '/icons/icons8-cheque-50.png',
  paid: '/icons/icons8-paid-50.png',
  
  // Buying & Selling
  buy: '/icons/icons8-buy-50.png',
  buyForCash: '/icons/icons8-buy-for-cash-50.png',
  buyForCoins: '/icons/icons8-buy-for-coins-50.png',
  buyForEuro: '/icons/icons8-buy-for-euro-50.png',
  buying: '/icons/icons8-buying-50.png',
  returnPurchase: '/icons/icons8-return-purchase-50.png',
  
  // Store & Shop
  shop: '/icons/icons8-shop-50.png',
  shopLocal: '/icons/icons8-shop-local-50.png',
  onlineStore: '/icons/icons8-online-store-50.png',
  
  // Product & Tags
  product: '/icons/icons8-product-50.png',
  addTag: '/icons/icons8-add-tag-50.png',
  tags: '/icons/icons8-tags-50.png',
  tagWindow: '/icons/icons8-tag-window-50.png',
  
  // Other
  gift: '/icons/icons8-gift-50.png',
  gift2: '/icons/icons8-gift-50-2.png',
  new: '/icons/icons8-new-50.png',
  deliveryTime: '/icons/icons8-delivery-time-50.png',
  loyaltyCard: '/icons/icons8-loyalty-card-50.png',
  noCreditCards: '/icons/icons8-no-credit-cards-50.png',
  stationery: '/icons/icons8-stationery-50.png',
  stationery2: '/icons/icons8-stationery-50-2.png',
  cursorInWindow: '/icons/icons8-cursor-in-window-50.png',
  laptopWithCursor: '/icons/icons8-laptop-with-cursor-50.png',
} as const

/**
 * Get icon path by name
 */
export function getIcon(name: keyof typeof Icons8): string {
  return Icons8[name]
}

/**
 * Icon component props
 */
export interface Icon8Props {
  name: keyof typeof Icons8
  className?: string
  alt?: string
  size?: number
}
