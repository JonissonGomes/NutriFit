param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'build', 'install', 'clean')]
    [string]$Action
)

$ErrorActionPreference = 'Stop'
$BackendDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'backend'
$GoMod = Join-Path $BackendDir 'go.mod'

function Write-Info($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Ok($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host $msg -ForegroundColor Red }

if (-not (Test-Path $GoMod)) {
    switch ($Action) {
        'dev' {
            Write-Err 'Backend ainda nao possui go.mod. Certifique-se de que o backend esta configurado corretamente.'
            exit 1
        }
        'build' {
            Write-Warn 'Backend ainda nao possui go.mod. Pulando build do backend.'
            exit 0
        }
        'install' {
            Write-Warn 'Backend ainda nao possui go.mod. Pulando instalacao do backend.'
            exit 0
        }
        'clean' { exit 0 }
    }
}

Push-Location $BackendDir
try {
    switch ($Action) {
        'dev' {
            Write-Info 'Iniciando servidor de desenvolvimento do backend (Go)...'
            go run cmd/server/main.go
        }
        'build' {
            Write-Info 'Gerando build de producao do backend (Go)...'
            go build -o server.exe ./cmd/server
            Write-Ok "Build do backend concluido! Executavel: $BackendDir\server.exe"
        }
        'install' {
            Write-Info 'Instalando dependencias do backend (Go)...'
            go mod download
            Write-Ok 'Dependencias do backend instaladas'
        }
        'clean' {
            Write-Info 'Limpando backend...'
            Remove-Item -Force -ErrorAction SilentlyContinue server, server.exe
            Get-ChildItem -Filter '*.exe' -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
            Write-Ok 'Backend limpo'
        }
    }

    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}
