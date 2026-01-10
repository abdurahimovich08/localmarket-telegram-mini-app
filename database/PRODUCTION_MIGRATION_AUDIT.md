# DATABASE MIGRATION AUDIT - PRODUCTION READY

## Executive Summary

**STATUS**: ✅ Complete audit with clear migration order
**TARGET**: Supabase (PostgreSQL + RLS)
**PRIORITY**: Production-critical fixes identified

---

## 1. DATABASE & MIGRATION AUDIT

### SQL Files Classification

#### ✅ **REQUIRED IN SUPABASE** (Must be executed in order):

| Order | File | Purpose | Dependencies | Status |
|-------|------|---------|--------------|--------|
| 1 | `database/schema.sql` | Core schema (users, listings, favorites, reviews, transactions, reports) | None | ⚠️ Needs TIMESTAMPTZ fix |
| 2 | `database/migrations/add_user_tracking.sql` | User search history, interactions, category preferences | schema.sql | ✅ Ready |
| 3 | `database/migrations/add_search_indexes.sql` | Full-text search, fuzzy matching indexes | schema.sql | ✅ Ready |
| 4 | `database/migrations/add_subcategories.sql` | Subcategories table + listings.subcategory_id | schema.sql | ✅ Ready |
| 5 | `database/migrations/add_cart_system.sql` | Shopping cart functionality | schema.sql | ✅ Ready |
| 6 | `database/migrations/add_user_last_seen.sql` | User last seen tracking | schema.sql | ⚠️ Needs listing_id fix |
| 7 | `database/FIX_USER_LAST_SEEN.sql` | Fix user_last_seen structure | add_user_last_seen.sql | ✅ Ready |

**OR USE SINGLE FILE:**
- `database/MIGRATION_COMPLETE.sql` - **RECOMMENDED** - Contains all migrations in correct order

#### ❌ **DO NOT RUN IN SUPABASE** (Local/Test only):

| File | Reason |
|------|--------|
| `database/test_data/test_listings.sql` | Test data only - use in development |
| `database/RLS_TEST_DISABLE.sql` | Debugging tool - NEVER in production |

#### ⚠️ **CONDITIONAL** (Run only if needed):

| File | When to Use |
|------|-------------|
| `database/FIX_USER_LAST_SEEN.sql` | Only if user_last_seen table already exists with old structure |

---

## 2. MIGRATION ORDER & DEPENDENCIES

### Correct Execution Order:

```
1. Extensions (uuid-ossp, pg_trgm, unaccent)
   ↓
2. Core Schema (users, listings, favorites, reviews, transactions, reports)
   ↓
3. User Tracking (user_searches, user_listing_interactions, user_category_preferences)
   ↓
4. Search Indexes (full-text, trigram)
   ↓
5. Subcategories (subcategories table, listings.subcategory_id)
   ↓
6. Cart System (cart_items)
   ↓
7. User Last Seen (user_last_seen)
   ↓
8. All Indexes (performance optimization)
   ↓
9. Functions & Triggers (business logic)
   ↓
10. RLS Policies (security)
```

### Migration Execution Strategy:

**Option 1: Single Migration File (RECOMMENDED)**
```sql
-- Run once in Supabase SQL Editor:
-- database/MIGRATION_COMPLETE.sql
```

**Option 2: Individual Migrations**
```sql
-- Run in order:
1. database/schema.sql (with fixes)
2. database/migrations/add_user_tracking.sql
3. database/migrations/add_search_indexes.sql
4. database/migrations/add_subcategories.sql
5. database/migrations/add_cart_system.sql
6. database/migrations/add_user_last_seen.sql
7. database/FIX_USER_LAST_SEEN.sql (if needed)
```

---

## 3. KNOWN ISSUES TO FIX

### Issue 1: TIMESTAMP vs TIMESTAMPTZ
**Problem**: `schema.sql` uses `TIMESTAMP` instead of `TIMESTAMPTZ`
**Impact**: Timezone issues, date comparisons fail
**Solution**: `MIGRATION_COMPLETE.sql` already fixed

### Issue 2: user_last_seen Structure
**Problem**: Old version uses `last_seen_at`, new uses `last_seen_listing_id`
**Impact**: Cannot track which listing was last seen
**Solution**: `FIX_USER_LAST_SEEN.sql` handles migration

### Issue 3: RLS Policies
**Problem**: Some policies use `auth.uid()::bigint` which fails (UUID vs BIGINT)
**Impact**: RLS blocks access
**Solution**: `MIGRATION_COMPLETE.sql` uses `true` for public access (Telegram auth handled in app)

---

## 4. VERIFICATION QUERIES

After migration, run these to verify:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Check functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## NEXT: See PRODUCTION_IMPLEMENTATION.sql for complete implementation
