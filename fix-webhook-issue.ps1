# Webhook Muammosini Hal Qilish Script
# Bu script webhook'ni to'liq qayta sozlaydi

$BOT_TOKEN = "7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM"
$WEBHOOK_URL = "https://localmarket-telegram-mini-app-q1vp.vercel.app/api/telegram-bot"

Write-Host "🔧 Webhook Muammosini Hal Qilish" -ForegroundColor Cyan
Write-Host ""

# Qadam 1: Webhook'ni o'chirish
Write-Host "Qadam 1: Eski webhook'ni o'chirish..." -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook" -Method Post
    if ($deleteResponse.ok) {
        Write-Host "✅ Webhook o'chirildi" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Webhook o'chirishda xatolik (ehtimol allaqachon o'chirilgan): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Start-Sleep -Seconds 2

# Qadam 2: Pending updates'ni o'chirish
Write-Host "Qadam 2: Pending updates'ni o'chirish..." -ForegroundColor Yellow
try {
    $dropResponse = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook?drop_pending_updates=true" -Method Post
    if ($dropResponse.ok) {
        Write-Host "✅ Pending updates o'chirildi" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Pending updates o'chirishda xatolik: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Start-Sleep -Seconds 2

# Qadam 3: Webhook'ni qayta o'rnatish
Write-Host "Qadam 3: Webhook'ni qayta o'rnatish..." -ForegroundColor Yellow
Add-Type -AssemblyName System.Web
$encodedUrl = [System.Web.HttpUtility]::UrlEncode($WEBHOOK_URL)

try {
    $setResponse = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=$encodedUrl" -Method Post
    if ($setResponse.ok) {
        Write-Host "✅ Webhook muvaffaqiyatli o'rnatildi!" -ForegroundColor Green
        Write-Host "   URL: $WEBHOOK_URL" -ForegroundColor Cyan
        Write-Host "   Description: $($setResponse.description)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Webhook o'rnatishda xatolik: $($setResponse.description)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Xatolik: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# Qadam 4: Webhook holatini tekshirish
Write-Host "Qadam 4: Webhook holatini tekshirish..." -ForegroundColor Yellow
try {
    $info = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
    Write-Host ""
    Write-Host "Webhook Holati:" -ForegroundColor Cyan
    Write-Host "  URL: $($info.result.url)" -ForegroundColor White
    Write-Host "  Pending updates: $($info.result.pending_update_count)" -ForegroundColor $(if ($info.result.pending_update_count -gt 0) { "Red" } else { "Green" })
    
    if ($info.result.last_error_date) {
        Write-Host "  ⚠️  Last error: $($info.result.last_error_message)" -ForegroundColor Red
        Write-Host "  Error date: $($info.result.last_error_date)" -ForegroundColor Red
    } else {
        Write-Host "  ✅ No errors" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Webhook info olishda xatolik: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Keyingi Qadamlar:" -ForegroundColor Yellow
Write-Host "1. Bot'ga /start yuboring" -ForegroundColor White
Write-Host "2. Vercel Dashboard > Functions > api/telegram-bot > Logs'ni ko'ring" -ForegroundColor White
Write-Host "3. Agar hali ham ishlamasa, Vercel'da function deploy bo'lganligini tekshiring" -ForegroundColor White
