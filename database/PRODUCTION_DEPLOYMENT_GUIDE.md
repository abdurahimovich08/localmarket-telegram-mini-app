# PRODUCTION DEPLOYMENT GUIDE

## Senior Backend Engineer & Database Architect Analysis

**Project**: Telegram Marketplace Bot (Supabase PostgreSQL + RLS)  
**Status**: ✅ Complete Implementation Ready  
**Date**: 2024

---

## EXECUTIVE SUMMARY

This guide provides a complete, production-ready database implementation for the Telegram Marketplace bot. All requirements have been addressed with scalable, performant solutions.

### Key Deliverables:

1. ✅ Complete migration audit with execution order
2. ✅ Enhanced user activity tracking (views, likes, search, last_seen)
3. ✅ Automatic user preference computation system
4. ✅ Production-ready recommendation algorithm
5. ✅ Cursor-based pagination (no OFFSET bugs)
6. ✅ Full Supabase RLS compliance
7. ✅ Comprehensive indexes for performance

---

## PART 1: DATABASE & MIGRATION AUDIT

### Current State Analysis

**Existing SQL Files:**
```
database/
├── schema.sql                        [⚠️ NEEDS FIX - TIMESTAMPTZ]
├── MIGRATION_COMPLETE.sql            [✅ READY - Use this]
├── FIX_USER_LAST_SEEN.sql           [✅ READY - Run if needed]
├── RLS_TEST_DISABLE.sql             [❌ TEST ONLY]
├── migrations/
│   ├── add_user_tracking.sql        [✅ INCLUDED IN MIGRATION_COMPLETE]
│   ├── add_search_indexes.sql       [✅ INCLUDED]
│   ├── add_subcategories.sql        [✅ INCLUDED]
│   ├── add_cart_system.sql          [✅ INCLUDED]
│   └── add_user_last_seen.sql       [⚠️ USE FIX_USER_LAST_SEEN instead]
└── test_data/
    └── test_listings.sql            [❌ LOCAL ONLY]
```

### Migration Execution Plan

#### **OPTION 1: Single Migration (RECOMMENDED)**

**Run in Supabase SQL Editor:**
```sql
-- Step 1: Run MIGRATION_COMPLETE.sql
-- This includes everything in correct order

-- Step 2: Run PRODUCTION_IMPLEMENTATION.sql
-- This adds enhanced tracking, preferences, recommendations
```

#### **OPTION 2: Individual Migrations** (if already partially migrated)

```
1. schema.sql (fix TIMESTAMPTZ first)
2. migrations/add_user_tracking.sql
3. migrations/add_search_indexes.sql
4. migrations/add_subcategories.sql
5. migrations/add_cart_system.sql
6. FIX_USER_LAST_SEEN.sql (if user_last_seen exists)
7. PRODUCTION_IMPLEMENTATION.sql (new enhancements)
```

### ⚠️ DO NOT RUN:

- `database/test_data/test_listings.sql` - Test data only
- `database/RLS_TEST_DISABLE.sql` - Debugging tool, never in production
- Individual migration files if `MIGRATION_COMPLETE.sql` was already run

### Verification Queries

After migration, verify success:

```sql
-- Check all tables exist (should return 15+ tables)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check critical tables
SELECT 'listing_views' as table_name, COUNT(*) as row_count FROM listing_views
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'user_searches', COUNT(*) FROM user_searches
UNION ALL
SELECT 'user_last_seen', COUNT(*) FROM user_last_seen;
```

---

## PART 2: USER ACTIVITY TRACKING

### Design Decisions

**WHY Event-Sourcing Approach:**
- Each interaction is a separate row (no duplication)
- Easy to analyze trends over time
- Can reconstruct any state at any point
- Efficient for analytics and ML

**WHY Deduplication Per Day:**
- `UNIQUE(user_telegram_id, listing_id, DATE(viewed_at))`
- Prevents spam/inflation of view counts
- Still tracks multiple views if different days

### Implementation Details

#### 2.1 Listing Views
```sql
-- Table: listing_views
-- Purpose: Track every listing view per user
-- Deduplication: One view per user per listing per day
-- Indexes: Optimized for user history and listing popularity
```

**Usage:**
```sql
-- Track a view
INSERT INTO listing_views (user_telegram_id, listing_id, session_id)
VALUES (123456789, 'uuid-here', 'session-123')
ON CONFLICT DO NOTHING; -- Auto-deduplicates
```

#### 2.2 Listing Likes
```sql
-- Reuse: favorites table (already exists)
-- Additional: Track via trigger for preferences computation
```

#### 2.3 Search History
```sql
-- Table: user_searches (enhanced)
-- Tracks: Query, category, filters, clicked result
-- Indexes: Full-text search on query, user history
```

#### 2.4 Last Seen
```sql
-- Table: user_last_seen
-- Design: Uses listing_id (not timestamp) - accurate and safe
-- Purpose: Mark which listing user last viewed (for "NEW" badge)
```

**WHY listing_id instead of timestamp:**
- Timestamps can collide (two listings created at same time)
- Listing_id is unique and sequential
- Safer for cursor-based pagination
- Frontend can calculate "NEW" badge from created_at

### No Duplication Guarantee

**Database Level:**
- `UNIQUE` constraints prevent duplicates
- `ON CONFLICT DO NOTHING` for safe inserts
- Triggers ensure data consistency

**Application Level:**
- Use `ON CONFLICT` in INSERT statements
- Batch operations use `INSERT ... ON CONFLICT`

---

## PART 3: USER PREFERENCE PROFILE

### Design Decision: Triggers vs Views vs Materialized Views

**CHOSEN: Triggers + Function**

**WHY Triggers:**
1. **Real-time**: Updates immediately when user interacts
2. **Efficient**: Only recomputes when data changes
3. **Scalable**: O(1) updates per interaction
4. **RLS-safe**: Can use `SECURITY DEFINER` if needed

**WHY NOT Materialized Views:**
- Requires manual refresh (not real-time)
- Full recomputation expensive on large datasets
- Refresh scheduling adds complexity

**WHY NOT Regular Views:**
- Computed on every SELECT (slow for large datasets)
- Not suitable for frequent queries

### Computed Fields

| Field | Source | Logic |
|-------|--------|-------|
| `top_category` | Most viewed category | `COUNT(*) GROUP BY category ORDER BY count DESC LIMIT 1` |
| `top_subcategory_id` | Most viewed subcategory | Same as above, filtered by subcategory_id |
| `average_viewed_price` | Average of viewed listing prices | `AVG(price) WHERE price > 0` |
| `preferred_condition` | Most viewed condition | `COUNT(*) GROUP BY condition ORDER BY count DESC LIMIT 1` |

### Automatic Updates

**Trigger Events:**
1. `AFTER INSERT ON listing_views` → Recompute preferences
2. `AFTER INSERT ON favorites` → Recompute preferences

**Performance:**
- Triggers run asynchronously (non-blocking)
- Function is optimized with indexed queries
- Only updates affected user's preferences

### Usage Example

```sql
-- Get user preferences (computed automatically)
SELECT * FROM user_preferences 
WHERE user_telegram_id = 123456789;

-- Manual recomputation (if needed)
SELECT compute_user_preferences(123456789);
```

---

## PART 4: RECOMMENDATION ALGORITHM

### Design: Ranking-Based Feed (NOT Filtering)

**WHY Ranking, Not Filtering:**
- Shows ALL listings to all users (no echo chambers)
- New listings always visible
- Better for marketplace discovery
- Allows serendipitous discovery

### Score Components

| Component | Weight | Calculation |
|-----------|--------|-------------|
| Category Match | 40% | If matches user's top_category |
| Subcategory Match | 20% | If matches user's top_subcategory_id |
| Price Similarity | 15% | Closer to avg_viewed_price = higher |
| Condition Match | 10% | If matches preferred_condition |
| Distance | 10% | Closer to user = higher (if GPS available) |
| Popularity | 5% | Normalized views + likes |
| Freshness | 10% | Newer = higher (< 7 days) |
| Boost Bonus | +20 | Extra points if boosted |

**Total Score Range:** 0-115+ (boosted listings can exceed 100)

### Fallback for New Users

**Problem**: New users have no preferences  
**Solution**: Use `get_new_user_feed()` function

**New User Ranking:**
1. Boosted listings first (+20)
2. Recency (newer = higher) (+10)
3. Popularity (views + likes) (+5)

### Production Query

```sql
-- For existing users (with preferences)
SELECT * FROM get_recommendation_feed(
  p_user_id := 123456789,
  p_user_lat := 41.2995,  -- Optional GPS
  p_user_lon := 69.2401,  -- Optional GPS
  p_limit := 50,
  p_cursor_listing_id := NULL  -- For pagination
);

-- For new users (no preferences)
SELECT * FROM get_new_user_feed(
  p_limit := 50,
  p_cursor_listing_id := NULL
);
```

### Performance Optimizations

**Indexes:**
- `idx_listings_status_created` - Fast filtering by status + sorting
- `idx_listings_category_subcategory` - Fast category matching
- `idx_listing_views_user` - Fast preference computation
- `idx_user_preferences_user` - Fast preference lookup

**Function Attributes:**
- `STABLE` - PostgreSQL can cache results within transaction
- `SECURITY DEFINER` - Can bypass RLS if needed (controlled)

---

## PART 5: CURSOR-BASED PAGINATION

### Problem with OFFSET

**Example:**
```
Page 1: Listings 1-10 (OFFSET 0)
User A views page 1
New listing added (now is #5)
User A goes to page 2 (OFFSET 10)
Result: Listing #5 is MISSED (was on page 1, but user saw old page 1)
```

### Solution: Cursor-Based Pagination

**Design:**
- Use `(created_at, listing_id)` as cursor
- Each page returns `has_next_page` boolean
- Next page uses last item's `(created_at, listing_id)` as cursor

**Benefits:**
- New listings always appear
- No duplicates across pages
- Consistent results even with concurrent inserts
- Works with recommendation scoring

### Implementation

```sql
-- First page
SELECT * FROM get_listings_cursor(p_limit := 50);

-- Next page (use last listing_id and created_at from previous page)
SELECT * FROM get_listings_cursor(
  p_limit := 50,
  p_after_listing_id := 'uuid-from-last-item',
  p_after_created_at := '2024-01-01 12:00:00+00'::timestamptz
);
```

**Response Format:**
- Each row includes `has_next_page` boolean
- Client checks if any row has `has_next_page = true`
- Use last row's `listing_id` and `created_at` for next page

---

## PART 6: SUPABASE-SPECIFIC REQUIREMENTS

### RLS (Row Level Security)

**Challenge**: Telegram users don't use Supabase Auth  
**Solution**: Public access with application-level security

**Design:**
- All tables have RLS enabled
- Policies allow public read/insert (Telegram auth handled in app)
- Service role handles authorization

**Tables with RLS:**
- `listing_views` - Public insert, public read
- `user_preferences` - Public read, users can update own
- `user_searches` - Public access
- `user_last_seen` - Public access

### Functions and RLS

**Functions:**
- `STABLE` attribute for caching
- `SECURITY DEFINER` where needed (controlled)
- `SET search_path = public` to prevent injection

**RLS-Safe Functions:**
- All recommendation functions use `STABLE` (read-only)
- Preferences computation uses `SECURITY DEFINER` (safe)

### Recommended Indexes

**Critical Indexes (Required):**
```sql
-- Listing queries
CREATE INDEX idx_listings_status_created ON listings(status, created_at DESC) WHERE status = 'active';
CREATE INDEX idx_listings_category_subcategory ON listings(category, subcategory_id) WHERE status = 'active';

-- User activity
CREATE INDEX idx_listing_views_user ON listing_views(user_telegram_id, viewed_at DESC);
CREATE INDEX idx_listing_views_listing ON listing_views(listing_id, viewed_at DESC);

-- Preferences
CREATE INDEX idx_user_preferences_user ON user_preferences(user_telegram_id);
```

**Optional Indexes (Performance):**
```sql
-- Full-text search (if needed)
CREATE INDEX idx_user_searches_query ON user_searches USING gin(to_tsvector('russian', search_query));

-- Fuzzy search (if needed)
CREATE INDEX idx_listings_title_trgm ON listings USING gin(title gin_trgm_ops);
```

---

## PART 7: DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Backup existing database
- [ ] Review `PRODUCTION_MIGRATION_AUDIT.md`
- [ ] Test migration in staging environment
- [ ] Verify RLS policies work correctly

### Deployment Steps

1. **Run Core Schema** (if not exists):
   ```sql
   -- Run MIGRATION_COMPLETE.sql OR
   -- Run individual migrations in order
   ```

2. **Run Enhanced Features**:
   ```sql
   -- Run PRODUCTION_IMPLEMENTATION.sql
   -- This adds: listing_views, user_preferences, recommendation functions
   ```

3. **Verify**:
   ```sql
   -- Run verification queries from PRODUCTION_MIGRATION_AUDIT.md
   ```

4. **Update Application Code**:
   - Use `get_recommendation_feed()` for home page
   - Use `get_listings_cursor()` for pagination
   - Track views via `listing_views` table
   - Check `user_preferences` for user insights

### Post-Deployment

- [ ] Monitor query performance
- [ ] Check trigger execution (preferences computation)
- [ ] Verify recommendation scores are reasonable
- [ ] Test pagination with new listings
- [ ] Monitor RLS policy effectiveness

---

## PART 8: APPLICATION INTEGRATION

### Frontend Changes Needed

#### 1. Track Listing Views
```typescript
// When user views listing detail page
await supabase
  .from('listing_views')
  .insert({
    user_telegram_id: user.id,
    listing_id: listing.id,
    session_id: sessionId
  })
  .onConflictDoNothing(); // Auto-deduplicates
```

#### 2. Get Recommendation Feed
```typescript
// Home page feed
const { data } = await supabase.rpc('get_recommendation_feed', {
  p_user_id: user.id,
  p_user_lat: location?.lat,
  p_user_lon: location?.lon,
  p_limit: 50,
  p_cursor_listing_id: cursorId || null
});
```

#### 3. Cursor Pagination
```typescript
// Next page
const lastItem = items[items.length - 1];
const { data: nextPage } = await supabase.rpc('get_listings_cursor', {
  p_limit: 50,
  p_after_listing_id: lastItem.listing_id,
  p_after_created_at: lastItem.created_at
});
```

---

## SUMMARY

### ✅ Requirements Met

1. ✅ **Migration Audit**: Complete with execution order
2. ✅ **User Activity Tracking**: Views, likes, search, last_seen (no duplication)
3. ✅ **User Preferences**: Automatic computation via triggers
4. ✅ **Recommendation Algorithm**: Ranking-based, production-ready
5. ✅ **Pagination**: Cursor-based (no OFFSET bugs)
6. ✅ **Supabase RLS**: Full compliance
7. ✅ **Indexes**: Comprehensive and optimized

### Files to Execute in Supabase

**REQUIRED:**
1. `database/MIGRATION_COMPLETE.sql` - Core schema and migrations
2. `database/PRODUCTION_IMPLEMENTATION.sql` - Enhanced features

**OPTIONAL:**
- `database/FIX_USER_LAST_SEEN.sql` - Only if user_last_seen exists with old structure

### Next Steps

1. Review this guide
2. Run migrations in Supabase
3. Verify with provided queries
4. Update application code to use new functions
5. Monitor and optimize as needed

---

**Questions? Check the inline comments in SQL files or refer to specific sections above.**
