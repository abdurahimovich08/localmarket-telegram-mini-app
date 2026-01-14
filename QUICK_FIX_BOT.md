# ⚡ Bot'ni Tezkor Tuzatish - Qadamlar

## 🔍 Muammo: Bot /start bosilganda javob bermayapti

---

## ✅ 1. Webhook Holatini Tekshirish (Bajarildi)

Webhook to'g'ri sozlangan:
- ✅ URL: `https://localmarket-telegram-mini-app-q1vp.vercel.app/api/telegram-bot`
- ✅ Pending updates: 0
- ✅ No errors

---

## 🔧 2. Vercel'da Function Tekshirish

### Qadam 1: Vercel Dashboard'ga Kiring

1. https://vercel.com/dashboard ga kiring
2. `localmarket-telegram-mini-app` project'ni tanlang
3. **Deployments** bo'limiga kiring
4. Eng so'nggi deployment'ni oching

### Qadam 2: Function Mavjudligini Tekshirish

1. **Functions** tab'iga kiring
2. `api/telegram-bot` function mavjudligini tekshiring

**Agar function yo'q bo'lsa:**
- GitHub'ga push qiling (agar qilinmagan bo'lsa)
- Vercel avtomatik deploy qiladi
- Yoki **Redeploy** tugmasini bosing

### Qadam 3: Function Logs'ni Ko'ring

1. `api/telegram-bot` function'ni oching
2. **Logs** bo'limiga kiring
3. Bot'ga `/start` yuborib, log'larda nima ko'rinishini tekshiring

**Kutilayotgan log'lar:**
- `Error handling webhook:` - xatoliklar
- `Bot not initialized` - token muammosi
- Hech narsa ko'rinmasa - function chaqirilmayapti

---

## 🔐 3. Environment Variables Tekshirish

### Vercel Dashboard > Settings > Environment Variables:

Quyidagi variables mavjudligini tekshiring:

```
TELEGRAM_BOT_TOKEN=7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM
MINI_APP_URL=https://localmarket-telegram-mini-app-q1vp.vercel.app
```

**Muhim:**
- ✅ Har ikkala variable ham mavjud bo'lishi kerak
- ✅ **Production**, **Preview**, **Development** uchun belgilangan bo'lishi kerak
- ✅ Qo'shgandan keyin **QAYTA DEPLOY** qiling!

---

## 🔄 4. Qayta Deploy Qilish

### Qadam 1: Environment Variables Qo'shing (Agar yo'q bo'lsa)

1. Vercel Dashboard > Settings > Environment Variables
2. Quyidagilarni qo'shing:
   ```
   TELEGRAM_BOT_TOKEN=7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM
   MINI_APP_URL=https://localmarket-telegram-mini-app-q1vp.vercel.app
   ```
3. **Add** tugmasini bosing

### Qadam 2: Redeploy

1. **Deployments** bo'limiga kiring
2. Eng so'nggi deployment'ni oching
3. **...** > **Redeploy** tugmasini bosing
4. 2-3 daqiqa kutib turing

### Qadam 3: Webhook'ni Qayta O'rnatish

```powershell
.\setup-webhook.ps1
```

---

## 🧪 5. Test Qilish

### Qadam 1: Bot'ga /start Yuboring

1. Telegram'da bot'ingizga kiring
2. `/start` buyrug'ini yuboring
3. Xabar kelganligini tekshiring

### Qadam 2: Vercel Logs'ni Ko'ring

1. Vercel Dashboard > Deployments > Functions > `api/telegram-bot` > Logs
2. `/start` yuborgandan keyin log'larda nima ko'rinishini tekshiring

---

## 🐛 6. Keng Tarqalgan Xatolar

### Xatolik 1: "Bot not configured"

**Sabab:** `TELEGRAM_BOT_TOKEN` topilmayapti

**Yechim:**
1. Vercel Dashboard > Settings > Environment Variables
2. `TELEGRAM_BOT_TOKEN` qo'shing
3. Qayta deploy qiling

### Xatolik 2: Function chaqirilmayapti

**Sabab:** Webhook to'g'ri sozlanmagan yoki function deploy bo'lmagan

**Yechim:**
1. Webhook'ni qayta o'rnating: `.\setup-webhook.ps1`
2. Vercel'da function deploy bo'lganligini tekshiring
3. Qayta deploy qiling

### Xatolik 3: Hech narsa ishlamayapti

**Yechim:**
1. Webhook'ni o'chirish va qayta o'rnatish:
   ```powershell
   $BOT_TOKEN = "7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM"
   Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook" -Method Post
   Start-Sleep -Seconds 5
   .\setup-webhook.ps1
   ```

---

## ✅ 7. Tekshirish Ro'yxati

- [ ] Webhook o'rnatilgan (`getWebhookInfo`)
- [ ] Vercel'da `api/telegram-bot` function mavjud
- [ ] Environment variables to'g'ri (`TELEGRAM_BOT_TOKEN`, `MINI_APP_URL`)
- [ ] Vercel'da qayta deploy qilingan
- [ ] Vercel logs'da xatolik yo'q
- [ ] Bot'ga `/start` yuborib test qilingan

---

## 🎯 Eng Tezkor Yechim

Agar hammasi to'g'ri ko'rinayotgan bo'lsa:

1. **Vercel Dashboard > Settings > Environment Variables**
   - `TELEGRAM_BOT_TOKEN` qo'shing (agar yo'q bo'lsa)
   - `MINI_APP_URL` qo'shing (agar yo'q bo'lsa)

2. **Qayta Deploy:**
   - Deployments > ... > Redeploy

3. **Webhook'ni qayta o'rnatish:**
   ```powershell
   .\setup-webhook.ps1
   ```

4. **Test qilish:**
   - Bot'ga `/start` yuboring

---

## 📞 Qo'shimcha Yordam

Agar hali ham ishlamasa:

1. **Vercel logs'ni to'liq ko'ring** (Functions > api/telegram-bot > Logs)
2. **Webhook info'ni qayta tekshiring**
3. **Environment variables'ni qayta tekshiring**
