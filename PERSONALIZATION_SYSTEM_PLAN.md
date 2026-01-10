# 🎯 Personalization va Recommendation Tizimi - Reja

## 🎯 Maqsad
Foydalanuvchining qidiruv tarixi, ko'rishlar va interaksiyalar asosida shaxsiylashtirilgan tavsiyalar berish.

---

## 📚 Marketplace Personalization O'rganish

### 1. **Amazon Personalization**
- ✅ Browsing history asosida "Recommended for You"
- ✅ Search history asosida related products
- ✅ View-based recommendations ("Customers who viewed this also viewed")
- ✅ Purchase history patterns
- ✅ Collaborative filtering

### 2. **eBay Recommendations**
- ✅ Recently viewed items
- ✅ Similar items (category + keywords)
- ✅ Seller-based recommendations
- ✅ Price-based suggestions

### 3. **Alibaba Personalization**
- ✅ Search-based recommendations
- ✅ Category preferences
- ✅ View history patterns
- ✅ Behavioral tracking

### 4. **LocalMarket Features (Custom)**
- ✅ Search history-based personalization
- ✅ View history recommendations
- ✅ Similar listings (category + keywords + location)
- ✅ Seller analytics (view count, favorite count)
- ✅ Real-time recommendations

---

## 🔧 Implementation Plan

### 1. **Personalization Algorithms**

#### A. Search-Based Personalization
**Maqsad:** Qidiruv tarixi asosida tavsiyalar

**Algoritm:**
1. Foydalanuvchining so'nggi 10 qidiruvini olish
2. Har bir qidiruvdan keyword'lar extract qilish
3. Bu keyword'larni listing'larda match qilish
4. Relevance score hisoblash:
   - Recent searches (yuqori weight)
   - Search frequency (ko'p qidirilgan = yuqori score)
   - Category match

**Kod:** `src/lib/recommendations.ts` → `getSearchBasedRecommendations()`

#### B. View-Based Recommendations
**Maqsad:** Ko'rgan listing'larga o'xshash mahsulotlar

**Algoritm:**
1. Foydalanuvchining so'nggi 20 ko'rishini olish
2. Har bir listing uchun similarity hisoblash:
   - Category match (30%)
   - Keyword overlap (40%)
   - Price range (20%)
   - Location proximity (10%)
3. Top 10 similar listing'larni qaytarish

**Kod:** `src/lib/recommendations.ts` → `getSimilarListings()`

#### C. Interaction-Based Recommendations
**Maqsad:** Favorite, cart, message kabi interaksiyalar asosida

**Algoritm:**
1. Foydalanuvchining favorite/cart listing'larini olish
2. Bu listing'larning category va keyword pattern'larini extract qilish
3. Shunga o'xshash active listing'larni topish

**Kod:** `src/lib/recommendations.ts` → `getInteractionBasedRecommendations()`

---

### 2. **Home Page Personalization**

**Joriy holat:** 
- `getPersonalizedListings()` allaqachon bor
- User preferences asosida ishlaydi

**Yaxshilash:**
1. Search history qo'shish (50% weight)
2. View history qo'shish (30% weight)
3. Interaction history qo'shish (20% weight)

**Kod:** `src/lib/recommendations.ts` → `getPersonalizedListingsV2()`

---

### 3. **Similar Listings (ListingDetail Page)**

**Maqsad:** Listing sahifasi osti "O'xshash e'lonlar"

**Algoritm:**
1. Current listing'dan keywords extract qilish
2. Same category'dagi listing'larni olish
3. Keyword similarity hisoblash
4. Price range (similar ±30%)
5. Location proximity (optional)
6. Top 6 similar listing'larni ko'rsatish

**Kod:** `src/components/SimilarListings.tsx`

---

### 4. **Seller Analytics**

**Maqsad:** Seller o'z listing'larini kuzatishi

**Features:**
1. View count (necha marta ko'rildi)
2. Favorite count (necha marta saqlandi)
3. Search impressions (qidiruv natijalarida necha marta ko'rinish)
4. Engagement rate (view/favorite ratio)
5. Trend analytics (oxirgi 7/30 kun)

**Kod:** `src/pages/ListingAnalytics.tsx`

---

## 🗄️ Database Schema

### Existing Tables (Use as-is):
- ✅ `user_searches` - Qidiruv tarixi
- ✅ `user_listing_interactions` - Ko'rish va interaksiyalar
- ✅ `user_category_preferences` - Kategoriya preferences

### New Functions Needed:

#### 1. `get_user_search_keywords(user_id)`
```sql
-- Extract unique keywords from user's recent searches
SELECT DISTINCT search_query, COUNT(*) as frequency
FROM user_searches
WHERE user_telegram_id = $1
AND created_at > NOW() - INTERVAL '30 days'
GROUP BY search_query
ORDER BY frequency DESC, created_at DESC
LIMIT 20;
```

#### 2. `get_recommended_listings(user_id, limit)`
```sql
-- Complex recommendation query combining:
-- - Search history keywords
-- - View history patterns
-- - Category preferences
-- - Location proximity
```

#### 3. `get_similar_listings(listing_id, limit)`
```sql
-- Find similar listings based on:
-- - Category match
-- - Title/description keyword overlap
-- - Price range (±30%)
-- - Location (optional)
```

#### 4. `get_listing_analytics(listing_id)`
```sql
-- Get analytics for a listing:
-- - Total views
-- - Unique viewers
-- - Favorite count
-- - Search impressions
-- - Views by day (last 30 days)
```

---

## 📊 Recommendation Scoring

### Score Formula:
```
Total Score = 
  (Search Relevance * 0.5) +
  (View Pattern Match * 0.3) +
  (Interaction Match * 0.2)
```

### Search Relevance:
- Keyword match in title: +50
- Keyword match in description: +20
- Category match: +30
- Recent search (last 7 days): +20 bonus

### View Pattern Match:
- Same category: +30
- Similar price range: +20
- Keyword overlap: +40
- Location proximity: +10

### Interaction Match:
- Favorite same category: +30
- Cart same category: +40
- Message same seller: +20

---

## 🎨 UI/UX Implementation

### 1. Home Page
- "Siz uchun" tab - fully personalized
- Show why recommended (small badge: "Siz kamaz qidirdingiz")
- Recent searches quick access

### 2. ListingDetail Page
- "O'xshash e'lonlar" section at bottom
- Grid of 6 similar listings
- "Nima uchun tavsiya qilinmoqda?" tooltip

### 3. Seller Dashboard
- Analytics card in MyListings page
- View count, favorite count
- Trend chart (optional)
- Export data (optional)

---

## ✅ Implementation Steps

1. ✅ Reja yaratish (bu fayl)
2. 🔄 Recommendation algorithms library
3. 🔄 Database functions
4. 🔄 Home page personalization update
5. 🔄 Similar listings component
6. 🔄 Seller analytics
7. 🔄 Testing va optimization

---

## 📝 Keyingi Qadamlar

1. **Recommendation Engine** yaratish
2. **Home Page** yangilash
3. **Similar Listings** komponenti
4. **Seller Analytics** dashboard
5. **Testing** va tuning
