# 🛒 Savatcha (Cart) Tizimi - Reja

## 🎯 Maqsad
Marketplace ilovalarning savatcha tizimini o'rganib, LocalMarket uchun professional cart tizimi yaratish.

---

## 📚 Marketplace Cart Tizimlari O'rganish

### 1. **Amazon Cart**
- ✅ Add to Cart (single click)
- ✅ Cart icon with badge (item count)
- ✅ Persistent cart (sync across devices)
- ✅ Quantity update
- ✅ Remove items
- ✅ Save for later (wishlist)
- ✅ Cart total calculation
- ✅ Checkout button

### 2. **eBay Cart**
- ✅ Watchlist (similar to favorites)
- ✅ Cart for immediate purchase
- ✅ Bid tracking
- ✅ Bundle deals

### 3. **Alibaba Cart**
- ✅ Multiple seller support
- ✅ Quantity pricing (bulk discounts)
- ✅ Cart by seller grouping
- ✅ Express checkout

### 4. **LocalMarket Features (Custom)**
- ✅ Add to Cart (one-click)
- ✅ Cart badge with count
- ✅ Cart page (list view)
- ✅ Remove items
- ✅ Persistent cart (database + localStorage)
- ✅ Quick checkout (message seller directly)
- ✅ Save for later (use existing favorites)

---

## 🗄️ Database Schema

### cart_items Table
```sql
CREATE TABLE cart_items (
  cart_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_telegram_id, listing_id) -- One item per user per listing
);
```

### Indexes
```sql
CREATE INDEX idx_cart_items_user ON cart_items(user_telegram_id, created_at DESC);
CREATE INDEX idx_cart_items_listing ON cart_items(listing_id);
```

---

## 🔧 Implementation Plan

### 1. Database Migration
- [x] Create cart_items table
- [x] Add indexes
- [x] Add RLS policies

### 2. Backend Functions (supabase.ts)
- [x] `getCart()` - Get user's cart
- [x] `addToCart()` - Add item to cart
- [x] `removeFromCart()` - Remove item
- [x] `updateCartQuantity()` - Update quantity
- [x] `clearCart()` - Clear entire cart
- [x] `getCartCount()` - Get item count

### 3. Frontend Components
- [x] `CartIcon` - Cart icon with badge (header)
- [x] `AddToCartButton` - Button component
- [x] `Cart.tsx` - Cart page
- [x] `CartItem` - Cart item component

### 4. Integration
- [x] Add CartIcon to header
- [x] Add AddToCartButton to ListingDetail
- [x] Add Cart route
- [x] Update BottomNav with Cart icon
- [x] Add cart state management

### 5. Features
- [x] Persistent cart (database)
- [x] Cart badge count
- [x] Quick checkout
- [x] Remove items
- [x] Empty cart state

---

## 🎨 UI/UX Design

### Cart Icon (Header)
- Shopping cart icon
- Badge with item count
- Click to open cart

### Add to Cart Button
- Primary button style
- "Savatchaga qo'shish" text
- Loading state
- Success feedback

### Cart Page
- List of cart items
- Item image, title, price
- Remove button
- Total price
- "Xabarlarga o'tish" button (checkout)
- Empty cart state

---

## ✅ Features Checklist

- [x] Add to cart
- [x] Remove from cart
- [x] Cart count badge
- [x] Cart page
- [x] Persistent cart
- [x] Quick checkout
- [x] Empty state
- [x] Loading states
- [x] Error handling
