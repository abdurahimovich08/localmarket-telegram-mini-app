# 🔍 COMPLETE SYSTEM ANALYSIS: Product vs Service Creation with AI Integration

**Date:** 2025-01-27  
**Project:** Telegram Mini App Marketplace (SOQQA)  
**Analyst:** AI Systems Auditor

---

## 📋 EXECUTIVE SUMMARY

The system has **TWO DISTINCT creation flows**:
1. **Product Listing Creation** (`/create`) - Manual multi-step form, NO AI
2. **Service Creation** (`/create-service`) - AI-powered chat interface

**AI is ONLY integrated with Service creation**, NOT Product creation.

---

## 1️⃣ MODULE DISCOVERY

### A) PRODUCT CREATION MODULE

#### Entry Point
- **Route:** `/create` (defined in `src/App.tsx:195`)
- **Component:** `src/pages/CreateListing.tsx`
- **Layout:** `MarketplaceLayout`

#### Main React Components
1. **`CreateListing.tsx`** (708 lines)
   - Multi-step wizard: `photos` → `category` → `subcategory` → `form`
   - State management: React `useState` hooks
   - Form validation: Client-side checks

2. **Supporting Components:**
   - `BackButton` - Navigation
   - `BottomNav` - Bottom navigation bar
   - No AI components used

#### Hooks Used
- **`useEntityMutations('listing', {...})`** from `src/hooks/useEntityMutations.ts`
  - Handles: image compression, upload, create, error handling
  - Returns: `{ create, isLoading, error }`

#### API Endpoints Called
- **Frontend → Supabase (Direct):**
  - `getSubcategories(category)` - Fetch subcategories
  - `getUserStore(telegram_user_id)` - Get user's store
  - `getStore(store_id, telegram_user_id)` - Get store details
  - `getStoreCategories(store_id)` - Get store categories
  - `createListing(data)` - Create listing (via `useEntityMutations`)

#### Database Tables Touched
- **`listings`** table:
  - Columns: `listing_id`, `seller_telegram_id`, `title`, `description`, `price`, `is_free`, `category`, `condition`, `photos[]`, `neighborhood`, `latitude`, `longitude`, `status`, `view_count`, `favorite_count`, `is_boosted`, `boosted_until`, `subcategory_id`, `store_id`, `store_category_id`, `old_price`, `stock_qty`, `order_index`, `created_at`, `updated_at`
- **`subcategories`** table (read-only for selection)
- **`store_categories`** table (read-only for store product categorization)

#### Validation Logic
**Client-side (CreateListing.tsx):**
```typescript
// Line 161-169
if (!title.trim() || !description.trim() || photos.length === 0) {
  alert('Iltimos, barcha majburiy maydonlarni to\'ldiring...')
  return
}
if (!category) {
  alert('Iltimos, kategoriyani tanlang')
  return
}
```

**Server-side (Database):**
- `title` CHECK: `LENGTH(title) <= 80`
- `description` CHECK: `LENGTH(description) <= 500`
- `category` CHECK: Must be in predefined enum
- `condition` CHECK: Must be in predefined enum
- `status` CHECK: `'active' | 'sold' | 'deleted'`
- `price` DECIMAL(10, 2) - nullable if `is_free = true`

#### Side Effects
1. **Image Processing:**
   - `compressDataUrls(photos, {}, 'listing')` - Compress images before upload
   - `uploadImages(compressedFiles)` - Upload to Cloudinary/Supabase Storage
   - Returns array of URLs

2. **Query Invalidation:**
   - `invalidateListingQueries(queryClient, listingId)` - Refresh React Query cache

3. **Navigation:**
   - `navigate('/')` on success (via `onSuccess` callback)

4. **Analytics:**
   - None explicitly tracked in creation flow

5. **Location:**
   - `requestLocation()` - Telegram WebApp location API (optional)

---

### B) SERVICE CREATION MODULE

#### Entry Point
- **Route:** `/create-service` (defined in `src/App.tsx:205`)
- **Component:** `src/pages/AIChatCreationPage.tsx`
- **Layout:** `MarketplaceLayout`

#### Main React Components
1. **`AIChatCreationPage.tsx`** (214 lines)
   - Chat interface with AI
   - State: `messages[]`, `inputValue`, `isLoading`, `chat`, `aiData`
   - Flow: Chat → AI Response → `ServiceReviewForm`

2. **`ServiceReviewForm.tsx`** (488 lines)
   - Review/edit form for AI-generated data
   - Fields: logo, portfolio, title, description, category, priceType, price, tags
   - AI tag correction feature

#### Hooks Used
- **`useUser()`** - Get current user context
- **`useNavigate()`** - Navigation
- **NO `useEntityMutations`** - Direct `createService()` call

#### API Endpoints Called
- **Frontend → Gemini API (via Vercel API route):**
  - `POST /api/gemini` - Chat with Gemini AI
  - Request body: `{ message, chatHistory }`
  - Response: Gemini API response with text

- **Frontend → Supabase (Direct):**
  - `getUserServices(telegram_user_id)` - Check existing services
  - `createService(data)` - Create service (direct call, NOT via hook)
  - `updateService(serviceId, data)` - Update service

#### Database Tables Touched
- **`services`** table:
  - Columns: `service_id`, `provider_telegram_id`, `title`, `description`, `category`, `price_type`, `price`, `tags[]`, `logo_url`, `portfolio_images[]`, `image_url` (deprecated), `status`, `view_count`, `created_at`, `updated_at`

- **`tag_usage_stats`** table (indirect):
  - `updateTagUsageStats(tags)` - Update tag analytics (non-blocking)

#### Validation Logic
**Client-side (ServiceReviewForm.tsx):**
```typescript
// Line 145-153
if (!formData.title.trim() || !formData.description.trim()) {
  setError('Iltimos, sarlavha va tavsifni to\'ldiring')
  return
}
if (!logo) {
  setError('Iltimos, logo rasmini yuklang')
  return
}
```

**Server-side (Database):**
- `title` CHECK: `LENGTH(title) <= 100`
- `description` CHECK: `LENGTH(description) <= 500`
- `price_type` CHECK: `'fixed' | 'hourly' | 'negotiable'`
- `status` CHECK: `'active' | 'inactive' | 'deleted'`
- `tags[]` - Array of strings (validated via `validateAndNormalizeTags()`)

**Tag Validation (lib/tagUtils.ts):**
- Min tags: 3
- Max tags: 7
- Format: lowercase, latin only, hyphen-separated
- Length: 2-30 characters per tag

#### Side Effects
1. **AI Chat Session:**
   - `startChatSession()` - Initialize Gemini chat with system prompt
   - `sendMessage(chat, message)` - Send user message, get AI response
   - Chat history stored in memory (per session)

2. **Image Processing:**
   - `dataUrlToFile(logo, 'logo.jpg')` - Convert data URL to File
   - `uploadImages([logoFile])` - Upload logo
   - `uploadImages(portfolioFiles)` - Upload portfolio images
   - **NOTE:** No compression step (unlike product creation)

3. **Tag Processing:**
   - `validateAndNormalizeTags(tags)` - Normalize tags before save
   - `sanitizeAITags(tags)` - Strict validation for AI output
   - `updateTagUsageStats(tags)` - Update analytics (non-blocking)

4. **Query Invalidation:**
   - **NONE** - Service creation does NOT use React Query hooks
   - Manual navigation: `navigate(\`/service/${serviceId}\`)`

5. **Analytics:**
   - Tag usage statistics updated

---

## 2️⃣ AI INTEGRATION ANALYSIS

### Where AI is Triggered
- **Entry Point:** `src/pages/AIChatCreationPage.tsx`
- **Initialization:** `useEffect` hook (line 42-51) calls `startChatSession()`

### Which Module Uses AI
- **✅ SERVICE CREATION ONLY**
- **❌ PRODUCT CREATION DOES NOT USE AI**

### AI Service Architecture

#### Files:
1. **`src/services/GeminiService.ts`** (193 lines)
   - Client-side service wrapper
   - Functions: `startChatSession()`, `sendMessage()`
   - Calls: `/api/gemini` Vercel API route

2. **`api/gemini.ts`** (61 lines)
   - Vercel serverless function
   - Proxy to Gemini API
   - Endpoint: `POST /api/gemini`
   - Model: `gemini-2.0-flash`

### AI Input Format

**User Messages:**
- Plain text (O'zbek tili)
- Chat history maintained in memory
- System prompt injected at start

**System Prompt (Dynamic):**
```typescript
// GeminiService.ts:37-79
- Base prompt: Instructions for service creation
- Tag suggestions: From `getTagSuggestionsForAI()` (analytics)
- Tag rules: Min 3, Max 7, lowercase, latin only
- Conversation flow: Ask one question at a time
```

**Request Body to `/api/gemini`:**
```json
{
  "message": "User's text message",
  "chatHistory": [
    { "role": "user", "parts": [{ "text": "system prompt" }] },
    { "role": "model", "parts": [{ "text": "AI response" }] },
    ...
  ]
}
```

### AI Output Format

**Expected JSON Response:**
```json
{
  "isFinished": true,
  "data": {
    "title": "Jalb qiluvchi sarlavha",
    "description": "Sotuvchi tavsif (emojilar bilan)",
    "category": "Kategoriya",
    "priceType": "fixed" | "hourly" | "negotiable",
    "price": "Narx (string)",
    "tags": ["tag1", "tag2", "tag3"]
  }
}
```

**Parsing Logic (GeminiService.ts:167-182):**
```typescript
// Extract JSON from text response
const jsonMatch = text.match(/\{[\s\S]*\}/)
if (jsonMatch) {
  const jsonData = JSON.parse(jsonMatch[0])
  if (jsonData.isFinished === true) {
    return { isFinished: true, data: jsonData.data }
  }
}
```

### Where AI Output is Processed

1. **Parsing:**
   - `src/services/GeminiService.ts:167-182` - Extract JSON from text
   - Fallback: If JSON not found, return text message

2. **Validation:**
   - `src/components/service/ServiceReviewForm.tsx` - User reviews/edits AI data
   - `src/lib/tagUtils.ts:validateAndNormalizeTags()` - Tag normalization
   - `src/lib/tagUtils.ts:sanitizeAITags()` - Strict tag validation

3. **Saved to Database:**
   - `src/lib/supabase.ts:createService()` - Line 909-953
   - Table: `services`
   - Columns: All fields from `ServiceData` interface

### Database Storage

**Table: `services`**
- `title` ← `data.title`
- `description` ← `data.description`
- `category` ← `data.category`
- `price_type` ← `data.priceType`
- `price` ← `data.price` (stored as TEXT, not DECIMAL)
- `tags[]` ← `data.tags` (validated array)

**Additional Processing:**
- Logo uploaded separately (not from AI)
- Portfolio images uploaded separately (not from AI)

### AI Assumptions

**Explicit Assumptions:**
1. **Entity Type:** AI ONLY knows about "services" (xizmatlar)
   - System prompt: "Foydalanuvchi bilan o'zbek tilida samimiy suhbatlashib, uning xizmatlari haqida ma'lumot olish"
   - No mention of products/listings

2. **Price Type:** AI must choose from `'fixed' | 'hourly' | 'negotiable'`
   - Products use `price: DECIMAL` or `is_free: BOOLEAN`
   - Services use `price_type: TEXT` + `price: TEXT`

3. **Tags:** AI generates tags (3-7 tags)
   - Products do NOT have tags
   - Services REQUIRE tags

4. **Category:** AI generates free-text category
   - Products use enum: `'electronics' | 'furniture' | ...`
   - Services use free-text: `category: TEXT`

5. **Condition:** AI does NOT ask about condition
   - Products have `condition: 'new' | 'like_new' | ...`
   - Services do NOT have condition field

### Is AI Reusable?

**Current State: ❌ NOT REUSABLE**
- Hard-coded for services only
- System prompt mentions "xizmatlar" (services)
- Output schema matches `ServiceData` interface
- No abstraction layer

**What Breaks if Reused for Products:**
1. System prompt assumes service context
2. Output schema doesn't match product fields:
   - Missing: `condition`, `photos[]`, `neighborhood`, `latitude`, `longitude`
   - Wrong: `priceType` (products use `price` + `is_free`)
   - Wrong: `category` format (enum vs free-text)
   - Extra: `tags[]` (products don't have tags)

---

## 3️⃣ DATA FLOW DIAGRAM (TEXT)

### A) PRODUCT CREATION FLOW

```
USER ACTION
  ↓
[CreateListing.tsx]
  ├─ Step 1: Upload Photos (data URLs)
  ├─ Step 2: Select Category
  ├─ Step 3: Select Subcategory (optional)
  └─ Step 4: Fill Form
      ├─ title, description, price, condition, neighborhood
      ├─ listingType: 'personal' | 'store'
      └─ store_category_id (if store listing)
  ↓
[handleSubmit()]
  ↓
[useEntityMutations.create()]
  ├─ 1. compressDataUrls(photos, {}, 'listing')
  ├─ 2. uploadImages(compressedFiles) → Cloudinary/Supabase
  ├─ 3. createListing(data) → Supabase
  │   └─ INSERT INTO listings (...)
  ├─ 4. invalidateListingQueries()
  └─ 5. navigate('/')
  ↓
[DATABASE: listings table]
  └─ New row created
```

**Key Points:**
- No AI involved
- Image compression before upload
- Uses React Query for cache invalidation
- Multi-step wizard UI

---

### B) SERVICE CREATION FLOW

```
USER ACTION
  ↓
[AIChatCreationPage.tsx]
  ├─ Initialize: startChatSession()
  │   └─ GET system prompt (with tag analytics)
  ├─ User sends message
  └─ sendMessage(chat, message)
      ↓
[POST /api/gemini]
  ├─ Build request: { message, chatHistory }
  └─ Call Gemini API: gemini-2.0-flash
      ↓
[Gemini Response]
  ├─ Text response OR JSON with isFinished=true
  └─ Parse JSON: extract { title, description, category, priceType, price, tags }
      ↓
[ServiceReviewForm.tsx]
  ├─ User reviews/edits AI data
  ├─ Upload logo (dataUrl → File → uploadImages)
  ├─ Upload portfolio (dataUrl → File → uploadImages)
  ├─ Fix tags (optional AI correction)
  └─ handleSubmit()
      ↓
[createService(data)]
  ├─ validateAndNormalizeTags(tags)
  ├─ INSERT INTO services (...)
  ├─ updateTagUsageStats(tags) [non-blocking]
  └─ navigate(`/service/${serviceId}`)
      ↓
[DATABASE: services table]
  └─ New row created
```

**Key Points:**
- AI chat interface
- No image compression (unlike products)
- No React Query hooks
- Tag analytics updated
- Manual navigation

---

### C) AI-POWERED FLOW (CURRENT - SERVICE ONLY)

```
USER: "Men dasturlash xizmatlarini ko'rsataman"
  ↓
[AI Chat Session]
  ├─ AI: "Salom! Qanday xizmat ko'rsatasiz?"
  ├─ USER: "Web saytlar yarataman"
  ├─ AI: "Tajribangiz qancha?"
  ├─ USER: "3 yil React bilan"
  ├─ AI: "Narx qanday?"
  └─ USER: "Soatlik 50000 so'm"
      ↓
[AI Detects: Enough Information]
  ↓
[AI Returns JSON]
{
  "isFinished": true,
  "data": {
    "title": "Professional Web Development",
    "description": "React bilan 3 yillik tajriba...",
    "category": "Web Development",
    "priceType": "hourly",
    "price": "50000 so'm",
    "tags": ["web-development", "react-js", "frontend"]
  }
}
  ↓
[ServiceReviewForm]
  ├─ Display AI data (editable)
  ├─ User uploads logo
  ├─ User uploads portfolio
  └─ User submits
      ↓
[createService()]
  └─ Save to database
```

---

### Where Flows Diverge

| Aspect | Product | Service |
|--------|---------|---------|
| **UI** | Multi-step wizard | AI chat → Review form |
| **AI** | ❌ None | ✅ Full integration |
| **Image Compression** | ✅ Yes | ❌ No |
| **React Query** | ✅ Yes | ❌ No |
| **Tags** | ❌ No | ✅ Yes (required) |
| **Category** | Enum (strict) | Free text |
| **Price** | DECIMAL + is_free | TEXT + price_type |
| **Condition** | ✅ Required | ❌ Not applicable |
| **Location** | ✅ Optional | ❌ Not applicable |
| **Subcategory** | ✅ Optional | ❌ Not applicable |

---

## 4️⃣ DEPENDENCY & COUPLING CHECK

### Tightly Coupled to "Product" Only

1. **`CreateListing.tsx`**
   - Hard-coded for `listings` table
   - Uses `useEntityMutations('listing')`
   - References: `CATEGORIES` enum, `CONDITIONS` enum
   - Subcategory selection logic

2. **`useEntityMutations` hook**
   - Supports multiple entity types, but product-specific logic:
     - Image compression preset: `'listing'` vs `'banner'`
     - Query invalidation: `invalidateListingQueries()`

3. **Database schema**
   - `listings` table has product-specific fields:
     - `condition`, `subcategory_id`, `store_id`, `store_category_id`, `old_price`, `stock_qty`

### Generic but Not Reused

1. **Image Upload Logic**
   - `uploadImages()` - Used by both, but:
     - Products: Compress first
     - Services: No compression

2. **Form Validation**
   - Both have similar validation (title, description required)
   - But implemented separately

3. **Navigation**
   - Both use `useNavigate()`, but different success routes

### Could Support Both with Small Changes

1. **`useEntityMutations` hook**
   - Already supports `'listing' | 'service' | 'store'`
   - But service creation doesn't use it (direct `createService()` call)

2. **Image Upload**
   - Could add compression option parameter
   - Currently hard-coded: products compress, services don't

3. **Validation**
   - Could extract to shared utility
   - Currently duplicated

### What Breaks if AI is Reused for Both

1. **System Prompt**
   - Currently: "xizmatlari haqida ma'lumot olish"
   - Needs: Entity type parameter

2. **Output Schema**
   - Current: `ServiceData` interface
   - Needs: Union type or adapter pattern

3. **Field Mapping**
   - Services: `priceType` + `price` (TEXT)
   - Products: `price` (DECIMAL) + `is_free` (BOOLEAN)
   - Needs: Conditional mapping

4. **Missing Fields**
   - Products need: `condition`, `photos[]`, `location`
   - AI doesn't ask for these currently

5. **Category Format**
   - Services: Free text
   - Products: Enum validation
   - Needs: Conditional validation

---

## 5️⃣ CURRENT LIMITATIONS & RISKS

### Duplicated Logic

1. **Image Upload**
   - Products: `compressDataUrls()` + `uploadImages()`
   - Services: `dataUrlToFile()` + `uploadImages()` (no compression)
   - **Risk:** Inconsistent image quality/size

2. **Form Validation**
   - Both check: `title.trim()`, `description.trim()`
   - **Risk:** Validation rules may diverge over time

3. **Error Handling**
   - Products: Via `useEntityMutations` (centralized)
   - Services: Manual try/catch
   - **Risk:** Inconsistent error messages

### Inconsistent Validation

1. **Title Length**
   - Products: `maxLength={80}` (UI) + `CHECK (LENGTH(title) <= 80)` (DB)
   - Services: `maxLength={100}` (UI) + `CHECK (LENGTH(title) <= 100)` (DB)

2. **Description Length**
   - Both: `maxLength={500}` (UI) + `CHECK (LENGTH(description) <= 500)` (DB)
   - ✅ Consistent

3. **Price Handling**
   - Products: `price: DECIMAL(10, 2)` or `is_free: BOOLEAN`
   - Services: `price: TEXT` + `price_type: TEXT`
   - **Risk:** Cannot compare prices, cannot sort by price

### Schema Mismatch

1. **Category**
   - Products: Enum (`'electronics' | 'furniture' | ...`)
   - Services: Free text
   - **Risk:** Cannot filter/search across both

2. **Price**
   - Products: Numeric (`DECIMAL`)
   - Services: Text (`TEXT`)
   - **Risk:** Cannot aggregate, sort, or filter by price

3. **Tags**
   - Products: ❌ No tags
   - Services: ✅ Required tags
   - **Risk:** Inconsistent search/discovery

### AI Assumptions Preventing Reuse

1. **Entity Type Hard-coded**
   - System prompt: "xizmatlari haqida"
   - **Fix Required:** Parameterize entity type

2. **Output Schema Fixed**
   - Returns: `ServiceData` interface
   - **Fix Required:** Union type or adapter

3. **Missing Product Fields**
   - AI doesn't ask: condition, photos, location
   - **Fix Required:** Conditional questions based on entity type

4. **Category Format**
   - AI generates free text
   - Products need enum validation
   - **Fix Required:** Conditional validation

### Future Scaling Risks

1. **Code Duplication**
   - Two separate creation flows
   - **Risk:** Bug fixes must be applied twice

2. **Inconsistent UX**
   - Products: Multi-step wizard
   - Services: AI chat
   - **Risk:** User confusion, learning curve

3. **Maintenance Burden**
   - Two codebases to maintain
   - **Risk:** Higher development cost

4. **Feature Parity**
   - Products have: subcategories, store integration, location
   - Services have: tags, AI assistance
   - **Risk:** Users expect features in both

5. **Search/Discovery**
   - Products: Category-based
   - Services: Tag-based
   - **Risk:** Cannot unify search results

---

## 6️⃣ PREPARATION FOR UNIFIED AI (NO IMPLEMENTATION YET)

### Unified Conceptual Interface for AI Input

**Proposed Interface:**
```typescript
interface AIInput {
  entityType: 'product' | 'service'
  conversationHistory: ChatMessage[]
  userMessage: string
  context?: {
    userHasStore?: boolean
    userStoreId?: string
    existingListings?: number
    existingServices?: number
  }
}
```

**Benefits:**
- Single entry point for both entity types
- Context-aware responses
- Reusable chat session logic

---

### Unified AI Output Schema

**Proposed Schema:**
```typescript
interface UnifiedAIOutput {
  entityType: 'product' | 'service'
  commonFields: {
    title: string
    description: string
    category: string // Will be validated based on entityType
  }
  productFields?: {
    condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
    price?: number
    is_free: boolean
    neighborhood?: string
    latitude?: number
    longitude?: number
  }
  serviceFields?: {
    priceType: 'fixed' | 'hourly' | 'negotiable'
    price: string
    tags: string[]
  }
}
```

**Alternative: Adapter Pattern**
```typescript
interface AIOutputAdapter {
  toProductData(): ProductCreationData
  toServiceData(): ServiceCreationData
}
```

---

### Minimal Changes Required

#### 1. System Prompt Parameterization
**Current:**
```typescript
const basePrompt = `Sen - men SOQQA ilovasining professional HR va Marketing mutaxassisisan. 
Vazifang: Foydalanuvchi bilan o'zbek tilida samimiy suhbatlashib, uning xizmatlari haqida ma'lumot olish.`
```

**Required:**
```typescript
function getSystemPrompt(entityType: 'product' | 'service'): string {
  const entityName = entityType === 'product' ? 'mahsulot' : 'xizmat'
  return `... uning ${entityName}lari haqida ma'lumot olish.`
}
```

#### 2. Conditional Questions
**Current:** AI asks same questions for all services

**Required:**
```typescript
if (entityType === 'product') {
  // Ask: condition, location, photos
} else {
  // Ask: priceType, tags
}
```

#### 3. Output Schema Adapter
**Current:** Returns `ServiceData` directly

**Required:**
```typescript
function adaptAIOutput(
  aiResponse: any,
  entityType: 'product' | 'service'
): ProductCreationData | ServiceCreationData {
  if (entityType === 'product') {
    return {
      title: aiResponse.title,
      description: aiResponse.description,
      category: validateCategoryEnum(aiResponse.category),
      condition: aiResponse.condition,
      price: aiResponse.price,
      is_free: aiResponse.is_free,
      // ...
    }
  } else {
    return {
      title: aiResponse.title,
      description: aiResponse.description,
      category: aiResponse.category, // Free text OK
      priceType: aiResponse.priceType,
      price: aiResponse.price,
      tags: aiResponse.tags,
      // ...
    }
  }
}
```

#### 4. Category Validation
**Current:** Services accept free text

**Required:**
```typescript
function validateCategory(
  category: string,
  entityType: 'product' | 'service'
): string {
  if (entityType === 'product') {
    // Validate against enum
    if (!PRODUCT_CATEGORIES.includes(category)) {
      throw new Error('Invalid category')
    }
  }
  // Services: free text OK
  return category
}
```

#### 5. Unified Chat Component
**Current:** `AIChatCreationPage` hard-coded for services

**Required:**
```typescript
<AIChatCreationPage 
  entityType="product" | "service"
  onComplete={(data) => {
    if (entityType === 'product') {
      navigate('/create', { state: { aiData: data } })
    } else {
      navigate('/create-service', { state: { aiData: data } })
    }
  }}
/>
```

---

## 7️⃣ FINAL SUMMARY

### How the System Currently Works

**Product Creation:**
1. User navigates to `/create`
2. Multi-step wizard: photos → category → subcategory → form
3. User fills form manually (no AI)
4. Images compressed and uploaded
5. `createListing()` saves to `listings` table
6. React Query cache invalidated
7. Navigate to home

**Service Creation:**
1. User navigates to `/create-service`
2. AI chat interface initialized
3. User converses with AI (O'zbek tili)
4. AI extracts service info and returns JSON
5. User reviews/edits in `ServiceReviewForm`
6. Logo and portfolio uploaded (no compression)
7. `createService()` saves to `services` table
8. Tag analytics updated
9. Navigate to service detail page

**Key Differences:**
- Products: Manual form, no AI, compressed images, React Query
- Services: AI chat, no compression, no React Query, tags required

---

### Checklist: Before Implementing Unified AI

#### ✅ Prerequisites

- [ ] **1. System Prompt Refactoring**
  - Parameterize entity type
  - Conditional questions based on entity type
  - Update output format expectations

- [ ] **2. Output Schema Unification**
  - Create `UnifiedAIOutput` interface
  - Implement adapter pattern: `toProductData()` / `toServiceData()`
  - Handle missing fields gracefully

- [ ] **3. Category Validation**
  - Products: Enum validation
  - Services: Free text (current)
  - Conditional validation logic

- [ ] **4. Image Handling Unification**
  - Decide: Compress for both? Or conditional?
  - Unify upload logic
  - Consistent error handling

- [ ] **5. Form Integration**
  - Products: Pre-fill form from AI data
  - Services: Keep review form (current)
  - Handle missing fields (e.g., photos for products)

- [ ] **6. Error Handling**
  - Unified error messages
  - Consistent validation feedback
  - AI parsing error recovery

- [ ] **7. Testing**
  - Test AI with product context
  - Test AI with service context
  - Test adapter conversion
  - Test validation edge cases

---

### Confidence Assessment

**Effort Level: MEDIUM-HIGH**

**Reasons:**
1. **System Prompt Changes:** Medium effort
   - Need to parameterize and add conditional logic
   - Risk: AI may get confused with mixed contexts

2. **Output Schema:** Medium effort
   - Adapter pattern is straightforward
   - Risk: Field mapping edge cases

3. **Category Validation:** Low effort
   - Simple conditional logic
   - Risk: None

4. **Image Handling:** Low effort
   - Already have compression logic
   - Risk: None

5. **Form Integration:** Medium effort
   - Products need pre-fill logic
   - Risk: Missing fields (photos, location)

6. **Testing:** High effort
   - Need comprehensive test cases
   - Risk: AI behavior unpredictable

**Estimated Timeline:**
- **Low Estimate:** 2-3 days (if everything goes smoothly)
- **Realistic Estimate:** 5-7 days (accounting for edge cases and testing)
- **High Estimate:** 10-14 days (if major refactoring needed)

**Blockers:**
- None identified (all changes are feasible)

**Recommendations:**
1. Start with service AI (already working)
2. Add product support incrementally
3. Test thoroughly with both entity types
4. Monitor AI responses for quality
5. Consider A/B testing for UX

---

## 📊 APPENDIX: Code References

### Key Files

**Product Creation:**
- `src/pages/CreateListing.tsx` (708 lines)
- `src/hooks/useEntityMutations.ts` (308 lines)
- `src/lib/supabase.ts:252-302` (createListing)

**Service Creation:**
- `src/pages/AIChatCreationPage.tsx` (214 lines)
- `src/components/service/ServiceReviewForm.tsx` (488 lines)
- `src/services/GeminiService.ts` (193 lines)
- `api/gemini.ts` (61 lines)
- `src/lib/supabase.ts:909-953` (createService)

**Database:**
- `database/schema_final.sql:47-68` (listings table)
- `database/SUPABASE_SERVICES_SETUP.sql:14-30` (services table)

**Types:**
- `src/types/index.ts:50-83` (Listing interface)
- `src/types/index.ts:202-220` (Service interface)

---

**END OF ANALYSIS**
