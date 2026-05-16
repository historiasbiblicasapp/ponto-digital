# Script para criar usuários no GoTrue (auth) via Admin API
# Uso: powershell -File supabase/seed-users.ps1
# Requer: Supabase local rodando (supabase start)

$API_URL = "http://127.0.0.1:54321"
$SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

$headers = @{
    "Content-Type" = "application/json"
    "apikey" = $SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
}

$users = @(
    @{ email = "admin@empresa.com";  password = "admin123" }
    @{ email = "joao@empresa.com";   password = "123456" }
    @{ email = "maria@empresa.com";  password = "123456" }
    @{ email = "carlos@empresa.com"; password = "123456" }
)

Write-Host "=== Criando usuarios no GoTrue Auth ==="

foreach ($u in $users) {
    $body = ($u + @{ email_confirm = $true }) | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri "$API_URL/auth/v1/admin/users" `
            -Method Post -Body $body -Headers $headers -ContentType "application/json"
        Write-Host "  [OK] $($u.email) -> id: $($result.id)" -ForegroundColor Green
    } catch {
        $err = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($err.code -eq "422" -or $err.message -like "*already exists*") {
            Write-Host "  [SKIP] $($u.email) ja existe" -ForegroundColor Yellow
        } else {
            Write-Host "  [ERR] $($u.email): $($err.msg)" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Atualizando auth_user_id nos funcionarios ==="
& "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe" exec -i supabase_db_lqedqdervqxfhmzzqlcc psql -U postgres -d postgres -c "UPDATE public.funcionarios f SET auth_user_id = u.id FROM auth.users u WHERE f.email = u.email AND f.email LIKE '%@empresa.com';"

Write-Host "`n=== Pronto! ==="
