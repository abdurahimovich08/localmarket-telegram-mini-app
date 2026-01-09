# Ngrok Tunnel Ishga Tushirish
# Development server 3001 portida ishlayapti

Write-Host "=== Ngrok Tunnel Ishga Tushirish ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Development server 3001 portida ishlab turganini tekshiring!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Eslatmalar:" -ForegroundColor White
Write-Host "- Tunnel ishga tushgandan keyin HTTPS URL ko'rinadi" -ForegroundColor Gray
Write-Host "- Bu URL'ni BotFather'da Mini App URL sifatida ishlatishingiz mumkin" -ForegroundColor Gray
Write-Host "- Tunnel'ni to'xtatish uchun Ctrl+C bosing" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Tunnel ishga tushmoqda..." -ForegroundColor Green
Write-Host ""

# Ngrok'ni ishga tushirish
npx ngrok@latest http 3001
