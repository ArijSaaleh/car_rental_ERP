# Quick Start Script for Car Rental SaaS Platform (Windows)
Write-Host "[*] Starting Car Rental SaaS Platform..." -ForegroundColor Green

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker is running
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Create .env file if it does not exist
if (-not (Test-Path "backend\.env")) {
    Write-Host "[*] Creating backend .env file..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
}

# Skip pull, build directly (avoid Docker Hub timeout)
Write-Host "[*] Building and starting Docker containers (offline mode)..." -ForegroundColor Green
docker-compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start containers. Check Docker logs." -ForegroundColor Red
    exit 1
}

# Wait for PostgreSQL to be ready
Write-Host "[*] Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    $dbReady = docker-compose exec -T postgres pg_isready -U car_rental_user 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] PostgreSQL is ready!" -ForegroundColor Green
        break
    }
    $attempt++
    Start-Sleep -Seconds 2
}

if ($attempt -eq $maxAttempts) {
    Write-Host "[ERROR] PostgreSQL failed to start. Check logs with: docker-compose logs postgres" -ForegroundColor Red
    exit 1
}

# Run database migrations
Write-Host "[*] Running database migrations..." -ForegroundColor Yellow
$migrationExists = docker-compose exec -T backend alembic current 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[*] Creating initial migration..." -ForegroundColor Yellow
    docker-compose exec -T backend alembic revision --autogenerate -m "Initial migration"
}

docker-compose exec -T backend alembic upgrade head

Write-Host ""
Write-Host "[SUCCESS] Car Rental SaaS Platform is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3000"
Write-Host "   - Backend API: http://localhost:8000"
Write-Host "   - API Documentation: http://localhost:8000/api/docs"
Write-Host "   - PgAdmin: http://localhost:5050 (optional)"
Write-Host ""
Write-Host "Default credentials:" -ForegroundColor Cyan
Write-Host "   Create your first user via API or use the registration endpoint"
Write-Host ""
Write-Host "View logs:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f"
Write-Host ""
Write-Host "Stop the platform:" -ForegroundColor Cyan
Write-Host "   docker-compose down"
Write-Host ""
