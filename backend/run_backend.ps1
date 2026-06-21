# ============================================================
# AssetGuardian Backend — Local Development Runner (Python)
# ============================================================
# Required environment variables (set in your shell or .env):
#   DATABASE_URL      e.g. postgresql://localhost:5432/assetguardian
#   DB_USERNAME       e.g. postgres
#   DB_PASSWORD       e.g. secret
#   ALLOWED_ORIGINS   e.g. http://localhost:5173
#   AI_SERVICE_URL    e.g. http://localhost:8000  (optional)
# ============================================================

# Guard: ensure required vars are set
$required = @("DATABASE_URL", "DB_USERNAME", "DB_PASSWORD")
foreach ($var in $required) {
    if (-not [System.Environment]::GetEnvironmentVariable($var)) {
        Write-Error "Missing required environment variable: $var"
        Write-Host "Tip: copy backend\.env.example to backend\.env and set your values,"
        Write-Host "     then run:  Get-Content .env | ForEach-Object { \$env:$(\$_.Split('=')[0]) = \$_.Split('=',2)[1] }"
        exit 1
    }
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
    python -m venv venv
}

# Activate virtual environment and install requirements
Write-Host "Activating virtual environment & installing dependencies..." -ForegroundColor Cyan
. venv/Scripts/Activate.ps1
pip install -r requirements.txt

# Run FastAPI backend
Write-Host "Starting AssetGuardian Backend (FastAPI)..." -ForegroundColor Cyan
python main.py
