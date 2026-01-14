# 🤖 Gemini AI Integration Plan

## 🎯 Maqsad
Bot'ga `/start` bosilganda AI foydalanuvchi bilan suhbatga kirib, uning maqsadini aniqlab kerakli joyga yo'naltiradi.

## 📋 Tizim Strukturasi

### 1. User Intent Detection
- **Xaridor (Buyer)**: Mahsulot/xizmat sotib olishni xohlaydi
- **Sotuvchi (Seller)**: 
  - Do'kon yaratish/kuzatish/tahrirlash
  - Servis yaratish/tahrirlash
  - E'lon yaratish

### 2. Routing Logic

#### Xaridor uchun:
- `/` - Bosh sahifa (Home)

#### Sotuvchi uchun:
- **Do'kon yaratish**: `/create-store`
- **Do'kon kuzatish**: `/store/:id` (agar do'kon bor bo'lsa)
- **Do'kon tahrirlash**: `/store/:id/edit` (agar do'kon bor bo'lsa)
- **Servis yaratish**: `/create-service`
- **Servis tahrirlash**: `/service/:id/edit` (agar servis bor bo'lsa)
- **E'lon yaratish**: `/create`

### 3. User Context Checking
- User'ning do'konlari bor yoki yo'qligi
- User'ning servislari bor yoki yo'qligi
- User'ning e'lonlari bor yoki yo'qligi

## 🔧 Implementation Steps

### Step 1: Gemini AI Conversation Handler
**Fayl**: `api/gemini-chat.ts`
- Conversation flow management
- Intent detection
- Context-aware responses

### Step 2: User Context API
**Fayl**: `api/user-context.ts`
- Get user stores
- Get user services
- Get user listings count

### Step 3: Bot Integration
**Fayl**: `api/telegram-bot.ts`
- AI conversation on `/start`
- Intent detection
- Routing decisions

### Step 4: Frontend Integration (Optional)
**Fayl**: `src/lib/gemini.ts`
- Client-side AI chat (agar kerak bo'lsa)

## 📝 Conversation Flow

1. User `/start` bosadi
2. AI salomlashadi va maqsadini so'raydi
3. User javob beradi
4. AI intent'ni aniqlaydi
5. AI user context'ni tekshiradi (do'kon/servis bor yoki yo'q)
6. AI kerakli joyga yo'naltiradi

## 🎨 Example Conversation

**AI**: "Salom! LocalMarket'ga xush kelibsiz! Siz nima qilmoqchisiz?"
- "Mahsulot sotib olishni xohlayman" → Xaridor → `/`
- "Do'kon yaratmoqchiman" → Sotuvchi → `/create-store`
- "Mening do'konimni ko'rish" → Sotuvchi → `/store/:id` (agar bor bo'lsa)
- "Xizmat ko'rsatmoqchiman" → Sotuvchi → `/create-service`
