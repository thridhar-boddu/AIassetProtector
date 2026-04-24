# ============================================================
# AssetGuardian Backend — Local Development Runner
# ============================================================
# Required environment variables (set in your shell or .env):
#   DATABASE_URL      e.g. jdbc:postgresql://localhost:5432/assetguardian
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

# Setup Maven Wrapper if missing
if (!(Test-Path ".mvn\wrapper\maven-wrapper.jar")) {
    Write-Host "Downloading Maven Wrapper..."
    New-Item -ItemType Directory -Force -Path ".mvn\wrapper" | Out-Null
    $url = "https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar"
    Invoke-WebRequest -Uri $url -OutFile ".mvn\wrapper\maven-wrapper.jar"
}

# Run Spring Boot
Write-Host "Starting AssetGuardian Backend (PostgreSQL)..." -ForegroundColor Cyan
$root = Get-Location
java "-Dmaven.multiModuleProjectDirectory=$root" -cp ".mvn\wrapper\maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain spring-boot:run
