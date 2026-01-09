# Ngrok Tezkor O'rnatish va Ishlatish

## Windows uchun Ngrok O'rnatish

### Variant 1: Direct Download (Eng Oson) ⭐

1. **Ngrok'ni yuklab oling:**
   - https://ngrok.com/download ga kiring
   - Windows uchun zip faylni yuklab oling

2. **O'rnatish:**
   - Zip faylni oching
   - `ngrok.exe` ni `C:\Windows\System32` ga ko'chiring yoki
   - Yoki biror papkaga extract qiling va PATH ga qo'shing

### Variant 2: Chocolatey orqali (Agar o'rnatilgan bo'lsa)

```powershell
choco install ngrok
```

### Variant 3: Scoop orqali (Agar o'rnatilgan bo'lsa)

```powershell
scoop install ngrok
```

### Variant 4: npx orqali (vaqtincha ishlatish)

```powershell
npx ngrok@latest http 5173
```

---

## Ngrok'ni Ishlatish

### 1. Ngrok Account yaratish (Birinchi marta)

1. https://ngrok.com ga kiring
2. Sign up qiling (bepul)
3. Dashboard'dan **authtoken** ni oling
4. Terminal'da:
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### 2. Ngrok'ni Ishga Tushirish

**Yangi terminal oching** va:

```powershell
ngrok http 5173
```

*(5173 - Vite development server port. Agar boshqa port bo'lsa, o'sha portni ishlating)*

### 3. HTTPS URL'ni Olish

Ngrok ishga tushgandan keyin, terminal'da ko'rinadi:

```
Forwarding    https://abc123def456.ngrok-free.app -> http://localhost:5173
```

**Shu HTTPS URL'ni oling:** `https://abc123def456.ngrok-free.app`

---

## BotFather'da URL'ni Yangilash

1. Telegram'da **@BotFather** ga kiring
2. `/newapp` buyrug'ini yuboring
3. Bot'ingizni tanlang
4. **App URL** ga ngrok URL'ni kiriting: `https://abc123def456.ngrok-free.app`
5. Save qiling

---

## Test Qilish

1. Telegram'da bot'ingizga kiring
2. Menu Button'ni bosing (yoki `/start` dan keyin button'ni bosing)
3. Mini App ochilishi kerak! 🎉

---

## ⚠️ Muhim Eslatmalar

- Ngrok'ni ishga tushirganda, development server ham ishlashi kerak (`npm run dev`)
- Har safar ngrok'ni qayta ishga tushirganda, yangi URL olasiz
- Har safar yangi URL bo'lsa, BotFather'da yangilash kerak
- Ngrok'ni yopib qo'ysangiz, URL ishlamaydi

---

## Production uchun

Production'da ngrok'ni ishlatmang! O'rniga Vercel yoki Netlify ga deploy qiling va doimiy URL oling.
