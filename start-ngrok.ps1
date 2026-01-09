# Ngrok ishga tushirish script
# Bu script ngrok'ni npx orqali ishga tushiradi (o'rnatish talab qilmaydi)

Write-Host "🚀 Ngrok ishga tushmoqda..." -ForegroundColor Green
Write-Host "⚠️  Development server ishlamoqdaligini tekshiring!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Vite development server odatda 5173 portida ishlaydi." -ForegroundColor Cyan
Write-Host "Agar boshqa port bo'lsa, script'ni to'xtating va portni o'zgartiring." -ForegroundColor Cyan
Write-Host ""

# Vite default port (agar 3000 band bo'lsa, 3001 bo'lishi mumkin)
$port = 3001

# Portni tekshirish
Write-Host "Port $port ishlatilmoqda..." -ForegroundColor Cyan
Write-Host "Agar boshqa port bo'lsa, Ctrl+C bosing va script'ni tahrirlang." -ForegroundColor Yellow

# npx orqali ngrok ishga tushirish
Write-Host "Ngrok'ni $port portiga ulashmoqda..." -ForegroundColor Green
npx ngrok@latest http $port
