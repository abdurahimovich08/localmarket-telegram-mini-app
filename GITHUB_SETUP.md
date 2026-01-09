# GitHub'ga Push Qilish - Qadamlar

## ⚠️ Muhim: Avval GitHub'da Repo Yarating!

### 1️⃣ GitHub'da Repo Yaratish

1. **https://github.com** ga kiring
2. Login qiling
3. **"+"** tugmasini bosing (yuqori o'ng burchakda)
4. **"New repository"** ni tanlang
5. **Repository name:** `localmarket-telegram-mini-app`
6. **Description:** (ixtiyoriy) `Telegram Mini App for LocalMarket`
7. **Public** yoki **Private** tanlang
8. **❌ "Initialize with README" ni BELGILAMANG** (loyiha allaqachon mavjud)
9. **"Create repository"** tugmasini bosing

### 2️⃣ GitHub URL'ni Olish

Repo yaratilgandan keyin, GitHub sizga URL ko'rsatadi:

**Masalan:**
```
https://github.com/YOUR_GITHUB_USERNAME/localmarket-telegram-mini-app.git
```

**YOUR_GITHUB_USERNAME** o'rniga sizning haqiqiy GitHub username'ingiz bo'ladi.

**Masalan:** Agar username'ingiz `johnsmith` bo'lsa:
```
https://github.com/johnsmith/localmarket-telegram-mini-app.git
```

### 3️⃣ Git Remote'ni Sozlash

Terminal'da:

**Agar oldin remote qo'shilgan bo'lsa, o'chirish:**
```powershell
git remote remove origin
```

**Keyin yangi remote qo'shing:**
```powershell
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/localmarket-telegram-mini-app.git
```

*(YOUR_GITHUB_USERNAME o'rniga haqiqiy username'ingizni yozing!)*

### 4️⃣ Push Qilish

```powershell
git branch -M main
git push -u origin main
```

---

## 🔍 GitHub Username'ni Qanday Topish?

1. GitHub'ga login qiling
2. Profil rasmingizni bosing (yuqori o'ng burchak)
3. URL'da username ko'rinadi: `https://github.com/USERNAME`
4. Yoki repo yaratganda URL'da ko'rsatiladi

---

## ✅ Tekshirish

Push muvaffaqiyatli bo'lsa, quyidagi ko'rinadi:

```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
Writing objects: 100% (X/X), done.
To https://github.com/YOUR_USERNAME/localmarket-telegram-mini-app.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## 🆘 Muammo Bo'lsa?

- GitHub'da repo yaratganingizni tekshiring
- Username to'g'ri ekanligini tekshiring
- Repo nomi to'g'ri ekanligini tekshiring
