# Test enhanced hierarchy features
Write-Host "🚀 Testing Enhanced Agency Hierarchy Features" -ForegroundColor Cyan
Write-Host "=" * 70

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

# Test branch creation with BASIQUE plan (should fail)
Write-Host "`n2️⃣ Test branch creation restriction (BASIQUE plan)..." -ForegroundColor Yellow
try {
    # Get main agency ID
    $agencies = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/proprietaire/agencies' -Headers $headers
    $mainAgency = $agencies | Where-Object { $_.is_main -eq $true } | Select-Object -First 1
    
    if ($mainAgency.subscription_plan -eq 'basique') {
        Write-Host "  Main agency plan: $($mainAgency.subscription_plan)" -ForegroundColor Cyan
        
        # Try to create branch (should fail)
        $branchData = @{
            name = "Test Branch"
            legal_name = "Test Branch SARL"
            tax_id = "TB999999"
            email = "testbranch@test.tn"
            phone = "+216 99 999 999"
            address = "Test Address"
            city = "Test City"
            country = "Tunisia"
            parent_agency_id = $mainAgency.id
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/proprietaire/agencies' `
                -Method Post `
                -Body $branchData `
                -Headers $headers `
                -ContentType 'application/json'
            Write-Host "  ❌ FAIL: Branch created despite BASIQUE plan!" -ForegroundColor Red
        } catch {
            $errorMsg = $_.ErrorDetails.Message | ConvertFrom-Json
            if ($errorMsg.detail -like "*ne permet pas*") {
                Write-Host "  ✅ Correctly blocked: $($errorMsg.detail)" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️ Error but wrong message: $($errorMsg.detail)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  ⚠️ Main agency is not BASIQUE, skipping test" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Test failed: $_" -ForegroundColor Red
}

# Test consolidated statistics
Write-Host "`n3️⃣ Test consolidated statistics endpoint..." -ForegroundColor Yellow
try {
    $agencies = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/proprietaire/agencies' -Headers $headers
    $mainAgency = $agencies | Where-Object { $_.is_main -eq $true } | Select-Object -First 1
    
    if ($mainAgency) {
        $consolidatedStats = Invoke-RestMethod `
            -Uri "http://127.0.0.1:8000/api/v1/proprietaire/agencies/$($mainAgency.id)/consolidated-stats" `
            -Headers $headers
        
        Write-Host "  ✅ Consolidated stats retrieved:" -ForegroundColor Green
        Write-Host "    Main Agency: $($consolidatedStats.main_agency_name)" -ForegroundColor Cyan
        Write-Host "    Branch Count: $($consolidatedStats.branch_count)" -ForegroundColor Cyan
        Write-Host "    Total Users: $($consolidatedStats.total_users)" -ForegroundColor Cyan
        Write-Host "    Total Vehicles: $($consolidatedStats.total_vehicles)" -ForegroundColor Cyan
        Write-Host "    Total Customers: $($consolidatedStats.total_customers)" -ForegroundColor Cyan
        Write-Host "    Total Revenue: $($consolidatedStats.total_revenue) TND" -ForegroundColor Cyan
    } else {
        Write-Host "  ⚠️ No main agency found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Failed: $_" -ForegroundColor Red
}

# Verify hierarchy in response
Write-Host "`n4️⃣ Verify hierarchy fields in API response..." -ForegroundColor Yellow
try {
    $agencies = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/proprietaire/agencies' -Headers $headers
    
    Write-Host "  ✅ Agency hierarchy:" -ForegroundColor Green
    foreach ($agency in $agencies) {
        $type = if ($agency.is_main) { "[MAIN]" } else { "[BRANCH]" }
        $parent = if ($agency.parent_agency_id) { " (parent: $($agency.parent_agency_id))" } else { "" }
        $branches = if ($agency.branch_count -gt 0) { " - $($agency.branch_count) branches" } else { "" }
        Write-Host "    $type $($agency.name)$branches$parent" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ Failed: $_" -ForegroundColor Red
}

# Test admin stats endpoint
Write-Host "`n5️⃣ Test admin stats endpoint (hierarchy aware)..." -ForegroundColor Yellow
try {
    # Need admin token for this
    $adminLoginBody = @{
        email = 'admin@system.com'
        password = 'admin123'
    } | ConvertTo-Json
    
    try {
        $adminResponse = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/auth/login' `
            -Method Post `
            -Body $adminLoginBody `
            -ContentType 'application/json'
        
        $adminHeaders = @{
            Authorization = "Bearer $($adminResponse.access_token)"
        }
        
        $adminStats = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/admin/stats' -Headers $adminHeaders
        
        Write-Host "  ✅ Admin stats retrieved:" -ForegroundColor Green
        Write-Host "    Total Agencies: $($adminStats.total_agencies)" -ForegroundColor Cyan
        Write-Host "    Active Agencies: $($adminStats.active_agencies)" -ForegroundColor Cyan
        
        $mainAgencies = ($adminStats.agencies | Where-Object { $_.is_main -eq $true }).Count
        $branches = ($adminStats.agencies | Where-Object { $_.is_main -eq $false }).Count
        Write-Host "    Main Agencies: $mainAgencies" -ForegroundColor Cyan
        Write-Host "    Branches: $branches" -ForegroundColor Cyan
    } catch {
        Write-Host "  ⚠️ Admin login failed (may not exist yet): $_" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️ Admin test skipped" -ForegroundColor Yellow
}

Write-Host "`n" + ("=" * 70)
Write-Host "🎉 Enhanced hierarchy tests completed!" -ForegroundColor Green
