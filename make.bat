@echo off
REM ArckDesign - Script de Comandos para Windows
REM Uso: make.bat [comando]

setlocal enabledelayedexpansion

REM Variáveis
set NODE_VERSION=18
set FRONTEND_DIR=frontend
set BACKEND_DIR=backend

REM Cores (Windows não suporta cores ANSI nativamente, mas mantemos para compatibilidade)
set GREEN=
set YELLOW=
set RED=
set NC=

REM Verifica se o comando foi fornecido
if "%~1"=="" goto help

REM Executa o comando solicitado
if /i "%~1"=="setup" goto setup
if /i "%~1"=="install" goto install
if /i "%~1"=="install-frontend" goto install-frontend
if /i "%~1"=="install-backend" goto install-backend
if /i "%~1"=="dev" goto dev
if /i "%~1"=="dev-frontend" goto dev-frontend
if /i "%~1"=="dev-backend" goto dev-backend
if /i "%~1"=="build" goto build
if /i "%~1"=="build-frontend" goto build-frontend
if /i "%~1"=="build-backend" goto build-backend
if /i "%~1"=="preview" goto preview
if /i "%~1"=="lint" goto lint
if /i "%~1"=="lint-frontend" goto lint-frontend
if /i "%~1"=="lint-fix" goto lint-fix
if /i "%~1"=="clean" goto clean
if /i "%~1"=="clean-frontend" goto clean-frontend
if /i "%~1"=="clean-backend" goto clean-backend
if /i "%~1"=="clean-cache" goto clean-cache
if /i "%~1"=="check-node" goto check-node
if /i "%~1"=="version" goto version
if /i "%~1"=="info" goto info
if /i "%~1"=="help" goto help

echo Comando desconhecido: %~1
goto help

:setup
call :check-node
call :install
echo.
echo [OK] Setup concluido com sucesso!
echo Execute 'make.bat dev' para iniciar o servidor de desenvolvimento
goto end

:install
call :install-frontend
call :install-backend
echo.
echo [OK] Todas as dependencias instaladas
goto end

:install-frontend
echo [INFO] Instalando dependencias do frontend...
cd %FRONTEND_DIR%
if errorlevel 1 (
    echo [ERRO] Pasta frontend nao encontrada!
    exit /b 1
)
call npm install
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias do frontend
    cd ..
    exit /b 1
)
cd ..
echo [OK] Dependencias do frontend instaladas
goto end

:install-backend
if exist "%BACKEND_DIR%\go.mod" (
    echo [INFO] Instalando dependencias do backend Go...
    cd %BACKEND_DIR%
    call go mod download
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias do backend
        cd ..
        exit /b 1
    )
    cd ..
    echo [OK] Dependencias do backend instaladas
) else (
    echo [AVISO] Backend ainda nao possui go.mod. Pulando instalacao do backend.
)
goto end

:check-node
echo [INFO] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado. Por favor, instale Node.js %NODE_VERSION%+
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo [OK] Node.js encontrado: %NODE_VER%
goto end

:dev
call :dev-frontend
goto end

:dev-frontend
echo [INFO] Iniciando servidor de desenvolvimento do frontend...
cd %FRONTEND_DIR%
if errorlevel 1 (
    echo [ERRO] Pasta frontend nao encontrada!
    exit /b 1
)
call npm run dev
cd ..
goto end

:dev-backend
if exist "%BACKEND_DIR%\go.mod" (
    echo [INFO] Iniciando servidor de desenvolvimento do backend Go...
    cd %BACKEND_DIR%
    go run cmd/server/main.go
    cd ..
) else (
    echo [ERRO] Backend ainda nao possui go.mod. Certifique-se de que o backend esta configurado corretamente.
)
goto end

:build
call :build-frontend
call :build-backend
echo.
echo [OK] Build concluido!
goto end

:build-frontend
echo [INFO] Gerando build de producao do frontend...
cd %FRONTEND_DIR%
if errorlevel 1 (
    echo [ERRO] Pasta frontend nao encontrada!
    exit /b 1
)
call npm run build
if errorlevel 1 (
    echo [ERRO] Falha ao fazer build do frontend
    cd ..
    exit /b 1
)
cd ..
echo [OK] Build do frontend concluido! Arquivos em %FRONTEND_DIR%\dist
goto end

:build-backend
if exist "%BACKEND_DIR%\go.mod" (
    echo [INFO] Gerando build de producao do backend Go...
    cd %BACKEND_DIR%
    call go build -o server.exe ./cmd/server
    if errorlevel 1 (
        echo [ERRO] Falha ao fazer build do backend
        cd ..
        exit /b 1
    )
    echo [OK] Build do backend concluido! Executavel: %BACKEND_DIR%\server.exe
    cd ..
) else (
    echo [AVISO] Backend ainda nao possui go.mod. Pulando build do backend.
)
goto end

:preview
echo [INFO] Iniciando preview do build do frontend...
cd %FRONTEND_DIR%
if errorlevel 1 (
    echo [ERRO] Pasta frontend nao encontrada!
    exit /b 1
)
call npm run preview
cd ..
goto end

:lint
call :lint-frontend
goto end

:lint-frontend
echo [INFO] Executando linter do frontend...
cd %FRONTEND_DIR%
if errorlevel 1 (
    echo [ERRO] Pasta frontend nao encontrada!
    exit /b 1
)
call npm run lint
cd ..
goto end

:lint-fix
echo [INFO] Corrigindo problemas do linter do frontend...
cd %FRONTEND_DIR%
if errorlevel 1 (
    echo [ERRO] Pasta frontend nao encontrada!
    exit /b 1
)
call npm run lint -- --fix
cd ..
goto end

:clean
call :clean-frontend
call :clean-backend
echo.
echo [OK] Limpeza concluida
goto end

:clean-frontend
echo [INFO] Limpando frontend...
if exist "%FRONTEND_DIR%\node_modules" rmdir /s /q "%FRONTEND_DIR%\node_modules"
if exist "%FRONTEND_DIR%\dist" rmdir /s /q "%FRONTEND_DIR%\dist"
if exist "%FRONTEND_DIR%\dist-ssr" rmdir /s /q "%FRONTEND_DIR%\dist-ssr"
if exist "%FRONTEND_DIR%\.vite" rmdir /s /q "%FRONTEND_DIR%\.vite"
echo [OK] Frontend limpo
goto end

:clean-backend
echo [INFO] Limpando backend...
if exist "%BACKEND_DIR%\server.exe" del /q "%BACKEND_DIR%\server.exe"
if exist "%BACKEND_DIR%\server" del /q "%BACKEND_DIR%\server"
if exist "%BACKEND_DIR%\*.exe" del /q "%BACKEND_DIR%\*.exe"
echo [OK] Backend limpo
goto end

:clean-cache
echo [INFO] Limpando cache do Vite...
if exist "%FRONTEND_DIR%\.vite" rmdir /s /q "%FRONTEND_DIR%\.vite"
if exist "%FRONTEND_DIR%\dist" rmdir /s /q "%FRONTEND_DIR%\dist"
echo [OK] Cache limpo
goto end

:version
echo [INFO] Versoes:
for /f "tokens=*" %%i in ('node --version 2^>nul') do echo   Node.js: %%i
for /f "tokens=*" %%i in ('npm --version 2^>nul') do echo   npm: %%i
for /f "tokens=*" %%i in ('go version 2^>nul') do echo   Go: %%i
goto end

:info
echo === Informacoes do Projeto ===
echo.
if exist "%FRONTEND_DIR%\package.json" (
    echo Frontend:
    for /f "tokens=2 delims=:," %%a in ('findstr /c:"\"name\"" "%FRONTEND_DIR%\package.json"') do (
        set FRONTEND_NAME=%%a
        set FRONTEND_NAME=!FRONTEND_NAME:"=!
        set FRONTEND_NAME=!FRONTEND_NAME: =!
        echo   Nome: !FRONTEND_NAME!
    )
    for /f "tokens=2 delims=:," %%a in ('findstr /c:"\"version\"" "%FRONTEND_DIR%\package.json"') do (
        set FRONTEND_VER=%%a
        set FRONTEND_VER=!FRONTEND_VER:"=!
        set FRONTEND_VER=!FRONTEND_VER: =!
        echo   Versao: !FRONTEND_VER!
    )
    echo.
)
if exist "%BACKEND_DIR%\go.mod" (
    echo Backend:
    echo   Linguagem: Go
    for /f "tokens=*" %%i in ('go version 2^>nul') do echo   Versao Go: %%i
    echo.
)
echo Scripts disponiveis no frontend:
cd %FRONTEND_DIR%
call npm run --silent 2>nul
if errorlevel 1 echo   Execute 'make.bat setup' primeiro
cd ..
goto end

:help
echo ArckDesign - Script de Comandos para Windows
echo.
echo Comandos disponiveis:
echo.
echo Setup:
echo   make.bat setup              Instala todas as dependencias do projeto
echo   make.bat install            Instala dependencias do frontend e backend
echo   make.bat install-frontend   Instala dependencias do frontend
echo   make.bat install-backend    Instala dependencias do backend
echo   make.bat check-node         Verifica se Node.js esta instalado
echo.
echo Desenvolvimento:
echo   make.bat dev                Inicia servidor de desenvolvimento do frontend
echo   make.bat dev-frontend       Inicia servidor de desenvolvimento do frontend
echo   make.bat dev-backend        Inicia servidor de desenvolvimento do backend
echo.
echo Build:
echo   make.bat build              Cria build de producao do frontend e backend
echo   make.bat build-frontend     Cria build de producao do frontend
echo   make.bat build-backend      Cria build de producao do backend
echo   make.bat preview           Preview do build de producao do frontend
echo.
echo Qualidade de Codigo:
echo   make.bat lint               Executa o linter do frontend
echo   make.bat lint-frontend      Executa o linter do frontend
echo   make.bat lint-fix           Corrige problemas do linter automaticamente
echo.
echo Limpeza:
echo   make.bat clean              Remove node_modules e arquivos de build
echo   make.bat clean-frontend     Remove node_modules e arquivos de build do frontend
echo   make.bat clean-backend      Remove node_modules e arquivos de build do backend
echo   make.bat clean-cache        Limpa apenas o cache do Vite
echo.
echo Utilitarios:
echo   make.bat version            Mostra versao do Node.js e npm
echo   make.bat info               Mostra informacoes do projeto
echo   make.bat help               Mostra esta mensagem de ajuda
echo.
goto end

:end
endlocal






