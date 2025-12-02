# Quick Start Guide

## Setup e Execução

### Opção 1: Docker Compose (Recomendado)

1. **Iniciar todos os serviços** (PostgreSQL + Indexer + API):
```bash
cd /Users/renancorrea/solana/hub-token/hub_token_program
docker-compose up -d postgres indexer
```

2. **Ver logs**:
```bash
docker-compose logs -f indexer
```

3. **Testar**:
```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/v1/properties
```

### Opção 2: Local Development

1. **Instalar PostgreSQL** (se não tiver):
```bash
brew install postgresql@15
brew services start postgresql@15
createdb hub_indexer
```

2. **Instalar dependências Go**:
```bash
cd services/indexer
go mod download
```

3. **Configurar .env**:
```bash
cp .env.example .env
# Editar .env com suas configurações
```

4. **Executar**:
```bash
make run
# ou
go run cmd/main.go
```

## Como Funciona

### Fluxo de Dados

```
Solana Devnet → Indexer (Go) → PostgreSQL → API (TypeScript) → Frontend (React)
```

### Processo de Indexação

1. **Automático**: A cada 60 segundos (configurável)
2. **Manual**: `POST http://localhost:8080/api/v1/index/trigger`

### Estrutura do Banco de Dados

O indexer cria automaticamente a tabela `properties` com:
- Informações do mint (address, symbol, supply)
- Detalhes da propriedade (location, type, value)
- Metadata (IPFS URI)
- Timestamps e índices

## API Endpoints

### Indexer (Port 8080)

```bash
# Health check
GET /health

# Listar todas as propriedades
GET /api/v1/properties

# Filtrar propriedades
GET /api/v1/properties?status=active&propertyType=residential

# Buscar por mint
GET /api/v1/properties/{mint}

# Trigger indexação manual
POST /api/v1/index/trigger
```

### Exemplo de Resposta

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "mint": "9aBUVGmgn2f3fXtLjruZ5VhFYzgdSEcHpLCEia5xoDcn",
      "name": "Plaza Urban I",
      "symbol": "PLAZA01",
      "location": "Jardim Bela Vista",
      "propertyType": "residential",
      "totalValueUsd": 600000,
      "annualYield": 20000,
      "metadataUri": "ipfs://...",
      "totalSupply": 1770000,
      "circulatingSupply": 0,
      "status": "active"
    }
  ]
}
```

## Troubleshooting

### Indexer não está pegando propriedades

1. **Verificar se o programa tem contas**:
```bash
solana program show FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om --url https://api.devnet.solana.com
```

2. **Trigger indexação manual**:
```bash
curl -X POST http://localhost:8080/api/v1/index/trigger
```

3. **Ver logs do indexer**:
```bash
docker-compose logs -f indexer
# ou se rodando localmente, ver output do terminal
```

### Database connection failed

1. **Verificar se PostgreSQL está rodando**:
```bash
docker-compose ps postgres
# ou
brew services list | grep postgresql
```

2. **Testar conexão**:
```bash
psql postgres://postgres:postgres@localhost:5432/hub_indexer
```

### RPC errors

O indexer usa o RPC público da Solana por padrão (`https://api.devnet.solana.com`).

Se estiver tendo rate limiting:
1. Use um RPC provider (Helius, QuickNode)
2. Configure no `.env`: `SOLANA_RPC_URL=https://seu-rpc-url`

## Configurações Importantes

### Variáveis de Ambiente

```bash
# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/hub_indexer?sslmode=disable

# Indexer
INDEXER_INTERVAL=60s  # Intervalo de indexação
INDEXER_ENABLED=true  # Auto-indexação
```

## Integração com API TypeScript

A API TypeScript já está configurada para usar o indexer automaticamente:

1. **Configurar URL do indexer** em `services/api/.env`:
```bash
INDEXER_URL=http://localhost:8080
```

2. **Se rodando com Docker Compose**:
```bash
INDEXER_URL=http://indexer:8080
```

3. A API vai:
   - Tentar buscar do indexer primeiro (rápido)
   - Se falhar, buscar on-chain (fallback)

## Comandos Úteis

```bash
# Build
make build

# Run tests
make test

# Format code
make fmt

# Run development
make run

# Docker build
make docker-build

# Limpar database
docker-compose down -v
docker-compose up -d postgres indexer
```

## Performance

- **Indexação inicial**: ~2-5 segundos
- **Query de propriedades**: ~10-50ms (vs 2-3s on-chain)
- **Suporta**: Milhares de propriedades sem degradação
