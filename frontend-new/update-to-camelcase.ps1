# PowerShell script to update frontend to camelCase for NestJS backend

$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse

Write-Host "Found $($files.Count) TSX files to update..." -ForegroundColor Cyan

$fieldReplacements = @{
    '\.full_name' = '.fullName'
    '\.agency_id' = '.agencyId'
    '\.parent_agency_id' = '.parentAgencyId'
    '\.license_plate' = '.licensePlate'
    '\.booking_number' = '.bookingNumber'
    '\.created_at' = '.createdAt'
    '\.updated_at' = '.updatedAt'
    '\.last_login' = '.lastLogin'
    '\.is_active' = '.isActive'
    '\.is_verified' = '.isVerified'
    '\.fuel_type' = '.fuelType'
    '\.daily_rate' = '.dailyRate'
    '\.deposit_amount' = '.depositAmount'
    '\.start_date' = '.startDate'
    '\.end_date' = '.endDate'
    '\.customer_id' = '.customerId'
    '\.vehicle_id' = '.vehicleId'
    '\.owner_id' = '.ownerId'
    '\.legal_name' = '.legalName'
    '\.tax_id' = '.taxId'
    '\.postal_code' = '.postalCode'
    '\.subscription_plan' = '.subscriptionPlan'
    '\.subscription_status' = '.subscriptionStatus'
    '\.subscription_start_date' = '.subscriptionStartDate'
    '\.subscription_end_date' = '.subscriptionEndDate'
    '\.cin_number' = '.cinNumber'
    '\.license_number' = '.licenseNumber'
    '\.first_name' = '.firstName'
    '\.last_name' = '.lastName'
    'full_name:' = 'fullName:'
    'agency_id:' = 'agencyId:'
    'parent_agency_id:' = 'parentAgencyId:'
    'license_plate:' = 'licensePlate:'
    'created_at:' = 'createdAt:'
    'agency_id\?' = 'agencyId?'
    'agency_id\s*=' = 'agencyId ='
    'owner_full_name' = 'ownerFullName'
}

$enumReplacements = @{
    "role === 'super_admin'" = "role === 'SUPER_ADMIN'"
    "role === 'proprietaire'" = "role === 'PROPRIETAIRE'"
    "role === 'manager'" = "role === 'MANAGER'"
    "role === 'agent_comptoir'" = "role === 'AGENT_COMPTOIR'"
    "role === 'agent_parc'" = "role === 'AGENT_PARC'"
    "role === 'client'" = "role === 'CLIENT'"
    '"super_admin"' = '"SUPER_ADMIN"'
    '"proprietaire"' = '"PROPRIETAIRE"'
    '"manager"' = '"MANAGER"'
    '"agent_comptoir"' = '"AGENT_COMPTOIR"'
    '"agent_parc"' = '"AGENT_PARC"'
    '"client"' = '"CLIENT"'
    "'super_admin'" = "'SUPER_ADMIN'"
    "'proprietaire'" = "'PROPRIETAIRE'"
    "'manager'" = "'MANAGER'"
    "'agent_comptoir'" = "'AGENT_COMPTOIR'"
    "'agent_parc'" = "'AGENT_PARC'"
    "'client'" = "'CLIENT'"
    "status === 'disponible'" = "status === 'DISPONIBLE'"
    "status === 'loue'" = "status === 'LOUE'"
    "status === 'maintenance'" = "status === 'MAINTENANCE'"
    "status === 'hors_service'" = "status === 'HORS_SERVICE'"
    '"disponible"' = '"DISPONIBLE"'
    '"loue"' = '"LOUE"'
    '"maintenance"' = '"MAINTENANCE"'
    '"hors_service"' = '"HORS_SERVICE"'
    "'disponible'" = "'DISPONIBLE'"
    "'loue'" = "'LOUE'"
    "'maintenance'" = "'MAINTENANCE'"
    "'hors_service'" = "'HORS_SERVICE'"
    '"essence"' = '"ESSENCE"'
    '"diesel"' = '"DIESEL"'
    '"electrique"' = '"ELECTRIQUE"'
    '"hybride"' = '"HYBRIDE"'
    "'essence'" = "'ESSENCE'"
    "'diesel'" = "'DIESEL'"
    "'electrique'" = "'ELECTRIQUE'"
    "'hybride'" = "'HYBRIDE'"
    '"manuelle"' = '"MANUELLE"'
    '"automatique"' = '"AUTOMATIQUE"'
    "'manuelle'" = "'MANUELLE'"
    "'automatique'" = "'AUTOMATIQUE'"
    '"basique"' = '"BASIQUE"'
    '"standard"' = '"STANDARD"'
    '"premium"' = '"PREMIUM"'
    '"entreprise"' = '"ENTREPRISE"'
    "'basique'" = "'BASIQUE'"
    "'standard'" = "'STANDARD'"
    "'premium'" = "'PREMIUM'"
    "'entreprise'" = "'ENTREPRISE'"
}

$updatedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Apply field replacements
    foreach ($pattern in $fieldReplacements.Keys) {
        $replacement = $fieldReplacements[$pattern]
        $content = $content -replace $pattern, $replacement
    }
    
    # Apply enum replacements
    foreach ($pattern in $enumReplacements.Keys) {
        $replacement = $enumReplacements[$pattern]
        $content = $content -replace [regex]::Escape($pattern), $replacement
    }
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $updatedCount++
        Write-Host "Updated: $($file.FullName.Replace((Get-Location).Path, '.'))" -ForegroundColor Green
    }
}

Write-Host "Completed! Updated $updatedCount files." -ForegroundColor Cyan
