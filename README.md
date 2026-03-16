# ArckDesign

Plataforma completa para arquitetos e clientes gerenciarem projetos arquitetônicos.

## 📁 Estrutura do Projeto

```
arck-design/
├── frontend/          # Aplicação React + TypeScript + Vite
│   ├── src/          # Código fonte do frontend
│   ├── package.json  # Dependências do frontend
│   └── ...
├── backend/          # Backend Go + MongoDB + Cloudinary
│   ├── cmd/          # Ponto de entrada do servidor
│   ├── internal/     # Código interno do backend
│   └── README.md     # Documentação do backend
└── docs/             # Documentação do projeto
```

## 📋 Pré-requisitos

### Frontend
- **Node.js** 18+ e npm
- Verificar: `node --version` e `npm --version`

### Backend
- **Go** 1.21+
- Verificar: `go version`
- **MongoDB Atlas** (ou MongoDB local)
- **Cloudinary** (conta gratuita)

## 🚀 Como Rodar o Projeto

### 1. Configuração Inicial

#### Backend

1. Navegue para a pasta do backend:
```bash
cd backend
```

2. Copie o arquivo de exemplo de variáveis de ambiente:
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

3. Configure as variáveis no arquivo `.env`:
   - `MONGODB_URI` - URI de conexão do MongoDB Atlas
   - `JWT_SECRET` - Chave secreta para JWT (gerar com `openssl rand -base64 32`)
   - `CLOUDINARY_CLOUD_NAME` - Nome da conta Cloudinary
   - `CLOUDINARY_API_KEY` - API Key do Cloudinary
   - `CLOUDINARY_API_SECRET` - API Secret do Cloudinary
   
   Veja `backend/.env.example` para todas as variáveis necessárias.

4. Instale as dependências do Go:
```bash
go mod download
```

#### Frontend

1. Navegue para a pasta do frontend:
```bash
cd frontend
```

2. Copie o arquivo de exemplo de variáveis de ambiente:
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

3. Configure as variáveis no arquivo `.env`:
   - `VITE_API_URL` - URL do backend (padrão: `http://localhost:8080`)
   - `VITE_API_BASE_URL` - URL base da API (padrão: `http://localhost:8080/api/v1`)
   
   Veja `frontend/.env.example` para todas as variáveis.

4. Instale as dependências:
```bash
npm install
```

### 2. Executando os Servidores

#### Opção 1: Rodar em Terminais Separados (Recomendado)

**Terminal 1 - Backend:**
```bash
cd backend
go run cmd/server/main.go
```

O backend estará rodando em: `http://localhost:8080`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

O frontend estará rodando em: `http://localhost:5173`

#### Opção 2: Usando Makefile (Linux/Mac)

```bash
# Instalar dependências
make setup

# Rodar backend em background
make dev-backend &

# Rodar frontend
make dev-frontend
```

#### Opção 3: Usando make.bat (Windows)

```powershell
# Instalar dependências
.\make.bat setup

# Rodar backend (em um terminal)
.\make.bat dev-backend

# Rodar frontend (em outro terminal)
.\make.bat dev-frontend
```

### 3. Verificando se Está Funcionando

1. **Backend Health Check:**
   - Acesse: `http://localhost:8080/health`
   - Deve retornar: `{"status":"ok","service":"arck-design-api"}`

2. **Frontend:**
   - Acesse: `http://localhost:5173`
   - A página inicial deve carregar

3. **Testar Autenticação:**
   - Acesse: `http://localhost:5173/login`
   - Use as credenciais de teste (veja seção abaixo)

## 🔧 Comandos Disponíveis

### Backend

```bash
cd backend

# Rodar servidor
go run cmd/server/main.go

# Build para produção
go build -o server ./cmd/server

# Executar testes
go test ./...

# Ver dependências
go list -m all
```

### Frontend

```bash
cd frontend

# Rodar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## 🌐 URLs e Portas

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:8080`
- **API Base:** `http://localhost:8080/api/v1`
- **Health Check:** `http://localhost:8080/health`

## 🔐 Credenciais de Teste

### Arquiteto
- Email: `arquiteto@arckdesign.com`
- Senha: `123456`

### Cliente
- Email: `cliente@arckdesign.com`
- Senha: `123456`

## 🛠️ Tecnologias

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Material UI** - Componentes UI
- **React Router** - Roteamento

### Backend
- **Go 1.21+** - Linguagem de programação
- **Gin** - Framework web
- **MongoDB Atlas** - Banco de dados NoSQL
- **JWT** - Autenticação com tokens
- **Cloudinary** - Storage e processamento de imagens
- **bcrypt** - Hash de senhas

## 🐛 Troubleshooting

### Backend não inicia - Porta 8080 já em uso

**Windows:**
```powershell
# Verificar qual processo está usando a porta
netstat -ano | findstr :8080

# Encerrar o processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F

# Ou encerrar todos os processos Go
taskkill /IM main.exe /F
taskkill /IM server.exe /F
```

**Linux/Mac:**
```bash
# Verificar qual processo está usando a porta
lsof -i :8080

# Encerrar o processo (substitua PID pelo número encontrado)
kill -9 <PID>
```

### Backend não inicia - Outros problemas
- Verifique se o MongoDB está acessível
- Confirme que todas as variáveis do `.env` estão configuradas
- Verifique se a porta 8080 está livre: `netstat -ano | findstr :8080` (Windows) ou `lsof -i :8080` (Linux/Mac)

### Frontend não conecta ao backend
- Verifique se o backend está rodando em `http://localhost:8080`
- Confirme a variável `VITE_API_URL` no `.env` do frontend
- Verifique o console do navegador para erros de CORS

### Erro de autenticação
- Verifique se o JWT_SECRET está configurado no backend
- Confirme que o token está sendo enviado no header `Authorization: Bearer <token>`

## 📚 Documentação

- [Backend README](./backend/README.md) - Documentação completa do backend
- [Arquitetura Técnica](./docs/ARQUITETURA_TECNICA.md)
- [Funcionalidades](./FUNCIONALIDADES.md)
- [Rotas](./ROTAS.md)
- [Guia de Login](./GUIA_LOGIN.md)

## 📝 Licença

Este projeto é privado.
