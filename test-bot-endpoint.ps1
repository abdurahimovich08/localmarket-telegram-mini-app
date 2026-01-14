# Test Bot Endpoint - Vercel Function Test
# Bu script Vercel'da bot function'ni to'g'ridan-to'g'ri test qiladi

$VERCEL_URL = "https://localmarket-telegram-mini-app-q1vp.vercel.app"
$ENDPOINT = "$VERCEL_URL/api/telegram-bot"

Write-Host "🧪 Bot Endpoint'ni Test Qilish" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint: $ENDPOINT" -ForegroundColor Yellow
Write-Host ""

# Test 1: GET request (Method not allowed bo'lishi kerak)
Write-Host "Test 1: GET request (Method not allowed bo'lishi kerak)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $ENDPOINT -Method Get -ErrorAction Stop
    Write-Host "❌ Xatolik: GET request qabul qilindi (qabul qilinmasligi kerak edi)" -ForegroundColor Red
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 405) {
        Write-Host "✅ To'g'ri: GET request rad etildi (405 Method Not Allowed)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Kutilmagan xatolik: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 2: POST request (Telegram webhook formatida)
Write-Host "Test 2: POST request (Telegram webhook formatida)..." -ForegroundColor Yellow

# Telegram webhook update formatida test data
$testUpdate = @{
    update_id = 123456789
    message = @{
        message_id = 1
        from = @{
            id = 123456789
            is_bot = $false
            first_name = "Test"
            username = "testuser"
        }
        chat = @{
            id = 123456789
            type = "private"
        }
        date = [int](Get-Date -UFormat %s)
        text = "/start"
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri $ENDPOINT -Method Post -Body $testUpdate -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ POST request muvaffaqiyatli!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Xatolik: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📝 Eslatma:" -ForegroundColor Yellow
Write-Host "Agar function ishlamasa, Vercel Dashboard'da:" -ForegroundColor White
Write-Host "1. Deployments > Functions > api/telegram-bot" -ForegroundColor White
Write-Host "2. Logs'ni ko'ring" -ForegroundColor White
Write-Host "3. Environment variables'ni tekshiring" -ForegroundColor White
