#Requires -Version 5.1
<#
.SYNOPSIS
    Despliega MoraBanc Office Store (Next.js standalone) en un servidor
    Windows, gestionado por PM2.

.DESCRIPTION
    Asume que el código ya está en el servidor (copia manual o CI/CD) y
    que `.env.production` ya existe en la raíz del proyecto, con
    NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY /
    NEXT_PUBLIC_SITE_URL rellenados con los valores reales — deben
    existir ANTES de compilar, porque Next.js las incrusta en el build,
    no las lee en cada arranque (ver docs/deployment.md, sección 2).

    Ejecutar desde una PowerShell con permisos suficientes para instalar
    servicios de PM2, dentro de la raíz del proyecto:

        cd C:\inetpub\morabanc-office-store
        .\deploy.ps1

.NOTES
    Ver docs/deployment.md para la guía completa de IT (requisitos,
    configuración de IIS como reverse proxy, verificación final).
#>

[CmdletBinding()]
param(
    # Entorno de PM2 a usar (coincide con el bloque `env_production` de
    # ecosystem.config.js).
    [string]$PM2Env = "production"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-CommandExists {
    param([string]$Name, [string]$InstallHint)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "No se encuentra '$Name' en el PATH. $InstallHint"
    }
}

try {
    Set-Location $ProjectRoot

    Write-Step "Comprobando herramientas necesarias"
    Assert-CommandExists -Name "node" -InstallHint "Instalar Node.js 20.9+ LTS desde https://nodejs.org/."
    Assert-CommandExists -Name "npm" -InstallHint "Viene incluido con la instalación de Node.js."
    Assert-CommandExists -Name "pm2" -InstallHint "Instalar con: npm install -g pm2"
    $nodeVersion = (node --version)
    Write-Host "  Node.js $nodeVersion detectado." -ForegroundColor Green

    Write-Step "Comprobando .env.production"
    $envProductionPath = Join-Path $ProjectRoot ".env.production"
    if (-not (Test-Path $envProductionPath)) {
        throw (
            "No existe '$envProductionPath'. Copia '.env.production.example' a " +
            "'.env.production' y rellena NEXT_PUBLIC_SUPABASE_URL / " +
            "NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SITE_URL con los valores " +
            "reales ANTES de continuar (deben existir antes de compilar, no solo " +
            "en el servicio de PM2 despues)."
        )
    }
    Write-Host "  .env.production encontrado." -ForegroundColor Green

    Write-Step "Instalando dependencias (npm ci)"
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci ha fallado (código $LASTEXITCODE)." }

    Write-Step "Compilando build de produccion (npm run build)"
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build ha fallado (código $LASTEXITCODE)." }

    $standaloneDir = Join-Path $ProjectRoot ".next\standalone"
    $serverJs = Join-Path $standaloneDir "server.js"
    if (-not (Test-Path $serverJs)) {
        throw (
            "No se ha generado .next\standalone\server.js. Comprueba que " +
            "next.config.ts tiene 'output: \"standalone\"'."
        )
    }

    Write-Step "Copiando estáticos a .next\standalone (paso manual obligatorio de Next.js)"
    $publicSrc = Join-Path $ProjectRoot "public"
    $publicDest = Join-Path $standaloneDir "public"
    if (Test-Path $publicSrc) {
        Copy-Item -Path $publicSrc -Destination $publicDest -Recurse -Force
        Write-Host "  public\ copiado." -ForegroundColor Green
    }

    $staticSrc = Join-Path $ProjectRoot ".next\static"
    $staticDestParent = Join-Path $standaloneDir ".next"
    $staticDest = Join-Path $staticDestParent "static"
    if (-not (Test-Path $staticDestParent)) {
        New-Item -ItemType Directory -Path $staticDestParent -Force | Out-Null
    }
    Copy-Item -Path $staticSrc -Destination $staticDest -Recurse -Force
    Write-Host "  .next\static copiado." -ForegroundColor Green

    Copy-Item -Path $envProductionPath -Destination (Join-Path $standaloneDir ".env.production") -Force
    Write-Host "  .env.production copiado dentro de .next\standalone." -ForegroundColor Green

    $logsDir = Join-Path $ProjectRoot "logs"
    if (-not (Test-Path $logsDir)) {
        New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
    }

    Write-Step "Arrancando/recargando el proceso con PM2 (entorno: $PM2Env)"
    pm2 startOrReload ecosystem.config.js --env $PM2Env
    if ($LASTEXITCODE -ne 0) { throw "pm2 startOrReload ha fallado (código $LASTEXITCODE)." }

    pm2 save
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "pm2 save ha fallado: el proceso esta corriendo, pero no sobrevivira a un reinicio del servidor hasta que se guarde correctamente."
    }

    Write-Step "Despliegue completado"
    pm2 status morabanc-office-store
    Write-Host ""
    Write-Host "Verificar en http://127.0.0.1:3000 desde el propio servidor (IIS lo expone" -ForegroundColor Green
    Write-Host "hacia fuera vía reverse proxy — ver docs/deployment.md, seccion 5)." -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "DESPLIEGUE FALLIDO: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
