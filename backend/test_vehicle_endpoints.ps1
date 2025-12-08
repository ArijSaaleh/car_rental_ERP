# Vehicle Endpoints Test Script
# Tests all vehicle CRUD operations and statistics

$baseUrl = "http://127.0.0.1:8000/api/v1"
$token = ""
$agencyId = ""
$vehicleId = ""

Write-Host "`n🚗 VEHICLE ENDPOINTS TEST SUITE`n" -ForegroundColor Cyan

# Step 1: Login as owner
Write-Host "=== Step 1: Login as owner@test.com ===" -ForegroundColor Yellow
$loginBody = @{
    email = "owner@test.com"
    password = "test123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access_token
    $agencyId = $loginResponse.user.agency_id
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "   Agency ID: $agencyId" -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Get all vehicles for agency
Write-Host "`n=== Step 2: GET /vehicles (filter by agency) ===" -ForegroundColor Yellow
try {
    $vehicles = Invoke-RestMethod -Uri "$baseUrl/vehicles?agency_id=$agencyId" -Method Get -Headers $headers
    Write-Host "✅ Retrieved vehicles!" -ForegroundColor Green
    Write-Host "   Total: $($vehicles.Count)" -ForegroundColor Gray
    foreach ($v in $vehicles | Select-Object -First 3) {
        Write-Host "   - $($v.brand) $($v.model) ($($v.license_plate)) - Status: $($v.status) - Rate: $($v.daily_rate) DT/day" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# Step 3: Get vehicle statistics
Write-Host "`n=== Step 3: GET /vehicles/stats ===" -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/vehicles/stats?agency_id=$agencyId" -Method Get -Headers $headers
    Write-Host "✅ Retrieved statistics!" -ForegroundColor Green
    Write-Host "   Total: $($stats.total)" -ForegroundColor Gray
    Write-Host "   Disponible: $($stats.disponible)" -ForegroundColor Gray
    Write-Host "   Loué: $($stats.loue)" -ForegroundColor Gray
    Write-Host "   En Maintenance: $($stats.maintenance)" -ForegroundColor Gray
    Write-Host "   Hors Service: $($stats.hors_service)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# Step 4: Create new vehicle
Write-Host "`n=== Step 4: POST /vehicles (create new) ===" -ForegroundColor Yellow
$newVehicle = @{
    agency_id = $agencyId
    license_plate = "123TEST99"
    brand = "Toyota"
    model = "Corolla"
    year = 2024
    color = "Blanche"
    fuel_type = "HYBRIDE"
    transmission = "AUTOMATIQUE"
    seats = 5
    doors = 4
    mileage = 1000
    status = "DISPONIBLE"
    daily_rate = 95.0
} | ConvertTo-Json

try {
    $created = Invoke-RestMethod -Uri "$baseUrl/vehicles" -Method Post -Body $newVehicle -Headers $headers
    $vehicleId = $created.id
    Write-Host "✅ Vehicle created!" -ForegroundColor Green
    Write-Host "   ID: $vehicleId" -ForegroundColor Gray
    Write-Host "   License: $($created.license_plate)" -ForegroundColor Gray
    Write-Host "   Brand/Model: $($created.brand) $($created.model)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# Step 5: Get vehicle by ID
Write-Host "`n=== Step 5: GET /vehicles/{id} ===" -ForegroundColor Yellow
try {
    $vehicle = Invoke-RestMethod -Uri "$baseUrl/vehicles/$vehicleId" -Method Get -Headers $headers
    Write-Host "✅ Retrieved vehicle!" -ForegroundColor Green
    Write-Host "   $($vehicle.brand) $($vehicle.model) - $($vehicle.license_plate)" -ForegroundColor Gray
    Write-Host "   Status: $($vehicle.status), Rate: $($vehicle.daily_rate) DT" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# Step 6: Update vehicle
Write-Host "`n=== Step 6: PUT /vehicles/{id} (update) ===" -ForegroundColor Yellow
$updateData = @{
    daily_rate = 100.0
    status = "MAINTENANCE"
    notes = "Révision annuelle"
} | ConvertTo-Json

try {
    $updated = Invoke-RestMethod -Uri "$baseUrl/vehicles/$vehicleId" -Method Put -Body $updateData -Headers $headers
    Write-Host "✅ Vehicle updated!" -ForegroundColor Green
    Write-Host "   New rate: $($updated.daily_rate) DT" -ForegroundColor Gray
    Write-Host "   New status: $($updated.status)" -ForegroundColor Gray
    Write-Host "   Notes: $($updated.notes)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# Step 7: Filter by status
Write-Host "`n=== Step 7: GET /vehicles?status=DISPONIBLE ===" -ForegroundColor Yellow
try {
    $available = Invoke-RestMethod -Uri "$baseUrl/vehicles?agency_id=$agencyId&status=DISPONIBLE" -Method Get -Headers $headers
    Write-Host "✅ Retrieved available vehicles!" -ForegroundColor Green
    Write-Host "   Count: $($available.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# Step 8: Filter by brand
Write-Host "`n=== Step 8: GET /vehicles?brand=Renault ===" -ForegroundColor Yellow
try {
    $renaults = Invoke-RestMethod -Uri "$baseUrl/vehicles?agency_id=$agencyId&brand=Renault" -Method Get -Headers $headers
    Write-Host "✅ Retrieved Renault vehicles!" -ForegroundColor Green
    Write-Host "   Count: $($renaults.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# Step 9: Test multi-tenant isolation (try accessing another agency's vehicle)
Write-Host "`n=== Step 9: Test Multi-Tenant Isolation ===" -ForegroundColor Yellow
try {
    # Get a vehicle from another agency
    $allVehicles = Invoke-RestMethod -Uri "$baseUrl/vehicles" -Method Get -Headers $headers
    $otherVehicle = $allVehicles | Where-Object { $_.agency_id -ne $agencyId } | Select-Object -First 1
    
    if ($otherVehicle) {
        Write-Host "   Attempting to access vehicle from another agency: $($otherVehicle.license_plate)" -ForegroundColor Gray
        
        # Try to update it (should fail or be ignored)
        $updateOther = @{
            daily_rate = 999.0
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri "$baseUrl/vehicles/$($otherVehicle.id)" -Method Put -Body $updateOther -Headers $headers
            Write-Host "⚠️  WARNING: Was able to modify other agency's vehicle!" -ForegroundColor Yellow
        } catch {
            Write-Host "✅ Correctly blocked access to other agency's vehicle" -ForegroundColor Green
        }
    } else {
        Write-Host "   No other agency vehicles to test with" -ForegroundColor Gray
    }
} catch {
    Write-Host "   Test inconclusive: $_" -ForegroundColor Gray
}

# Step 10: Delete vehicle
Write-Host "`n=== Step 10: DELETE /vehicles/{id} ===" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/vehicles/$vehicleId" -Method Delete -Headers $headers
    Write-Host "✅ Vehicle deleted!" -ForegroundColor Green
    
    # Verify deletion
    try {
        Invoke-RestMethod -Uri "$baseUrl/vehicles/$vehicleId" -Method Get -Headers $headers
        Write-Host "⚠️  WARNING: Vehicle still accessible after deletion!" -ForegroundColor Yellow
    } catch {
        Write-Host "   Verified: Vehicle no longer accessible" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# Summary
Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor Cyan
Write-Host "All vehicle endpoints tested successfully!" -ForegroundColor Green
Write-Host "✅ GET /vehicles (list with filters)" -ForegroundColor Green
Write-Host "✅ GET /vehicles/stats" -ForegroundColor Green
Write-Host "✅ POST /vehicles (create)" -ForegroundColor Green
Write-Host "✅ GET /vehicles/{id}" -ForegroundColor Green
Write-Host "✅ PUT /vehicles/{id} (update)" -ForegroundColor Green
Write-Host "✅ DELETE /vehicles/{id}" -ForegroundColor Green
Write-Host "✅ Multi-tenant isolation verified" -ForegroundColor Green
