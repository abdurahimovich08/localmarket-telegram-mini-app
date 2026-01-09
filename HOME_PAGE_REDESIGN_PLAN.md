# 🏠 Bosh Sahifa Qayta Qurish Rejasi

## 📊 Muammolar Tahlili

### 1. **Kategoriya Validatsiyasi Muammosi**
- ❌ Foydalanuvchi "kamaz"ni "clothing" kategoriyasiga qo'yishi mumkin
- ❌ Kategoriya va e'lon mazmuni mos kelmaydi
- ✅ **Yechim**: AI-based kategoriya tekshiruvi yoki keyword matching

### 2. **Tartiblash Algoritmi Muammosi**
- ❌ Faqat `is_boosted` va `created_at` ga qarab tartiblash
- ❌ Relevance score yo'q
- ❌ Popularity (views, favorites) hisobga olinmaydi
- ✅ **Yechim**: Kompleks scoring algoritmi

### 3. **Personalizatsiya Muammosi**
- ❌ Foydalanuvchi qidirgan narsalarga asoslangan tavsiyalar yo'q
- ❌ Foydalanuvchi behavior tracking yo'q
- ✅ **Yechim**: User behavior tracking va recommendation engine

### 4. **Dizayn Muammosi**
- ❌ Oddiy grid ko'rinish
- ❌ Kategoriyalar ko'rinmaydi
- ❌ "Siz uchun" va "Kun narxlari" yo'q
- ✅ **Yechim**: Modern bosh sahifa dizayni

---

## 🗺️ Yul Xaritasi (Roadmap)

### **Bosqich 1: Database & Tracking Infrastructure** ✅
- [x] User behavior tracking jadvali (user_searches, user_views, user_interactions)
- [ ] Database migration SQL yaratish
- [ ] Tracking functions yaratish

### **Bosqich 2: Kategoriya Validatsiyasi** 🔧
- [ ] Kategoriya keyword matching algoritmi
- [ ] Category validation function
- [ ] Auto-categorization (AI-based yoki rule-based)

### **Bosqich 3: Advanced Sorting Algorithm** 🎯
- [ ] Relevance scoring system
- [ ] Popularity scoring (views + favorites)
- [ ] Distance + relevance hybrid sorting
- [ ] Boosted listings priority

### **Bosqich 4: Personalization Engine** 🧠
- [ ] User search history tracking
- [ ] Viewed listings tracking
- [ ] Recommendation algorithm (content-based)
- [ ] "Siz uchun" section

### **Bosqich 5: Bosh Sahifa Dizayni** 🎨
- [ ] Search bar header
- [ ] Category carousel
- [ ] "Siz uchun" va "Kun narxlari" tabs
- [ ] Modern grid layout
- [ ] Filter buttons

### **Bosqich 6: Testing & Optimization** ✅
- [ ] Algorithm testing
- [ ] Performance optimization
- [ ] UX improvements

---

## 📋 Batafsil Reja

### **Bosqich 1: Database Schema Updates**

**Yangi jadvallar:**
```sql
-- User search history
CREATE TABLE user_searches (
  search_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL,
  search_query TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User views/interactions
CREATE TABLE user_listing_interactions (
  interaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL,
  listing_id UUID NOT NULL,
  interaction_type TEXT CHECK (interaction_type IN ('view', 'click', 'favorite', 'search_match')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_searches_user ON user_searches(user_telegram_id, created_at DESC);
CREATE INDEX idx_interactions_user ON user_listing_interactions(user_telegram_id, created_at DESC);
CREATE INDEX idx_interactions_listing ON user_listing_interactions(listing_id);
```

---

### **Bosqich 2: Kategoriya Validatsiyasi**

**Keyword Mapping:**
```typescript
const CATEGORY_KEYWORDS = {
  electronics: ['telefon', 'kompyuter', 'noutbuk', 'planshet', 'naushnik', 'telefon', 'smartfon'],
  clothing: ['kiyim', 'ko\'ylak', 'shim', 'futbolka', 'palto', 'kurtka', 'oyoq kiyim', 'tufli', 'botinka'],
  furniture: ['stul', 'divan', 'stol', 'yotoq', 'shkaf', 'komod', 'o\'rindiq'],
  // ... boshqalar
}
```

**Validation Logic:**
- E'lon yaratilganda, title va description'dan kategoriyani tekshirish
- Agar mos kelmasa, warning yoki auto-correction

---

### **Bosqich 3: Advanced Sorting Algorithm**

**Scoring Formula:**
```typescript
score = (
  boosted_bonus * 1000 +          // Boosted: +1000
  popularity_score * 100 +        // Views + favorites: 0-100
  relevance_score * 50 +          // User preferences: 0-50
  recency_bonus * 10 +            // Recent listings: 0-10
  distance_penalty                // Distance: -0 to -50
)
```

**Sorting Priority:**
1. Boosted listings (active boost)
2. Relevance (user preferences + search history)
3. Popularity (views + favorites)
4. Recency (created_at)
5. Distance (closest first)

---

### **Bosqich 4: Personalization Engine**

**Content-Based Filtering:**
- Foydalanuvchi qidirgan so'zlar
- Ko'rgan kategoriyalar
- Favoritelar kategoriyalari
- Qo'shni kategoriyalar (electronics → accessories)

**Recommendation Score:**
```typescript
recommendation_score = (
  category_match * 30 +           // User ko'rgan kategoriya: 30
  keyword_match * 20 +            // Search history match: 20
  neighbor_category * 10 +        // Related category: 10
  popularity * 5 +                // General popularity: 5
  recency * 2                     // New listings: 2
)
```

---

### **Bosqich 5: Bosh Sahifa Dizayni**

**Layout Structure:**
```
┌─────────────────────────┐
│  Header (Search Bar)    │
├─────────────────────────┤
│  Category Carousel      │
├─────────────────────────┤
│  Tabs: [Siz uchun] [Kun]│
├─────────────────────────┤
│  Product Grid (2 cols)  │
│  ┌──────┐ ┌──────┐     │
│  │ Card │ │ Card │     │
│  └──────┘ └──────┘     │
│  ┌──────┐ ┌──────┐     │
│  │ Card │ │ Card │     │
│  └──────┘ └──────┘     │
└─────────────────────────┘
```

**Features:**
- Search bar (header'da)
- Category icons (horizontal scroll)
- "Siz uchun" tab (personalized)
- "Kun narxlari" tab (discounted/free items)
- Filter button
- Modern card design

---

## 🚀 Bosqichma-Bosqich Amalga Oshirish

### **Step 1: Database Setup** (30 min)
1. SQL migration fayl yaratish
2. Jadvallarni qo'shish
3. Indexes yaratish

### **Step 2: Tracking Functions** (1 hour)
1. `trackUserSearch()` function
2. `trackUserView()` function
3. `trackUserInteraction()` function

### **Step 3: Category Validation** (1 hour)
1. Keyword mapping
2. Validation function
3. Auto-correction logic

### **Step 4: Sorting Algorithm** (2 hours)
1. Scoring function
2. Hybrid sorting
3. Performance optimization

### **Step 5: Personalization** (2 hours)
1. User preference calculation
2. Recommendation algorithm
3. "Siz uchun" section

### **Step 6: UI Redesign** (3 hours)
1. New Home page layout
2. Category carousel
3. Tabs implementation
4. Modern card design

### **Step 7: Integration & Testing** (1 hour)
1. All features integration
2. Testing
3. Bug fixes

---

## 📊 Key Metrics to Track

1. **Relevance Score** - User preferences match
2. **Click-Through Rate** - Recommendations success
3. **Category Accuracy** - Auto-categorization correctness
4. **User Engagement** - Views, favorites, searches

---

## ✅ Success Criteria

- ✅ Kategoriya validatsiyasi ishlaydi (kamaz "clothing"ga qo'shilmaydi)
- ✅ Personalizatsiya ishlaydi (qidirilgan narsalar ko'rsatiladi)
- ✅ Tartiblash algoritmi optimal (relevance + popularity)
- ✅ Bosh sahifa modern va foydalanuvchi uchun qulay
- ✅ Performance yaxshi (< 2s load time)

---

**Jami Vaqt: ~10-11 soat**

**Boshlaymizmi?** 🚀
