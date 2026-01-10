# eBay-Style Design Implementation Plan

## Yul Xaritasi (Roadmap)

### 1. Listing Card Dizayni (eBay-style)
- [ ] Horizontal layout: rasm chapda, ma'lumotlar o'ngda
- [ ] Title, condition, brand, price ko'rsatish
- [ ] Free shipping badge
- [ ] Heart icon (favorite)
- [ ] Sponsored tag
- [ ] Seller info

### 2. Pagination System
- [ ] 10 ta elon bir sahifada
- [ ] Next/Previous buttons
- [ ] Page numbers
- [ ] Results count ko'rsatish

### 3. Sub-kategoriyalar Tizimi
- [ ] Database schema: subcategories table
- [ ] Category hierarchy (parent-child)
- [ ] Subcategory navigation
- [ ] Breadcrumbs component

### 4. Category Navigation
- [ ] Subcategory carousel
- [ ] Category drill-down
- [ ] Breadcrumb navigation

### 5. Filter System Enhancement
- [ ] Subcategory filter
- [ ] Brand filter
- [ ] Condition filter
- [ ] Price range filter
- [ ] Location filter

### 6. Search Enhancement
- [ ] Subcategory search support
- [ ] Category path in search results

## Implementation Steps

### Step 1: Database Migration - Subcategories
- Create `subcategories` table
- Add `subcategory_id` to `listings` table
- Create migration SQL

### Step 2: Update Types
- Add subcategory types
- Update Listing interface
- Create category hierarchy types

### Step 3: eBay-Style Listing Card
- Redesign ListingCard component
- Horizontal layout
- Better information display

### Step 4: Pagination Component
- Create Pagination component
- Integrate with Home and Search pages
- 10 items per page

### Step 5: Subcategory Navigation
- Create SubcategoryCarousel
- Breadcrumb component
- Category drill-down

### Step 6: Filter Updates
- Add subcategory to filters
- Update SearchFilters component
