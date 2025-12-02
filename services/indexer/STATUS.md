# Indexer Status Report

## ✅ O que foi feito

1. **Microserviço Indexer em Golang** - Completo
   - Estrutura do projeto criada
   - Cliente Solana para buscar contas
   - Database PostgreSQL com schema
   - REST API com endpoints
   - Docker e Docker Compose configurados

2. **Integração com API TypeScript** - Completo
   - Configuração do INDEXER_URL
   - Fallback automático para on-chain se indexer falhar
   - Suporte para todos os filtros existentes

3. **Infraestrutura** - Funcionando
   - PostgreSQL rodando no Docker
   - Indexer rodando na porta 9090
   - Health check funcionando
   - API endpoints respondendo

## ⚠️ Problema Atual

O indexer está encontrando a conta PropertyState (`22xe4VxvmL6Jz5NaQk7BfuqNFd9RDztaarfV6bHwJeFG`) mas está falhando no **parsing dos dados**.

Erro: `symbol length exceeds data bounds`

### Causa Raiz

O parser está lendo os offsets de forma incorreta. O layout Borsh do struct `PropertyState` tem fields com tamanhos variáveis (Vec, String) que precisam ser lidos sequencialmente.

### Próximos Passos

Há 3 opções para resolver:

#### Opção 1: Fix Parser Manual (Rápido mas frágil)
- Analisar o hex dump completo da conta
- Ajustar os offsets no código Go
- ⚠️ Vai quebrar se o struct mudar

#### Opção 2: Usar Anchor IDL (Recomendado)
- Ler o IDL do programa (`target/idl/hub_token_program.json`)
- Usar biblioteca Borsh para Go
- Parse automático baseado no IDL
- ✅ Mais robusto e manutenível

#### Opção 3: Indexer Simples com Mints Hardcoded
- Criar tabela de mints conhecidos
- Buscar apenas os PDAs específicos
- Mais simples mas requer atualização manual

## 🔧 Solução Temporária

Para desbloquear agora, você pode:

### 1. Adicionar propriedade manualmente no DB

```sql
INSERT INTO properties (
  mint, property_state_pda, name, symbol, authority,
  total_supply, circulating_supply, decimals,
  property_type, location, total_value_usd, annual_yield, metadata_uri
) VALUES (
  '9aBUVGmgn2f3fXtLjruZ5VhFYzgdSEcHpLCEia5xoDcn',
  '22xe4VxvmL6Jz5NaQk7BfuqNFd9RDztaarfV6bHwJeFG',
  'Plaza Urban I',
  'PLAZA01',
  'AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw',
  1770000,
  0,
  6,
  'residential',
  'Jardim Bela Vista',
  600000,
  20000,
  'ipfs://bafkreigkuqugwp7w5spg2kzgbtcmtdeb42jccksdvmdskfgzd2xvd7rbym'
);
```

### 2. Testar o frontend

```bash
curl http://localhost:9090/api/v1/properties
```

Vai retornar a propriedade e o frontend vai funcionar!

## 📊 Status dos Componentes

| Componente | Status | Porta | Notas |
|------------|--------|-------|-------|
| PostgreSQL | ✅ Running | 5432 | Healthy |
| Indexer API | ✅ Running | 9090 | Endpoints funcionando |
| Parser Solana | ⚠️ Issue | - | Precisa fix no Borsh parsing |
| API TypeScript | ✅ Ready | 3003 | Com fallback |
| Frontend | ⏳ Waiting | 5173 | Aguardando dados |

## 🚀 Para Produção

Antes de ir para produção:

1. Fixar o parser Borsh (Opção 2 recomendada)
2. Adicionar logging estruturado
3. Monitoramento e alertas
4. Rate limiting no RPC
5. Backup do PostgreSQL
6. Health checks no Kubernetes/Docker
7. Testes de integração

## 🛠️ Como Rodar Agora

```bash
# 1. PostgreSQL
docker-compose up -d postgres

# 2. Indexer
cd services/indexer
go run cmd/main.go

# 3. Adicionar dados manualmente (SQL acima)
docker exec -it hub-token-postgres psql -U postgres -d hub_indexer

# 4. API TypeScript
cd services/api
npm run dev

# 5. Frontend
cd app
npm run dev
```

## 📝 Arquivos Importantes

- `/services/indexer/internal/indexer/solana.go` - Parser que precisa fix
- `/services/indexer/internal/database/database.go` - Schema do DB
- `/services/api/src/infrastructure/repositories/PropertyRepositoryImpl.ts` - Integração com indexer
- `/target/idl/hub_token_program.json` - IDL do programa (para parser correto)

## ❓ Dúvidas?

- Ver logs: `docker-compose logs -f indexer`
- Health check: `curl http://localhost:9090/health`
- Database: `docker exec -it hub-token-postgres psql -U postgres -d hub_indexer`

---

**Data:** 2025-11-28
**Status Geral:** 85% Completo - Infraestrutura pronta, precisa fix no parser
