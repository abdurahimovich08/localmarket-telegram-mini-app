# Muammolarni Hal Qilish

## ❌ ERR_NGROK_8012: Connection Refused

**Muammo:** Ngrok tunnel ishga tushgan, lekin development server ishlamayapti.

**Yechim:**

### 1. Development Server'ni Ishga Tushirish

Yangi terminal ochib:

```powershell
npm run dev
```

Yoki agar oldingi terminal oynasida to'xtatilgan bo'lsa, qayta ishga tushiring.

### 2. Server Ishga Tushganini Tekshirish

Browser'da ochib tekshiring:
- http://localhost:3001

Agar sahifa yuklansa, server ishlamoqda! ✅

### 3. Ngrok Tunnel Tekshirish

Ngrok tunnel ishga tushganini tekshiring:
- http://127.0.0.1:4040 (Web Interface)

Yoki terminal'da ngrok status'ni ko'ring.

---

## ✅ To'g'ri Ishga Tushirish Tartibi

1. **Development Server** (Birinchi terminal):
   ```powershell
   npm run dev
   ```
   - Server `http://localhost:3001` da ishlashi kerak

2. **Ngrok Tunnel** (Ikkinchi terminal):
   ```powershell
   npx ngrok@latest http 3001
   ```
   - HTTPS URL ko'rinishi kerak

3. **BotFather'da URL'ni sozlash**
   - Ngrok HTTPS URL'ni BotFather'da Mini App URL sifatida qo'shing

---

## 🔍 Tekshirish Qadamlar

1. ✅ Development server ishlayaptimi? → `http://localhost:3001`
2. ✅ Ngrok tunnel ishlayaptimi? → `http://127.0.0.1:4040`
3. ✅ URL to'g'ri sozlanganmi? → BotFather'da tekshiring

---

## ⚠️ Muhim Eslatmalar

- Development server **avval** ishga tushishi kerak
- Ngrok tunnel **keyin** ishga tushiriladi
- Ikkalasi ham **ishlab turishi** kerak (terminal oynalari yopilmasligi kerak)
