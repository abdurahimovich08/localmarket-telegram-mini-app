# Ngrok Authtoken Sozlash Script

Write-Host "=== Ngrok Authtoken Sozlash ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Avval ngrok account yarating: https://dashboard.ngrok.com/signup" -ForegroundColor Yellow
Write-Host "2. Login qiling: https://dashboard.ngrok.com/login" -ForegroundColor Yellow
Write-Host "3. Dashboard'dan authtoken'ni oling" -ForegroundColor Yellow
Write-Host ""

Write-Host "Authtoken'ni qanday topish:" -ForegroundColor Cyan
Write-Host "1. https://dashboard.ngrok.com/get-started/your-authtoken ga kiring" -ForegroundColor White
Write-Host "2. Authtoken'ni TO'LIQ ko'chiring (uzun qator, harf va raqamlar)" -ForegroundColor White
Write-Host "3. Bu yerda yopishtiring (Ctrl+V)" -ForegroundColor White
Write-Host ""
Write-Host "Authtoken odatda quyidagicha ko'rinadi:" -ForegroundColor Yellow
Write-Host "2abc123def456ghi789jkl012mno345pq_6R7S8T9U0V1W2X3Y4Z5A6B7C" -ForegroundColor Gray
Write-Host ""

$authtoken = Read-Host "Authtoken'ni kiriting (yopishtirib qo'ying)"

# Bo'sh joylarni olib tashlash
$authtoken = $authtoken.Trim()

if ($authtoken -eq "") {
    Write-Host "❌ Authtoken kiritilmadi!" -ForegroundColor Red
    exit
}

# Authtoken formatini tekshirish (odatda kamida 40 ta belgi)
if ($authtoken.Length -lt 20) {
    Write-Host "⚠️  Eslatma: Authtoken juda qisqa ko'rinadi. To'liq authtoken'ni kiritganingizni tekshiring." -ForegroundColor Yellow
    $continue = Read-Host "Davom etasizmi? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit
    }
}

Write-Host ""
Write-Host "Authtoken o'rnatilmoqda..." -ForegroundColor Green

# npx orqali authtoken'ni o'rnatish
npx ngrok@latest config add-authtoken $authtoken

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Authtoken muvaffaqiyatli o'rnatildi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Endi ngrok'ni ishga tushirishingiz mumkin:" -ForegroundColor Cyan
    Write-Host "  npx ngrok@latest http 3001" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Xatolik yuz berdi!" -ForegroundColor Red
    Write-Host "Authtoken'ni to'g'ri kiritganingizni tekshiring." -ForegroundColor Yellow
}
