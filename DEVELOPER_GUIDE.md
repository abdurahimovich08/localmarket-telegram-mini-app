# 🗺️ LocalMarket Telegram Mini App - To'liq Dasturchi Qo'llanmasi

## 📋 Mundarija

1. [Umumiy Arxitektura](#umumiy-arxitektura)
2. [Ildiz Tizimi (Root System)](#ildiz-tizimi-root-system)
3. [Routing Xaritasi](#routing-xaritasi)
4. [Technologies va Dependencies](#technologies-va-dependencies)
5. [File Structure](#file-structure)
6. [State Management](#state-management)
7. [Database Schema](#database-schema)
8. [API va Backend](#api-va-backend)
9. [Bot Integratsiyasi](#bot-integratsiyasi)
10. [Key Features](#key-features)

---

## 🏗️ Umumiy Arxitektura

### Asosiy Komponentlar

```
┌─────────────────────────────────────────────────────────┐
│                    TELEGRAM BOT                          │
│  (api/telegram-bot.ts - Vercel Serverless Function)    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Deep Links / Referral
                     │
┌────────────────────▼────────────────────────────────────┐
│              TELEGRAM MINI APP (Frontend)                │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   React App  │  │   Contexts   │  │   Routing    │ │
│  │   (App.tsx)  │  │  (State Mgmt)│  │  (Routes)   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │          │
│  ┌──────▼──────────────────▼──────────────────▼──────┐ │
│  │              Supabase Client (lib/supabase.ts)     │ │
│  └──────────────────────┬─────────────────────────────┘ │
└──────────────────────────┼───────────────────────────────┘
                           │
                           │ REST API / Realtime
                           │
┌──────────────────────────▼───────────────────────────────┐
│              SUPABASE (Backend)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │   Storage    │  │   Realtime   │  │
│  │   Database   │  │   (Images)   │  │  (Webhooks)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### App Mode Tizimi

App 3 ta asosiy mode'da ishlaydi:

1. **Marketplace Mode** (default)
   - Global bozor ko'rinishi
   - Barcha e'lonlar va do'konlar ko'rinadi
   - Bottom navigation mavjud

2. **Store Mode** (branded)
   - Faqat bitta do'konning mahsulotlari
   - Do'kon branding'i
   - Referral link orqali kiriladi

3. **Service Mode** (branded)
   - Faqat bitta xizmat ko'rinishi
   - Xizmat branding'i
   - Referral link orqali kiriladi

---

## 🌳 Ildiz Tizimi (Root System)

### 1. Entry Point: `src/main.tsx`

**Vazifasi:** React app'ni DOM'ga mount qilish

```typescript
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Import qiladi:**
- `App.tsx` - Asosiy app komponenti
- `index.css` - Global styles
- `neumorphic.css` - Neumorphic design styles

---

### 2. Root Component: `src/App.tsx`

**Vazifasi:** 
- Telegram WebApp'ni initialize qilish
- User'ni database'dan yuklash yoki yaratish
- Context Provider'larni wrap qilish
- Routing'ni sozlash

**Ildiz Oqimi:**

```
App.tsx
  ├─> Telegram WebApp Init (lib/telegram.ts)
  ├─> User Authentication (lib/supabase.ts)
  ├─> UserContext.Provider (contexts/UserContext.tsx)
  ├─> BrowserRouter (react-router-dom)
  └─> AppModeProvider (contexts/AppModeContext.tsx)
      └─> AppRoutes (Routing logic)
          ├─> MarketplaceLayout (default)
          └─> BrandedLayout (store/service mode)
```

**Asosiy Funksiyalar:**

1. **initializeApp()**
   - Telegram WebApp SDK'ni initialize qiladi
   - Telegram user ma'lumotlarini oladi
   - Database'dan user'ni qidiradi yoki yaratadi
   - Referral store'ni tekshiradi

2. **Layout Selection**
   - `AppModeContext` dan mode o'qiladi
   - Route va mode'ga qarab layout tanlanadi
   - Marketplace yoki Branded layout ishlatiladi

---

### 3. Context System

#### UserContext (`src/contexts/UserContext.tsx`)

**Vazifasi:** Global user state'ni boshqarish

```typescript
interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
}
```

**Qayerda ishlatiladi:**
- Barcha sahifalarda user ma'lumotlariga kirish uchun
- `useUser()` hook orqali

**Ildiz Ma'lumotlari:**
- `App.tsx` da initialize qilinadi
- Telegram user ID asosida database'dan yuklanadi

---

#### AppModeContext (`src/contexts/AppModeContext.tsx`)

**Vazifasi:** App mode'ni boshqarish (marketplace/store/service)

```typescript
type AppMode =
  | { kind: 'marketplace' }
  | { kind: 'store'; storeId: string }
  | { kind: 'service'; serviceId: string }
```

**Qayerda ishlatiladi:**
- URL parametrlarini parse qiladi (`?ctx=store:ID`)
- Layout tanlashda
- Data filtering'da (faqat store mahsulotlari)

**Ildiz Oqimi:**

```
URL (?ctx=store:ID)
  └─> AppModeContext
      └─> setAppMode({ kind: 'store', storeId: 'ID' })
          └─> BrandedLayout render qilinadi
              └─> Home.tsx faqat store mahsulotlarini ko'rsatadi
```

---

## 🗺️ Routing Xaritasi

### Route Structure

```
/ (Home)
  ├─> Marketplace Mode: Barcha e'lonlar
  └─> Store/Service Mode: Faqat o'sha do'kon/xizmat

/listing/:id (Listing Detail)
  └─> E'lon tafsilotlari, rasm, narx, seller info

/create (Create Listing)
  ├─> ?store_id=ID - Store context'da ochiladi
  └─> Store kategoriyalari yuklanadi

/my-listings (My Listings)
  └─> User'ning barcha e'lonlari

/profile/:id? (Profile)
  ├─> id yo'q: O'z profilim
  └─> id bor: Boshqa user profil

/favorites (Favorites)
  └─> Saqlangan e'lonlar

/search (Search)
  └─> Qidiruv va filterlar

/cart (Cart)
  └─> Savat (store mode'da ham ishlaydi)

/create-store (Create Store)
  └─> Do'kon yaratish

/store/:id (Store Detail)
  └─> Do'kon sahifasi (mijozlar uchun)

/store/:id/manage (Store Management)
  └─> Do'kon boshqaruvi (egasi uchun)
      ├─> Kategoriyalar
      ├─> Mahsulotlar
      ├─> Postlar
      └─> Sozlamalar

/store/:id/edit (Edit Store)
  └─> Do'kon tahrirlash

/create-service (Create Service)
  └─> Xizmat yaratish (AI yordamida)

/service/:id (Service Detail)
  └─> Xizmat sahifasi

/service/:id/edit (Edit Service)
  └─> Xizmat tahrirlash

/dashboard (Dashboard)
  └─> Analytics va statistika
      ├─> /dashboard/rank
      ├─> /dashboard/recommendations
      ├─> /dashboard/benchmark
      └─> /dashboard/services/:id
```

### Layout Selection Logic

```typescript
// App.tsx - AppRoutes component

const useBrandedLayout = mode.kind === 'store' || mode.kind === 'service'

// Always marketplace layout:
- /create, /my-listings, /profile, /favorites, /search
- /create-store, /store/:id/edit, /create-service
- /service/:id/edit, /dashboard

// Conditional layout:
- / (Home) - BrandedLayout if store/service mode
- /cart - BrandedLayout if store/service mode
- /store/:id - Always MarketplaceLayout
- /listing/:id - LayoutWrapper (conditional)
```

---

## 🛠️ Technologies va Dependencies

### Core Technologies

1. **React 18.2.0**
   - UI framework
   - Hooks, Context API

2. **TypeScript 5.6.3**
   - Type safety
   - Interface definitions

3. **Vite 5.4.11**
   - Build tool
   - Dev server
   - HMR (Hot Module Replacement)

4. **React Router DOM 6.20.0**
   - Client-side routing
   - URL management

5. **Tailwind CSS 3.4.1**
   - Utility-first CSS
   - Responsive design

### Key Libraries

1. **@supabase/supabase-js 2.38.4**
   - Database client
   - Authentication
   - Storage
   - Realtime subscriptions

2. **@twa-dev/sdk 8.0.2**
   - Telegram WebApp SDK
   - User data
   - WebApp methods

3. **@google/generative-ai 0.24.1**
   - Gemini AI integration
   - Intent detection
   - Chat functionality

4. **@heroicons/react 2.1.1**
   - Icon library
   - Outline va Solid variants

5. **react-cropper 2.3.3**
   - Image cropping
   - Listing photos

6. **node-telegram-bot-api 0.66.0**
   - Telegram Bot API
   - Webhook handling
   - Message sending

---

## 📁 File Structure

### Asosiy Kataloglar

```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Root component, routing
├── index.css                # Global styles
│
├── pages/                   # Sahifalar (Routes)
│   ├── Home.tsx            # Bosh sahifa
│   ├── ListingDetail.tsx   # E'lon tafsilotlari
│   ├── CreateListing.tsx   # E'lon yaratish
│   ├── MyListings.tsx      # Mening e'lonlarim
│   ├── Profile.tsx         # Profil sahifasi
│   ├── Favorites.tsx      # Saqlanganlar
│   ├── Search.tsx          # Qidiruv
│   ├── Cart.tsx            # Savat
│   ├── CreateStore.tsx     # Do'kon yaratish
│   ├── EditStore.tsx       # Do'kon tahrirlash
│   ├── StoreDetail.tsx     # Do'kon sahifasi
│   ├── StoreManagement.tsx # Do'kon boshqaruvi
│   ├── AIChatCreationPage.tsx # Xizmat yaratish (AI)
│   ├── ServiceDetailsPage.tsx  # Xizmat sahifasi
│   ├── ServiceEdit.tsx     # Xizmat tahrirlash
│   └── Dashboard*.tsx      # Analytics sahifalari
│
├── components/              # Qayta ishlatiladigan komponentlar
│   ├── MarketplaceLayout.tsx  # Marketplace layout
│   ├── BrandedLayout.tsx      # Store/Service layout
│   ├── BottomNav.tsx           # Pastki navigatsiya
│   ├── ListingCard.tsx         # E'lon kartasi
│   ├── ListingCardEbay.tsx    # eBay-style kartasi
│   ├── StoreProductCard.tsx   # Do'kon mahsulot kartasi
│   ├── PersonalLinks.tsx      # Profil linklar
│   ├── Onboarding.tsx         # Onboarding flow
│   └── ... (boshqa komponentlar)
│
├── contexts/                # React Contexts
│   ├── UserContext.tsx      # User state
│   └── AppModeContext.tsx   # App mode state
│
├── lib/                     # Utility funksiyalar
│   ├── supabase.ts         # Supabase client, CRUD operations
│   ├── telegram.ts         # Telegram WebApp utilities
│   ├── imageUpload.ts      # Rasm yuklash
│   ├── searchAlgorithms.ts # Qidiruv algoritmlari
│   ├── analytics.ts        # Analytics funksiyalari
│   ├── recommendations.ts  # Tavsiyalar
│   └── ... (boshqa utilities)
│
├── types/                   # TypeScript types
│   ├── index.ts            # Asosiy types
│   └── unified.ts          # Unified listing types
│
└── styles/                  # CSS fayllar
    └── neumorphic.css      # Neumorphic design styles
```

### API Endpoints (Vercel Serverless Functions)

```
api/
├── telegram-bot.ts         # Bot webhook handler
├── set-webhook.ts          # Webhook sozlash
├── gemini-chat.ts          # Gemini AI chat
├── user-context.ts         # User context API
└── track-referral.ts       # Referral tracking
```

---

## 🔄 State Management

### Context-Based State

App'da 2 ta asosiy Context bor:

1. **UserContext**
   - Global user state
   - Barcha sahifalarda mavjud
   - `useUser()` hook orqali ishlatiladi

2. **AppModeContext**
   - App mode state (marketplace/store/service)
   - URL parametrlaridan o'qiladi
   - `useAppMode()` hook orqali ishlatiladi

### Local State

Har bir komponent o'z local state'ini `useState` hook bilan boshqaradi.

### Data Fetching

- Supabase client orqali to'g'ridan-to'g'ri
- `lib/supabase.ts` da CRUD funksiyalari
- Realtime subscriptions (ixtiyoriy)

---

## 🗄️ Database Schema

### Asosiy Jadvalar

1. **users**
   - Foydalanuvchi ma'lumotlari
   - Telegram user ID primary key

2. **listings**
   - E'lonlar
   - Store mahsulotlari ham shu jadvalda
   - `store_id`, `store_category_id` (ixtiyoriy)

3. **stores**
   - Do'konlar
   - `owner_telegram_id` unique

4. **store_categories**
   - Do'kon kategoriyalari
   - `store_id` ga bog'liq

5. **store_posts**
   - Do'kon postlari
   - `is_pinned`, `order_index`

6. **services**
   - Xizmatlar
   - `provider_telegram_id`

7. **favorites**
   - Saqlangan e'lonlar

8. **cart_items**
   - Savat elementlari

9. **reviews**
   - Sharhlar va reytinglar

10. **transactions**
    - Tranzaksiyalar

### Relationships

```
users (1) ──< (many) listings
users (1) ──< (1) stores
stores (1) ──< (many) store_categories
stores (1) ──< (many) store_posts
listings (many) ──> (1) store_categories (ixtiyoriy)
users (1) ──< (many) services
```

---

## 🔌 API va Backend

### Supabase Client (`lib/supabase.ts`)

**Vazifasi:** Barcha database operatsiyalari

**Asosiy Funksiyalar:**

1. **User Operations**
   - `getUser(telegramUserId)`
   - `createOrUpdateUser(userData)`

2. **Listing Operations**
   - `getListings(filters?)`
   - `getListing(listingId)`
   - `createListing(listing)`
   - `updateListing(listingId, updates)`
   - `deleteListing(listingId)`

3. **Store Operations**
   - `getStore(storeId, userTelegramId?)`
   - `createStore(store)`
   - `getStoreCategories(storeId)`
   - `createStoreCategory(category)`
   - `getStoreProducts(storeId, categoryId?)`
   - `getStorePosts(storeId)`

4. **Service Operations**
   - `getService(serviceId)`
   - `createService(service)`
   - `updateService(serviceId, updates)`

5. **Search Operations**
   - `getListings()` with search filters
   - Fuzzy search support

### Vercel Serverless Functions

1. **api/telegram-bot.ts**
   - Bot webhook handler
   - `/start` command
   - Deep link parsing
   - AI conversation

2. **api/gemini-chat.ts**
   - Gemini AI integration
   - Intent detection
   - Chat responses

3. **api/user-context.ts**
   - User context for AI
   - Store/services/listings info

4. **api/track-referral.ts**
   - Referral tracking
   - Store association

---

## 🤖 Bot Integratsiyasi

### Bot Flow

```
User sends /start to bot
  └─> api/telegram-bot.ts (webhook)
      ├─> Parse deep link (store_<ID>, service_<ID>, referral code)
      ├─> Track referral (if applicable)
      ├─> Get user context (stores, services)
      ├─> Call Gemini AI (if no deep link)
      └─> Send message with Mini App button
          └─> User clicks button
              └─> Mini App opens with ?ctx=store:<ID>
                  └─> AppModeContext parses ctx
                      └─> BrandedLayout renders
```

### Deep Link Format

```
https://t.me/BOT_USERNAME?start=store_<STORE_ID>
https://t.me/BOT_USERNAME?start=service_<SERVICE_ID>
https://t.me/BOT_USERNAME?start=<REFERRAL_CODE>
```

### Mini App URL Format

```
https://app-url/?ctx=store:<STORE_ID>
https://app-url/?ctx=service:<SERVICE_ID>
```

---

## ⭐ Key Features

### 1. Mode-Based System

**Qanday ishlaydi:**
- URL parametr `?ctx=store:ID` parse qilinadi
- `AppModeContext` mode'ni o'zgartiradi
- Layout va data filtering o'zgaradi

**Qayerda:**
- `src/contexts/AppModeContext.tsx`
- `src/App.tsx` (LayoutWrapper)
- `src/pages/Home.tsx` (filtering)

---

### 2. Store Management System

**Qanday ishlaydi:**
- Do'kon egasi kategoriyalar yaratadi
- Mahsulotlar kategoriyalarga tayinlanadi
- Postlar yaratiladi va pin qilinadi
- Real-time stock management

**Qayerda:**
- `src/pages/StoreManagement.tsx`
- `database/store_management_migration.sql`
- `src/lib/supabase.ts` (store functions)

---

### 3. Referral Tracking

**Qanday ishlaydi:**
- Har bir do'kon uchun unique referral code
- User referral orqali kirsa, database'da saqlanadi
- Store mode avtomatik o'rnatilishi mumkin

**Qayerda:**
- `database/referral_tracking_migration.sql`
- `api/track-referral.ts`
- `src/lib/supabase.ts` (getUserReferralStore)

---

### 4. AI Integration (Gemini)

**Qanday ishlaydi:**
- User bot'ga xabar yuboradi
- AI user intent'ni aniqlaydi
- Kerakli sahifaga yo'naltiradi

**Qayerda:**
- `api/gemini-chat.ts`
- `api/user-context.ts`
- `api/telegram-bot.ts`

---

### 5. Search va Personalization

**Qanday ishlaydi:**
- Fuzzy search algoritmlari
- User preferences tracking
- Category-based recommendations

**Qayerda:**
- `src/lib/searchAlgorithms.ts`
- `src/lib/searchPersonalization.ts`
- `src/lib/recommendations.ts`

---

### 6. Image Upload

**Qanday ishlaydi:**
- Cropper.js orqali rasm kesish
- Supabase Storage'ga yuklash
- Multiple images support

**Qayerda:**
- `src/lib/imageUpload.ts`
- `src/components/BannerCropper.tsx`
- `src/components/LogoUploader.tsx`

---

## 🔍 Qidiruv va Filtering

### Search Flow

```
User enters search query
  └─> Search.tsx
      └─> lib/searchAlgorithms.ts
          ├─> Build search variations
          ├─> Score listings by relevance
          └─> Return sorted results
```

### Filtering

- Category filter
- Price range
- Location (radius)
- Condition
- Store category (store mode'da)

---

## 📊 Analytics va Dashboard

### Dashboard Features

1. **Stats**
   - Views, clicks, favorites
   - Conversion rates

2. **Ranking**
   - Category-based ranking
   - Competitor analysis

3. **Recommendations**
   - AI-powered suggestions
   - Health score

4. **Benchmark**
   - Industry averages
   - Performance comparison

**Qayerda:**
- `src/pages/Dashboard*.tsx`
- `src/lib/dashboardAnalytics.ts`
- `src/lib/dashboardRanking.ts`

---

## 🎨 Design System

### Layouts

1. **MarketplaceLayout**
   - Bottom navigation
   - Global search
   - Standard header

2. **BrandedLayout**
   - Store/service branding
   - Custom navigation
   - No global marketplace access

### Styles

- **Tailwind CSS** - Utility classes
- **Neumorphic Design** - Store pages uchun
- **Apple-style Minimalism** - Profile pages

---

## 🔐 Authentication

### Telegram Native Auth

- Telegram WebApp SDK orqali
- `initData` orqali user ma'lumotlari
- Database'da user yaratish/yangilash

**Flow:**
```
Telegram WebApp opens
  └─> lib/telegram.ts (initTelegram)
      └─> Get user from initDataUnsafe
          └─> App.tsx (initializeApp)
              └─> lib/supabase.ts (getUser/createOrUpdateUser)
```

---

## 📦 Build va Deploy

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Deploy

- **Frontend:** Vercel
- **Backend:** Vercel Serverless Functions
- **Database:** Supabase
- **Storage:** Supabase Storage

---

## 🐛 Debugging

### Console Logs

- Barcha muhim operatsiyalar log qilinadi
- `console.log`, `console.error`

### Vercel Logs

- Serverless function logs
- Vercel Dashboard > Functions > Logs

### Supabase Logs

- Database queries
- RLS policy violations

---

## 📚 Qo'shimcha Ma'lumot

### Migration Files

- `database/schema_final.sql` - Asosiy schema
- `database/store_management_migration.sql` - Store management
- `database/referral_tracking_migration.sql` - Referral system

### Documentation Files

- `README.md` - Project overview
- `SETUP.md` - Setup guide
- `WEBHOOK_SETUP_VERCEL.md` - Webhook setup
- `REFERRAL_TRACKING_GUIDE.md` - Referral system
- `GEMINI_API_KEY_FIX.md` - AI setup

---

## 🎯 Xulosa

Bu guide app'ning to'liq xaritasini beradi. Har bir qism qayerda joylashgan va qanday ishlashini tushuntiradi. Qo'shimcha savollar bo'lsa, kod ichidagi commentlar va bu guide'ga qarang.

**Muhim:** 
- Barcha o'zgarishlar git'da saqlanadi
- Database migration'lar Supabase'da ishga tushirilishi kerak
- Environment variables Vercel'da sozlanishi kerak
