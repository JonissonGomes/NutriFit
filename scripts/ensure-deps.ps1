# NutriFit - Garante dependencias do sistema (Node.js, Go) no Windows
param(
    [switch]$Quiet
)

$ErrorActionPreference = "Stop"
$NodeMinMajor = 18
$GoMinVersion = [version]"1.24.0"

function Write-Info($msg) {
    if (-not $Quiet) { Write-Host "[INFO] $msg" -ForegroundColor Yellow }
}

function Write-Ok($msg) {
    if (-not $Quiet) { Write-Host "[OK] $msg" -ForegroundColor Green }
}

function Write-Err($msg) {
    Write-Host "[ERRO] $msg" -ForegroundColor Red
}

function Refresh-Path {
    $machine = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $user = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machine;$user"
}

function Test-Winget {
    return [bool](Get-Command winget -ErrorAction SilentlyContinue)
}

function Install-WingetPackage($id, $name) {
    if (-not (Test-Winget)) {
        throw "winget nao encontrado. Instale $name manualmente: https://winget.run"
    }
    Write-Info "Instalando $name via winget ($id)..."
    $proc = Start-Process -FilePath "winget" -ArgumentList @(
        "install", "--id", $id, "-e",
        "--accept-package-agreements", "--accept-source-agreements"
    ) -Wait -PassThru -NoNewWindow
    if ($proc.ExitCode -ne 0 -and $proc.ExitCode -ne -1978335189) {
        # -1978335189 = ja instalado
        throw "Falha ao instalar $name (codigo $($proc.ExitCode))"
    }
    Refresh-Path
    Start-Sleep -Seconds 2
}

function Get-NodeMajor {
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) { return $null }
    try {
        $version = & node --version 2>$null
        if ($version -match '^v(\d+)') { return [int]$Matches[1] }
    } catch {}
    return $null
}

function Ensure-Node {
    Write-Info "Verificando Node.js..."
    $major = Get-NodeMajor
    if ($null -ne $major -and $major -ge $NodeMinMajor) {
        Write-Ok "Node.js encontrado: $(node --version)"
        return
    }

    if ($null -ne $major) {
        Write-Info "Node.js v$major encontrado, mas e necessario v$NodeMinMajor+."
    } else {
        Write-Info "Node.js nao encontrado."
    }

    Install-WingetPackage "OpenJS.NodeJS.LTS" "Node.js LTS"
    $major = Get-NodeMajor
    if ($null -eq $major -or $major -lt $NodeMinMajor) {
        throw "Node.js $NodeMinMajor+ ainda indisponivel. Feche e reabra o terminal, depois execute novamente."
    }
    Write-Ok "Node.js instalado: $(node --version)"
}

function Get-GoVersion {
    $go = Get-Command go -ErrorAction SilentlyContinue
    if (-not $go) { return $null }
    try {
        $out = & go version 2>$null
        if ($out -match 'go(\d+\.\d+(?:\.\d+)?)') {
            return [version]$Matches[1]
        }
    } catch {}
    return $null
}

function Ensure-Go {
    if (-not (Test-Path (Join-Path $PSScriptRoot "..\backend\go.mod"))) {
        Write-Info "backend/go.mod nao encontrado; pulando verificacao do Go."
        return
    }

    Write-Info "Verificando Go..."
    $version = Get-GoVersion
    if ($null -ne $version -and $version -ge $GoMinVersion) {
        Write-Ok "Go encontrado: $(go version)"
        return
    }

    if ($null -ne $version) {
        Write-Info "Go $version encontrado, mas e necessario $GoMinVersion+."
    } else {
        Write-Info "Go nao encontrado."
    }

    Install-WingetPackage "GoLang.Go" "Go"
    $version = Get-GoVersion
    if ($null -eq $version -or $version -lt $GoMinVersion) {
        throw "Go $GoMinVersion+ ainda indisponivel. Feche e reabra o terminal, depois execute novamente."
    }
    Write-Ok "Go instalado: $(go version)"
}

try {
    Ensure-Node
    Ensure-Go
    exit 0
} catch {
    Write-Err $_.Exception.Message
    exit 1
}
