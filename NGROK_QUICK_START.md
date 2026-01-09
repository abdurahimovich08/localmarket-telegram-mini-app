# Ngrok Tunnel - Tezkor Qo'llanma

## 🚀 Ngrok Tunnel'ni Ishga Tushirish

### Terminal'da (PowerShell):

```powershell
npx ngrok@latest http 3001
```

Yoki script orqali:

```powershell
.\start-ngrok-tunnel.ps1
```

---

## ✅ Nima Kutish Kerak:

Ngrok ishga tushgandan keyin, terminal'da quyidagiga o'xshash ko'rinadi:

```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://xxxxx.ngrok-free.app -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**HTTPS URL'ni ko'chiring:** `https://xxxxx.ngrok-free.app`

---

## 📱 BotFather'da URL'ni Sozlash:

1. Telegram'da **@BotFather** ga kiring
2. `/newapp` buyrug'ini yuboring
3. Bot'ingizni tanlang
4. **App URL** ga ngrok URL'ni kiriting
5. Save qiling

---

## 🧪 Test Qilish:

1. Telegram'da bot'ingizga kiring
2. Menu Button'ni bosing
3. Mini App ochilishi kerak! 🎉

---

## ⚠️ Muhim Eslatmalar:

- ✅ **Development server ishlab turishi kerak** (`npm run dev`)
- ✅ **Tunnel terminal oynasini yopmaslik kerak**
- ✅ **Tunnel to'xtasa, URL ishlamaydi**
- ✅ **Web Interface:** http://127.0.0.1:4040 (local monitoring)

---

## 🛑 Tunnel'ni To'xtatish:

Terminal'da `Ctrl+C` bosing
