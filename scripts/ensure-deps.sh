#!/usr/bin/env bash
# NutriFit - Garante dependencias do sistema (Node.js, Go) em Linux/macOS
set -euo pipefail

NODE_MIN_MAJOR=18
GO_MIN_VERSION="1.24"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

info() { echo -e "\033[0;33m[INFO]\033[0m $*"; }
ok() { echo -e "\033[0;32m[OK]\033[0m $*"; }
err() { echo -e "\033[0;31m[ERRO]\033[0m $*" >&2; }

node_major() {
  if ! command -v node >/dev/null 2>&1; then
    return 1
  fi
  node --version | sed -E 's/^v([0-9]+).*/\1/'
}

go_version() {
  if ! command -v go >/dev/null 2>&1; then
    return 1
  fi
  go version | sed -E 's/.*go([0-9]+\.[0-9]+(\.[0-9]+)?).*/\1/'
}

version_ge() {
  [ "$(printf '%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]
}

install_node() {
  info "Instalando Node.js..."
  if command -v brew >/dev/null 2>&1; then
    brew install node@20 || brew install node
  elif command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
  else
    err "Gerenciador de pacotes nao suportado. Instale Node.js ${NODE_MIN_MAJOR}+ manualmente."
    exit 1
  fi
}

install_go() {
  info "Instalando Go..."
  if command -v brew >/dev/null 2>&1; then
    brew install go
  elif command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y golang-go
  elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y golang
  else
    err "Gerenciador de pacotes nao suportado. Instale Go ${GO_MIN_VERSION}+ manualmente."
    exit 1
  fi
}

ensure_node() {
  info "Verificando Node.js..."
  if major="$(node_major 2>/dev/null)" && [ "$major" -ge "$NODE_MIN_MAJOR" ]; then
    ok "Node.js encontrado: $(node --version)"
    return
  fi

  if [ -n "${major:-}" ]; then
    info "Node.js v${major} encontrado, mas e necessario v${NODE_MIN_MAJOR}+."
  else
    info "Node.js nao encontrado."
  fi

  install_node
  major="$(node_major)"
  if [ "$major" -lt "$NODE_MIN_MAJOR" ]; then
    err "Node.js ${NODE_MIN_MAJOR}+ ainda indisponivel. Reinicie o terminal e tente novamente."
    exit 1
  fi
  ok "Node.js instalado: $(node --version)"
}

ensure_go() {
  if [ ! -f "$ROOT_DIR/backend/go.mod" ]; then
    info "backend/go.mod nao encontrado; pulando verificacao do Go."
    return
  fi

  info "Verificando Go..."
  if version="$(go_version 2>/dev/null)" && version_ge "$version" "$GO_MIN_VERSION"; then
    ok "Go encontrado: $(go version)"
    return
  fi

  if [ -n "${version:-}" ]; then
    info "Go ${version} encontrado, mas e necessario ${GO_MIN_VERSION}+."
  else
    info "Go nao encontrado."
  fi

  install_go
  version="$(go_version)"
  if ! version_ge "$version" "$GO_MIN_VERSION"; then
    err "Go ${GO_MIN_VERSION}+ ainda indisponivel. Reinicie o terminal e tente novamente."
    exit 1
  fi
  ok "Go instalado: $(go version)"
}

ensure_node
ensure_go
