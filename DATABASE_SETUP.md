# Database Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: LocalMarket
   - **Database Password**: (choose a strong password - save it!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for project to initialize

## Step 2: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `database/schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

## Step 3: Get API Credentials

1. In Supabase dashboard, go to **Settings** (gear icon)
2. Click **API** in the left menu
3. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL` in `.env`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY` in `.env`

## Step 4: Set Up Storage (for images)

1. In Supabase dashboard, go to **Storage** (left sidebar)
2. Click **Create bucket**
3. Name: `listings`
4. **Public bucket**: ✅ Enable (toggle ON)
5. Click **Create bucket**
6. Go to **Policies** tab
7. Click **New Policy** → **For full customization**
8. Policy name: `Allow public uploads`
9. Allowed operation: `INSERT`
10. Policy definition:
    ```sql
    true
    ```
11. Click **Review** → **Save policy**
12. Repeat for `SELECT` operation (for viewing images)

## Step 5: Verify Setup

Run this query in SQL Editor to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see:
- users
- listings
- favorites
- reviews
- transactions
- reports

## Troubleshooting

### "relation already exists" error
- Tables already exist, that's fine. You can skip or drop them first.

### Permission denied
- Make sure you're using the SQL Editor, not the Table Editor
- Check that you're the project owner

### Storage bucket errors
- Make sure bucket is set to **Public**
- Check that policies are set correctly
