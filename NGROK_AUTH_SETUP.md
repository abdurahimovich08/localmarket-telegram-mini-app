# Ngrok Authtoken Sozlash

## 1. Ngrok Account Yaratish

1. https://dashboard.ngrok.com/signup ga kiring
2. Email va parol bilan ro'yxatdan o'ting (bepul)
3. Email'ingizni tasdiqlang

## 2. Authtoken Olish

1. Login qiling: https://dashboard.ngrok.com/login
2. Dashboard'ga kiring
3. **Get Started** yoki **Your Authtoken** bo'limiga kiring
4. Authtoken'ni ko'chiring (masalan: `2abc123def456ghi789jkl012mno345pq_6R7S8T9U0V1W2X3Y4Z5A6B7C`)

## 3. Authtoken'ni O'rnatish

Terminal'da (PowerShell):

```powershell
npx ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

Yoki agar ngrok o'rnatilgan bo'lsa:

```powershell
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

**Masalan:**
```powershell
npx ngrok config add-authtoken 2abc123def456ghi789jkl012mno345pq_6R7S8T9U0V1W2X3Y4Z5A6B7C
```

## 4. Tekshirish

Authtoken o'rnatilgandan keyin, ngrok'ni ishga tushirish mumkin:

```powershell
npx ngrok http 3001
```

Endi xatolik bo'lmasligi kerak!
