# SupplierApiLiveTester.ps1 - Live HTTP verification of Supplier Management API

$baseUrl = "http://localhost:8089/api"
$testDb = "backend/target/live-supplier-stockpile.db"

Write-Host "=== Stockpile Supplier Management API Live Verification ===" -ForegroundColor Cyan

# 1. Clean up old test db if present
if (Test-Path $testDb) {
    Remove-Item -Force $testDb
}

# 2. Launch backend on port 8089 with isolated db
$env:SERVER_PORT = "8089"
$env:SPRING_DATASOURCE_URL = "jdbc:sqlite:$testDb"

$javaProc = Start-Process -FilePath "C:\Program Files\Java\jdk-26.0.2.1\bin\java.exe" `
    -ArgumentList "-jar", "backend/target/stockpile-backend-0.0.1-SNAPSHOT.jar", "--server.port=8089", "--spring.datasource.url=jdbc:sqlite:$testDb" `
    -PassThru

Write-Host "Started test backend PID: $($javaProc.Id) on port 8089" -ForegroundColor Gray

# Wait for startup
$attempts = 0
$started = $false
while ($attempts -lt 20) {
    Start-Sleep -Milliseconds 600
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 2
        if ($res.status -eq "UP") {
            $started = $true
            break
        }
    } catch {
        # still booting
    }
    $attempts++
}

if (-not $started) {
    Write-Host "FAILED: Backend did not start in time." -ForegroundColor Red
    Stop-Process -Id $javaProc.Id -Force
    exit 1
}

Write-Host "SUCCESS: Backend is UP on port 8089." -ForegroundColor Green

try {
    # 3. Create Full Supplier
    $supplierBody = @{
        name = "ABC Distributors"
        contactPerson = "Rahul"
        phone = "9876543210"
        email = "abc@example.com"
        address = "New Delhi"
        notes = "Electronics supplier"
    } | ConvertTo-Json

    $sup1 = Invoke-RestMethod -Uri "$baseUrl/suppliers" -Method Post -Body $supplierBody -ContentType "application/json"
    if ($sup1.id -and $sup1.name -eq "ABC Distributors") {
        Write-Host "PASS 1: Created supplier: ID $($sup1.id), Name '$($sup1.name)'" -ForegroundColor Green
    } else {
        throw "Failed to create supplier"
    }

    # 4. Create Minimal Supplier
    $minBody = @{ name = "Zenith Wholesale" } | ConvertTo-Json
    $sup2 = Invoke-RestMethod -Uri "$baseUrl/suppliers" -Method Post -Body $minBody -ContentType "application/json"
    if ($sup2.id -and $sup2.name -eq "Zenith Wholesale" -and $null -eq $sup2.contactPerson) {
        Write-Host "PASS 2: Created minimal supplier: ID $($sup2.id), Name '$($sup2.name)'" -ForegroundColor Green
    } else {
        throw "Failed to create minimal supplier"
    }

    # 5. Validation Rejection: Blank Name
    try {
        Invoke-RestMethod -Uri "$baseUrl/suppliers" -Method Post -Body (@{ name = "   " } | ConvertTo-Json) -ContentType "application/json"
        throw "Should have rejected blank name"
    } catch {
        $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        if ($statusCode -eq 400) {
            Write-Host "PASS 3: Rejected blank name with HTTP 400" -ForegroundColor Green
        } else {
            throw "Expected 400 for blank name, got $statusCode ($($_.Exception.Message))"
        }
    }

    # 6. Validation Rejection: Invalid Email
    try {
        Invoke-RestMethod -Uri "$baseUrl/suppliers" -Method Post -Body (@{ name = "Test"; email = "not-an-email" } | ConvertTo-Json) -ContentType "application/json"
        throw "Should have rejected invalid email"
    } catch {
        $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        if ($statusCode -eq 400) {
            Write-Host "PASS 4: Rejected invalid email format with HTTP 400" -ForegroundColor Green
        } else {
            throw "Expected 400 for invalid email, got $statusCode ($($_.Exception.Message))"
        }
    }

    # 7. List and Search Suppliers
    $allSuppliers = Invoke-RestMethod -Uri "$baseUrl/suppliers" -Method Get
    if ($allSuppliers.Count -eq 2) {
        Write-Host "PASS 5: Listed all suppliers (count = 2)" -ForegroundColor Green
    } else {
        throw "Expected 2 suppliers, got $($allSuppliers.Count)"
    }

    $searched = Invoke-RestMethod -Uri "$baseUrl/suppliers?search=ABC" -Method Get
    if ($searched.Count -eq 1 -and $searched[0].name -eq "ABC Distributors") {
        Write-Host "PASS 6: Search by name matched 'ABC Distributors'" -ForegroundColor Green
    } else {
        throw "Search failed"
    }

    # 8. Get Supplier by ID
    $fetched = Invoke-RestMethod -Uri "$baseUrl/suppliers/$($sup1.id)" -Method Get
    if ($fetched.id -eq $sup1.id -and $fetched.email -eq "abc@example.com") {
        Write-Host "PASS 7: Retrieved supplier by ID" -ForegroundColor Green
    } else {
        throw "Failed to get supplier by ID"
    }

    # 9. Update Supplier
    $updateBody = @{
        name = "ABC Distributors Global"
        contactPerson = "Rahul Sharma"
        phone = "+91 9876543210"
        email = "rahul@abcglobal.com"
        address = "Noida"
        notes = "Updated notes"
    } | ConvertTo-Json
    $updated = Invoke-RestMethod -Uri "$baseUrl/suppliers/$($sup1.id)" -Method Put -Body $updateBody -ContentType "application/json"
    if ($updated.name -eq "ABC Distributors Global" -and $updated.phone -eq "+91 9876543210") {
        Write-Host "PASS 8: Updated supplier successfully" -ForegroundColor Green
    } else {
        throw "Failed to update supplier"
    }

    # 10. Create Product
    $prodBody = @{
        name = "Heavy Duty Hammer"
        sku = "HD-HMR-01"
        category = "Tools"
        purchasePricePaise = 50000
        sellingPricePaise = 85000
        quantity = 20
        minStockLevel = 5
        targetStockLevel = 30
        averageDailySales = 1.0
        leadTimeDays = 7
    } | ConvertTo-Json
    $prod = Invoke-RestMethod -Uri "$baseUrl/products" -Method Post -Body $prodBody -ContentType "application/json"
    Write-Host "PASS 9: Created product ID $($prod.id) with opening stock $($prod.quantity)" -ForegroundColor Green

    # 11. Assign Preferred Supplier to Product
    $assignBody = @{ supplierId = $sup1.id } | ConvertTo-Json
    $prodWithSup = Invoke-RestMethod -Uri "$baseUrl/products/$($prod.id)/supplier" -Method Put -Body $assignBody -ContentType "application/json"
    if ($prodWithSup.supplierId -eq $sup1.id -and $prodWithSup.supplierName -eq "ABC Distributors Global") {
        Write-Host "PASS 10: Assigned preferred supplier to product: Supplier ID $($prodWithSup.supplierId), Name '$($prodWithSup.supplierName)'" -ForegroundColor Green
    } else {
        throw "Failed to assign supplier to product"
    }

    # 12. Replace Preferred Supplier
    $replaceBody = @{ supplierId = $sup2.id } | ConvertTo-Json
    $prodReplaced = Invoke-RestMethod -Uri "$baseUrl/products/$($prod.id)/supplier" -Method Put -Body $replaceBody -ContentType "application/json"
    if ($prodReplaced.supplierId -eq $sup2.id -and $prodReplaced.supplierName -eq "Zenith Wholesale") {
        Write-Host "PASS 11: Replaced preferred supplier with Zenith Wholesale" -ForegroundColor Green
    } else {
        throw "Failed to replace supplier"
    }

    # 13. Get Products by Supplier
    $sup2Products = Invoke-RestMethod -Uri "$baseUrl/suppliers/$($sup2.id)/products" -Method Get
    if ($sup2Products.Count -eq 1 -and $sup2Products[0].productId -eq $prod.id) {
        Write-Host "PASS 12: Retrieved products for supplier Zenith Wholesale (found product: '$($sup2Products[0].name)')" -ForegroundColor Green
    } else {
        throw "Failed to get products by supplier"
    }

    # 14. Prevent Deletion of Supplier with Associated Products (HTTP 409 Conflict)
    try {
        Invoke-RestMethod -Uri "$baseUrl/suppliers/$($sup2.id)" -Method Delete
        throw "Should have blocked deletion with HTTP 409"
    } catch {
        $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        if ($statusCode -eq 409) {
            Write-Host "PASS 13: Blocked deletion of associated supplier with HTTP 409 Conflict" -ForegroundColor Green
        } else {
            throw "Expected 409 Conflict, got $statusCode ($($_.Exception.Message))"
        }
    }

    # 15. Remove Supplier from Product
    $removeRes = Invoke-WebRequest -Uri "$baseUrl/products/$($prod.id)/supplier" -Method Delete -UseBasicParsing
    if ($removeRes.StatusCode -eq 204) {
        Write-Host "PASS 14: Removed supplier from product (HTTP 204 No Content)" -ForegroundColor Green
    } else {
        throw "Expected 204 No Content, got $($removeRes.StatusCode)"
    }

    # Verify product now has null supplier
    $prodAfterRemoval = Invoke-RestMethod -Uri "$baseUrl/products/$($prod.id)" -Method Get -UseBasicParsing
    if ($null -eq $prodAfterRemoval.supplierId -and $null -eq $prodAfterRemoval.supplierName) {
        Write-Host "PASS 15: Verified product now has null supplierId and supplierName" -ForegroundColor Green
    } else {
        throw "Product supplier was not cleared"
    }

    # 16. Delete Unassociated Supplier (Zenith Wholesale)
    $delRes = Invoke-WebRequest -Uri "$baseUrl/suppliers/$($sup2.id)" -Method Delete -UseBasicParsing
    if ($delRes.StatusCode -eq 204) {
        Write-Host "PASS 16: Deleted unassociated supplier successfully (HTTP 204 No Content)" -ForegroundColor Green
    } else {
        throw "Expected 204 No Content on delete, got $($delRes.StatusCode)"
    }

    # Verify supplier no longer exists (404)
    try {
        Invoke-RestMethod -Uri "$baseUrl/suppliers/$($sup2.id)" -Method Get
        throw "Should have returned 404 for deleted supplier"
    } catch {
        $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        if ($statusCode -eq 404) {
            Write-Host "PASS 17: Verified deleted supplier returns HTTP 404 Not Found" -ForegroundColor Green
        } else {
            throw "Expected 404, got $statusCode ($($_.Exception.Message))"
        }
    }

    Write-Host "`nALL 17 LIVE API INTEGRATION CHECKS PASSED!" -ForegroundColor Green

} finally {
    Write-Host "Stopping test backend PID: $($javaProc.Id)..." -ForegroundColor Gray
    Stop-Process -Id $javaProc.Id -Force
    if (Test-Path $testDb) {
        Remove-Item -Force $testDb -ErrorAction SilentlyContinue
    }
}
