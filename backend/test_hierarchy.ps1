# Test all proprietaire endpoints after hierarchy implementation
Write-Host "🧪 Testing Proprietaire Endpoints with Agency Hierarchy" -ForegroundColor Cyan
Write-Host "=" * 60

# Login
Write-Host "`n1️⃣ Login..." -ForegroundColor Yellow
$loginBody = @{
    email = 'owner@test.com'
    password = 'test123'
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/auth/login' `
        -Method Post `
        -Body $loginBody `
        -ContentType 'application/json'
    
    $token = $loginResponse.access_token
    $headers = @{
        Authorization = "Bearer $token"
    }
    Write-Host "✅ Login successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test /proprietaire/agencies
Write-Host "`n2️⃣ GET /proprietaire/agencies..." -ForegroundColor Yellow
try {
    $agencies = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/proprietaire/agencies' `
        -Headers $headers
    
    Write-Host "✅ Found $($agencies.Count) agencies" -ForegroundColor Green
    
    foreach ($agency in $agencies) {
        $type = if ($agency.is_main) { "MAIN" } else { "BRANCH" }
        $branches = if ($agency.branch_count -gt 0) { " ($($agency.branch_count) branches)" } else { "" }
        Write-Host "  - [$type] $($agency.name)$branches" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# Test /proprietaire/statistics
Write-Host "`n3️⃣ GET /proprietaire/statistics..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/proprietaire/statistics' `
        -Headers $headers
    
    Write-Host "✅ Statistics retrieved:" -ForegroundColor Green
    Write-Host "  Total Agencies: $($stats.total_agencies)" -ForegroundColor Cyan
    Write-Host "  Active Agencies: $($stats.active_agencies)" -ForegroundColor Cyan
    Write-Host "  Total Users: $($stats.total_users)" -ForegroundColor Cyan
    Write-Host "  Total Vehicles: $($stats.total_vehicles)" -ForegroundColor Cyan
    Write-Host "  Total Customers: $($stats.total_customers)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# Test /proprietaire/employees
Write-Host "`n4️⃣ GET /users (employees)..." -ForegroundColor Yellow
try {
    $employees = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/users' `
        -Headers $headers
    
    Write-Host "✅ Found $($employees.Count) employees" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Endpoint may not exist or requires different path" -ForegroundColor Yellow
}

# Test /proprietaire/vehicles
Write-Host "`n5️⃣ GET /vehicles..." -ForegroundColor Yellow
try {
    $vehicles = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/vehicles' `
        -Headers $headers
    
    Write-Host "✅ Found $($vehicles.Count) vehicles" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Endpoint may not exist or requires different path" -ForegroundColor Yellow
}

# Test /proprietaire/clients
Write-Host "`n6️⃣ GET /proprietaire/clients..." -ForegroundColor Yellow
try {
    $clients = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/proprietaire/clients' `
        -Headers $headers
    
    Write-Host "✅ Found $($clients.Count) clients" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# Verify database state
Write-Host "`n7️⃣ Verifying Database State..." -ForegroundColor Yellow
Write-Host "  Checking if proprietaire is associated with main agency..." -ForegroundColor Cyan

try {
    $meResponse = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/auth/me' `
        -Headers $headers
    
    if ($meResponse.agency_id) {
        Write-Host "  ✅ Proprietaire associated with agency: $($meResponse.agency_id)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Proprietaire NOT associated with any agency" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Failed to verify: $_" -ForegroundColor Red
}

Write-Host "`n" + ("=" * 60)
Write-Host "🎉 All tests completed!" -ForegroundColor Green
