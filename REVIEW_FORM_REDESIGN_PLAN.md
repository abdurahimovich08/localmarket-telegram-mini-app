# 🎨 Review Form Redesign Plan - Apple Style

## 📋 USER TALABLARI

### 1. AI Chat'da So'raladigan Yangi Ma'lumotlar
- ✅ Yetkazib berish (bor/yo'q, muddati, shartlari)
- ✅ Aksiya (asl narx, aksiya narxi, muddati, sababi - majburiy, shartlari - ixtiyoriy)
- ✅ Brend nomi va ishlab chiqarilgan mamlakati (alohida)
- ✅ Ishlab chiqarilgan yili

### 2. Review Form Redesign

#### A. Sarlavha (Title)
- Format: `{Taxonomy nomi} ({Brend})`
- Misol: "Krossovka (Nike)"
- ✅ Implemented

#### B. Tavsif (Description)
- Hozircha qo'lda yoziladi
- Keyinchalik rasmga qarab AI tavsif yaratadi
- ✅ Implemented (hozircha qo'lda)

#### C. Narx (Price) - Apple Style Section
```
┌─────────────────────────────────────┐
│ 💰 Narx                             │
├─────────────────────────────────────┤
│ Asl narx: [500,000 so'm]           │
│                                     │
│ ⚡ Aksiya mavjudmi? [☑️ Ha]        │
│                                     │
│ Asl narx (aksiya): [600,000 so'm]  │
│ Aksiya narxi: [500,000 so'm]       │
│ Aksiya muddati: [7 kun]            │
│ Aksiya sababi: [Mavsumiy aksiya]*  │
│ Aksiya shartlari: [ixtiyoriy]      │
└─────────────────────────────────────┘
```

#### D. Bepul (Free)
```
┌─────────────────────────────────────┐
│ 🎁 Bepul                             │
├─────────────────────────────────────┤
│ ☑️ Bepul                             │
│ ☑️ Narxni savdolashish mumkin        │
│ ☑️ O'zgarmas narx                    │
└─────────────────────────────────────┘
```

#### E. Holati (Condition)
- ✅ O'zbekcha: yangi, yangi_kabi, yaxshi, o'rtacha, eski
- ✅ Implemented

#### F. Joylashuv (Location)
- Google Maps API integratsiya
- Avtomatik aniqlash
- Qo'lda o'zgartirish imkoniyati
- ⏳ TODO: Google Maps API integratsiya

#### G. Mavjud Miqdor (Stock) - O'lcham/Rang Integratsiya
```
┌─────────────────────────────────────┐
│ 📦 Mavjud Miqdor                    │
├─────────────────────────────────────┤
│ O'lchamlar: [☑️ M] [☑️ L] [☑️ XL]  │
│ Ranglar: [☑️ Oq] [☑️ Qora]          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ O'lcham | Rang | Miqdor         │ │
│ ├─────────────────────────────────┤ │
│ │ M      | Oq   | [5 dona]       │ │
│ │ M      | Qora | [3 dona]       │ │
│ │ L      | Oq   | [7 dona]       │ │
│ │ L      | Qora | [4 dona]       │ │
│ │ XL     | Oq   | [2 dona]       │ │
│ │ XL     | Qora | [1 dona]       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### H. Takrorlangan Qismlarni Olib Tashlash
- ❌ Eski narx (aksiya) - yuqoriga ko'chirildi
- ❌ Mavjud miqdor (takrorlangan) - olib tashlash
- ❌ O'lchamlar (takrorlangan) - yuqoriga ko'chirildi
- ❌ Ranglar (takrorlangan) - yuqoriga ko'chirildi

#### I. Qo'shimcha Fieldlar
- ✅ Brend
- ✅ Ishlab chiqarilgan mamlakati
- ✅ Material
- ✅ Jins (Taxonomy'dan avtomatik)
- ✅ Mavsum (O'zbekcha)
- ✅ Chegirma foizi (Avtomatik hisoblash)
- ✅ Yetkazib berish (bor/yo'q, muddati, shartlari)
- ✅ Ishlab chiqarilgan yili

---

## 🎯 IMPLEMENTATION STATUS

### ✅ Completed
1. Schema yangilash - yangi fieldlar qo'shildi
2. Title generation - `{Taxonomy} ({Brend})` format
3. Condition o'zbekcha - yangi, yangi_kabi, yaxshi, o'rtacha, eski
4. Enum field'lar uchun o'zbekcha label mapping

### ⏳ In Progress
1. Review Form redesign - Apple style
2. Narx section (asl, aksiya, muddat, sabab, shartlar)
3. Bepul section (savdolashish + o'zgarmas narx)
4. Mavjud miqdor (o'lcham/rang integratsiya)
5. Google Maps API integratsiya
6. Takrorlangan qismlarni olib tashlash

### 📝 Next Steps
1. Review Form'ni to'liq redesign qilish
2. Apple-style section'lar yaratish
3. Mavjud miqdor o'lcham/rang integratsiya
4. Google Maps API integratsiya
5. Chegirma foizi avtomatik hisoblash

---

## 📊 FIELD STRUCTURE

### Core Fields (Yuqorida)
1. Sarlavha (Title) - `{Taxonomy} ({Brend})`
2. Tavsif (Description) - qo'lda
3. Narx (Price) - asl narx, aksiya section
4. Bepul (Free) - checkbox'lar
5. Holati (Condition) - o'zbekcha
6. Joylashuv (Location) - Google Maps

### Attribute Fields (Pastda)
1. Brend
2. Ishlab chiqarilgan mamlakati
3. Ishlab chiqarilgan yili
4. O'lchamlar (Mavjud miqdor section'da)
5. Ranglar (Mavjud miqdor section'da)
6. Material
7. Mavsum (o'zbekcha)
8. Yetkazib berish (bor/yo'q, muddati, shartlari)
9. Aksiya (asl narx, narxi, muddati, sababi, shartlari)

---

**Status:** ⏳ In Progress - Asosiy qismlar qo'shildi, to'liq redesign keyingi step
