# PowerShell script to set Telegram webhook for Vercel deployment
# Run this after deploying to Vercel

$VERCEL_URL = "https://localmarket-telegram-mini-app-q1vp.vercel.app"
$WEBHOOK_URL = "$VERCEL_URL/api/telegram-bot"

Write-Host "🔗 Telegram Bot Webhook Sozlash" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vercel URL: $VERCEL_URL" -ForegroundColor Yellow
Write-Host "Webhook URL: $WEBHOOK_URL" -ForegroundColor Yellow
Write-Host ""

# Get bot token from environment or ask user
$BOT_TOKEN = $env:TELEGRAM_BOT_TOKEN
if (-not $BOT_TOKEN) {
    $BOT_TOKEN = $env:VITE_TELEGRAM_BOT_TOKEN
}
if (-not $BOT_TOKEN) {
    Write-Host "⚠️  TELEGRAM_BOT_TOKEN topilmadi!" -ForegroundColor Red
    Write-Host ""
    $BOT_TOKEN = Read-Host "Bot token'ni kiriting (yoki .env faylidan o'qing)"
}

if (-not $BOT_TOKEN) {
    Write-Host "❌ Bot token kiritilmadi. Script to'xtatildi." -ForegroundColor Red
    exit 1
}

Write-Host "📡 Webhook o'rnatilmoqda..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=$([System.Web.HttpUtility]::UrlEncode($WEBHOOK_URL))" -Method Post
    
    if ($response.ok) {
        Write-Host "✅ Webhook muvaffaqiyatli o'rnatildi!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Webhook URL: $WEBHOOK_URL" -ForegroundColor Cyan
        Write-Host "Description: $($response.description)" -ForegroundColor Cyan
        Write-Host ""
        
        # Check webhook info
        Write-Host "🔍 Webhook ma'lumotlarini tekshirish..." -ForegroundColor Yellow
        $info = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
        
        Write-Host ""
        Write-Host "Webhook Info:" -ForegroundColor Cyan
        Write-Host "  URL: $($info.result.url)" -ForegroundColor White
        Write-Host "  Pending updates: $($info.result.pending_update_count)" -ForegroundColor White
        if ($info.result.last_error_date) {
            Write-Host "  ⚠️  Last error: $($info.result.last_error_message)" -ForegroundColor Red
        } else {
            Write-Host "  ✅ No errors" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Xatolik: $($response.description)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Xatolik yuz berdi:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Tugadi! Endi bot'ga /start yuborib test qiling." -ForegroundColor Green
