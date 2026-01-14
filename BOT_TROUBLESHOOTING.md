# 🔧 Bot Muammo Hal Qilish - To'liq Qo'llanma

## ❌ Muammo: Bot /start bosilganda javob bermayapti

---

## 🔍 1. Webhook Holatini Tekshirish

### PowerShell'da:

```powershell
$BOT_TOKEN = "7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

**Kutilayotgan natija:**
```json
{
  "ok": true,
  "result": {
    "url": "https://localmarket-telegram-mini-app-q1vp.vercel.app/api/telegram-bot",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

**Agar webhook yo'q bo'lsa:**
- `url` bo'sh bo'ladi
- Webhook o'rnatish kerak

---

## 🔗 2. Webhook O'rnatish

### Usul 1: PowerShell Script (Tavsiya)

```powershell
.\setup-webhook.ps1
```

### Usul 2: Browser orqali

Browser'da oching:
```
https://localmarket-telegram-mini-app-q1vp.vercel.app/api/set-webhook
```

### Usul 3: Terminal orqali

```powershell
Add-Type -AssemblyName System.Web
$BOT_TOKEN = "7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM"
$WEBHOOK_URL = "https://localmarket-telegram-mini-app-q1vp.vercel.app/api/telegram-bot"
$encodedUrl = [System.Web.HttpUtility]::UrlEncode($WEBHOOK_URL)
Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=$encodedUrl" -Method Post
```

---

## ✅ 3. Vercel Deployment Tekshirish

### Vercel Dashboard'da:

1. **Project'ni oching**: `localmarket-telegram-mini-app`
2. **Deployments** bo'limiga kiring
3. **Eng so'nggi deployment** muvaffaqiyatli bo'lganligini tekshiring
4. **Functions** bo'limiga kiring
5. `api/telegram-bot` function mavjudligini tekshiring

### Agar function yo'q bo'lsa:

1. **GitHub'ga push qiling** (agar qilinmagan bo'lsa)
2. **Vercel avtomatik deploy qiladi**
3. Yoki **Manual Redeploy** qiling

---

## 🔐 4. Environment Variables Tekshirish

### Vercel Dashboard > Settings > Environment Variables:

Quyidagi variables mavjudligini tekshiring:

```
TELEGRAM_BOT_TOKEN=7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM
MINI_APP_URL=https://localmarket-telegram-mini-app-q1vp.vercel.app
```

**Muhim:** Environment variables qo'shgandan keyin **QAYTA DEPLOY** qiling!

---

## 📝 5. Vercel Logs Tekshirish

### Vercel Dashboard'da:

1. **Deployments** > Eng so'nggi deployment
2. **Functions** > `api/telegram-bot`
3. **Logs** bo'limiga kiring

**Nima qidirish kerak:**
- `Error handling webhook:` - xatoliklar
- `Received /start command` - agar bot kodida console.log bo'lsa
- `Bot not initialized` - token muammosi

---

## 🧪 6. Bot Kodini Test Qilish

### Local'da test (polling rejim):

```powershell
cd bot
npm start
```

**Agar local'da ishlasa:**
- Bot kodida muammo yo'q
- Muammo Vercel deployment'da

**Agar local'da ham ishlamasa:**
- Bot kodida xatolik bor
- `.env` faylida `TELEGRAM_BOT_TOKEN` to'g'ri ekanligini tekshiring

---

## 🔄 7. To'liq Qayta Sozlash

### Qadam 1: Webhook'ni o'chirish

```powershell
$BOT_TOKEN = "7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook" -Method Post
```

### Qadam 2: Vercel'da qayta deploy

1. Vercel Dashboard > Project
2. **...** > **Redeploy**

### Qadam 3: Webhook'ni qayta o'rnatish

```powershell
.\setup-webhook.ps1
```

### Qadam 4: Test qilish

Bot'ga `/start` yuboring

---

## 🐛 8. Keng Tarqalgan Xatolar

### Xatolik 1: "Bot not configured"

**Sabab:** `TELEGRAM_BOT_TOKEN` topilmayapti

**Yechim:**
1. Vercel Dashboard > Settings > Environment Variables
2. `TELEGRAM_BOT_TOKEN` qo'shing
3. Qayta deploy qiling

### Xatolik 2: "Method not allowed"

**Sabab:** Function faqat POST request'larini qabul qiladi

**Yechim:** Bu normal - Telegram webhook POST yuboradi

### Xatolik 3: Webhook xatolik ko'rsatayapti

**Sabab:** Function deploy bo'lmagan yoki xatolik bor

**Yechim:**
1. Vercel logs'ni ko'ring
2. Function code'ni tekshiring
3. Qayta deploy qiling

---

## ✅ 9. Tekshirish Ro'yxati

- [ ] Webhook o'rnatilgan (`getWebhookInfo`)
- [ ] Vercel'da function deploy bo'lgan
- [ ] Environment variables to'g'ri
- [ ] Vercel logs'da xatolik yo'q
- [ ] Bot'ga `/start` yuborib test qilingan

---

## 📞 10. Qo'shimcha Yordam

Agar hali ham ishlamasa:

1. **Vercel logs'ni to'liq ko'ring**
2. **Webhook info'ni tekshiring**
3. **Bot kodini local'da test qiling**
4. **Environment variables'ni qayta tekshiring**

---

## 🎯 Eng Tezkor Yechim

Agar hammasi to'g'ri ko'rinayotgan bo'lsa, lekin hali ham ishlamasa:

```powershell
# 1. Webhook'ni o'chirish
$BOT_TOKEN = "7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook" -Method Post

# 2. 5 soniya kutish
Start-Sleep -Seconds 5

# 3. Webhook'ni qayta o'rnatish
.\setup-webhook.ps1

# 4. Test qilish
# Bot'ga /start yuboring
```
