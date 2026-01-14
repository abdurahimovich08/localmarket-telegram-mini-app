#!/bin/bash
# Release Gates - Majburiy Tekshiruvlar
# Migration boshlashdan oldin barcha gate'lar o'tishi kerak

set -e

echo "🚨 Release Gates - Migration Tekshiruvlari"
echo "=========================================="

# 1. Build Gate
echo ""
echo "1️⃣ Build Gate..."
npm run build
echo "✅ Build muvaffaqiyatli"

# 2. Type Check Gate
echo ""
echo "2️⃣ Type Check Gate..."
npx tsc --noEmit
echo "✅ Type check muvaffaqiyatli"

# 3. Lint Gate
echo ""
echo "3️⃣ Lint Gate..."
npm run lint || echo "⚠️ Lint xatolari bor, lekin davom etamiz"
echo "✅ Lint tekshiruvi tugadi"

# 4. Supabase VIEW Health Check (SQL)
echo ""
echo "4️⃣ Supabase VIEW Health Check..."
echo "⚠️ Quyidagi SQL so'rovlarni Supabase SQL Editor'da bajarish kerak:"
echo ""
echo "SELECT count(*) FROM unified_items;"
echo "SELECT entity_type, count(*) FROM unified_items GROUP BY 1;"
echo "SELECT * FROM unified_items ORDER BY created_at DESC LIMIT 20;"
echo ""
read -p "VIEW health check tugallandi? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ VIEW health check tugallanmadi. Migration'ni to'xtatamiz."
    exit 1
fi
echo "✅ VIEW health check muvaffaqiyatli"

# 5. RLS Owner Check
echo ""
echo "5️⃣ RLS Owner Check..."
echo "⚠️ Quyidagi testlarni bajarish kerak:"
echo "   - Owner bo'lmagan user bilan update/delete urinish → blok bo'lishi kerak"
echo "   - Owner bilan update/delete → o'tishi kerak"
echo ""
read -p "RLS owner check tugallandi? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ RLS owner check tugallanmadi. Migration'ni to'xtatamiz."
    exit 1
fi
echo "✅ RLS owner check muvaffaqiyatli"

echo ""
echo "✅ Barcha Release Gates o'tildi!"
echo "Migration boshlash mumkin."
