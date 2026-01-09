# Ngrok'ni ishga tushirish (3001 port)
# Bu script ngrok'ni ishga tushiradi va URL'ni ko'rsatadi

Write-Host "🚀 Ngrok ishga tushmoqda..." -ForegroundColor Green
Write-Host "Port: 3001 (Development server)" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  URL ko'rinishini kutib turing..." -ForegroundColor Yellow
Write-Host ""

npx ngrok@latest http 3001
