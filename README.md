# HUB Token - Real Estate Tokenization on Solana (RWA)

## 📋 Visão Geral do Projeto

Plataforma de tokenização de imóveis (Real World Assets - RWA) na Solana com KYC/compliance via **Solana Attestation Service (SAS)**.

### Stack Tecnológico

- **On-chain**: Anchor 0.30.1 + Token-2022
- **KYC/Compliance**: Solana Attestation Service (SAS) + Civic Pass
- **Backend**: NestJS + Solana Web3.js
- **Frontend**: React + Tailwind + Zustand + Civic SDK
- **Storage**: IPFS/Arweave para metadados das propriedades

## ✅ Implementação Atual

### **Smart Contract Anchor** - `programs/hub_token_program/src/lib.rs`

#### **Estrutura de Dados**

```rust
pub struct PropertyState {
    pub authority: Pubkey,              // Admin do imóvel
    pub mint: Pubkey,                   // Token mint do imóvel
    pub property_name: String,          // Ex: "Edifício Santos Dumont"
    pub property_symbol: String,        // Ex: "EDSANTO"
    pub total_supply: u64,              // Supply total de tokens
    pub circulating_supply: u64,        // Tokens em circulação
    pub details: PropertyDetails,       // Detalhes do imóvel
    pub is_active: bool,                // Status ativo/inativo
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

pub struct PropertyDetails {
    pub property_address: String,       // "Rua X, 123, São Paulo - SP"
    pub property_type: String,          // "Residential"/"Commercial"/"Industrial"
    pub total_value_usd: u64,          // Valor em centavos (ex: 50000000 = $500k)
    pub rental_yield_bps: u16,         // Yield anual em bps (500 = 5%)
    pub metadata_uri: String,           // IPFS/Arweave URI
}
```

#### **Instruções Implementadas**

##### 1. `initialize_property`
- Cria Token-2022 mint para um novo imóvel
- Cria PropertyState PDA com metadados
- Emite evento `PropertyInitialized`

```rust
pub fn initialize_property(
    ctx: Context<InitializeProperty>,
    property_name: String,        // "Edifício Santos Dumont"
    property_symbol: String,      // "EDSANTO"
    decimals: u8,                 // 6 (padrão)
    total_supply: u64,            // 1_000_000 (1M tokens)
    property_details: PropertyDetails,
) -> Result<()>
```

##### 2. `mint_property_tokens`
- Emite tokens para investidores (**requer KYC via SAS**)
- Verifica SAS attestation (TODO: implementar verificação)
- Atualiza circulating_supply
- Emite evento `TokensMinted`

```rust
pub fn mint_property_tokens(
    ctx: Context<MintPropertyTokens>,
    amount: u64,
) -> Result<()>
```

**Validações**:
- Property deve estar ativa (`is_active = true`)
- Não pode exceder `total_supply`
- Investidor deve ter SAS attestation válido (KYC)

##### 3. `burn_property_tokens`
- Queima tokens do investidor (resgate/venda)
- Reduz circulating_supply
- Emite evento `TokensBurned`

##### 4. `update_property_details`
- Atualiza metadados do imóvel (apenas authority)
- Atualiza `metadata_uri`, `total_value_usd`, `rental_yield_bps`, etc.
- Emite evento `PropertyUpdated`

##### 5. `toggle_property_status`
- Ativa/desativa propriedade (apenas authority)
- Bloqueia/desbloqueia mint de novos tokens
- Emite evento `PropertyStatusChanged`

#### **Eventos para Auditoria**

```rust
- PropertyInitialized: Criação de novo imóvel tokenizado
- TokensMinted: Emissão de tokens para investidor
- TokensBurned: Queima de tokens (resgates)
- PropertyUpdated: Atualização de metadados
- PropertyStatusChanged: Mudança de status ativo/inativo
```

### **Integração com SAS (Solana Attestation Service)**

#### Como Funciona

1. **Usuário faz KYC via Civic Pass** (ou outro provedor SAS)
2. **SAS emite attestation on-chain** contendo claim "KYC verified"
3. **Nosso programa verifica attestation** antes de mint tokens
4. **Sem PII on-chain** - apenas attestations verificáveis

#### Implementação (TODO)

```rust
// Em mint_property_tokens
fn verify_sas_attestation(attestation_account: &AccountInfo) -> Result<()> {
    // 1. Verificar que attestation é do programa SAS
    // 2. Verificar que attestation não expirou
    // 3. Verificar que claim contém "KYC verified"
    // 4. Verificar que subject é o investidor
    Ok(())
}
```

#### SDK SAS

```bash
# Rust (on-chain)
cargo add solana-attestation-service-client

# TypeScript (off-chain)
npm install @solana-foundation/sas-lib
```

**Repositório Oficial**: https://github.com/solana-foundation/solana-attestation-service

## 🔐 Segurança e Compliance

### **Regras Implementadas**

✅ **Zero PII on-chain**: Apenas hashes e attestations
✅ **KYC obrigatório**: Via SAS antes de mint
✅ **Authority controls**: Apenas admin pode mint/update
✅ **Supply limits**: Circulating supply ≤ total supply
✅ **Audit trail**: Eventos Anchor para todas operações
✅ **Metadata off-chain**: IPFS/Arweave para documentos

### **Fluxo de Compliance**

1. **Usuário** acessa app e faz KYC via Civic Pass
2. **Civic** emite SAS attestation on-chain
3. **Admin** verifica KYC aprovado via dashboard
4. **Admin** chama `mint_property_tokens` para investidor
5. **Programa** verifica SAS attestation e emite tokens
6. **Eventos** são indexados para auditoria

## ⚠️ Status Atual

### **Implementado**

- ✅ Programa Anchor completo (446 linhas)
- ✅ 5 instruções core (initialize, mint, burn, update, toggle)
- ✅ PropertyState PDA com metadados completos
- ✅ Eventos Anchor para auditoria
- ✅ Token-2022 integration
- ✅ Documentação completa

### **Pendente**

- ❌ **Compilação**: Conflito Solana BPF toolchain (rustc 1.75.0-dev vs 1.79.0+)
- ❌ **SAS Integration**: Implementar `verify_sas_attestation`
- ❌ **Testes**: Anchor tests para todos os cenários
- ❌ **Backend**: NestJS para interações Solana + SAS
- ❌ **Frontend**: React com Civic Pass SDK

## 🔧 Problema de Compilação

### **Erro Atual**

```bash
error: package `toml_parser v1.0.4` cannot be built because it requires
rustc 1.76 or newer, while the currently active rustc version is 1.75.0-dev
```

### **Causa**

Solana BPF toolchain usa rustc 1.75.0-dev, mas Anchor 0.30.1 dependencies requerem 1.76+

### **Soluções Possíveis**

#### **Opção 1: Atualizar Agave (recomendado)**
```bash
# Solana está migrando para Agave
# https://github.com/anza-xyz/agave/wiki/Agave-Transition
```

#### **Opção 2: Usar Anchor CLI mais antigo**
```bash
avm use 0.29.0
# Ou instalar Anchor 0.29.0 manualmente
```

#### **Opção 3: Build sem BPF temporariamente**
```bash
# Para desenvolvimento/testes, usar solana-test-validator local
# sem necessidade de BPF build
```

## 📁 Estrutura do Código

```
programs/hub_token_program/src/
└── lib.rs (446 linhas)
    ├── Constants (PROPERTY_STATE_SEED, SAS_PROGRAM_ID)
    ├── Instructions
    │   ├── initialize_property
    │   ├── mint_property_tokens (com SAS verification)
    │   ├── burn_property_tokens
    │   ├── update_property_details
    │   └── toggle_property_status
    ├── Contexts (Anchor account validations)
    ├── State
    │   ├── PropertyState
    │   └── PropertyDetails
    ├── Events (PropertyInitialized, TokensMinted, etc.)
    └── Errors (RwaError enum)
```

## 🧪 Próximos Passos

### **1. Resolver Compilação**
- Migrar para Agave ou downgrade Anchor

### **2. Implementar Integração SAS**
```rust
// Adicionar dependência
[dependencies]
solana-attestation-service-client = "1.0"

// Implementar verificação
fn verify_sas_attestation(attestation: &Account<Attestation>) -> Result<()> {
    // Verificar claims, expiration, etc.
}
```

### **3. Criar Testes**
```typescript
describe("RWA Property Tokenization", () => {
  it("Initialize property mint", async () => {});
  it("Mint tokens to investor with KYC", async () => {});
  it("Reject mint without KYC", async () => {});
  it("Burn tokens (redemption)", async () => {});
  it("Update property metadata", async () => {});
  it("Toggle property status", async () => {});
});
```

### **4. Backend NestJS**
```typescript
// Civic Pass SDK integration
import { CivicAuthProvider } from '@civic/solana-gateway-react';

// SAS lib integration
import { createAttestation, verifyAttestation } from '@solana-foundation/sas-lib';

// API endpoints
POST /api/properties - Create new property
GET /api/properties - List properties
POST /api/invest - Mint tokens (verifica SAS)
POST /api/redeem - Burn tokens
```

### **5. Frontend React**
```tsx
// Civic Pass integration
<CivicAuthProvider>
  <PropertyMarketplace />
</CivicAuthProvider>

// Fluxo
1. Connect wallet (Phantom)
2. Get KYC via Civic Pass
3. Browse properties
4. Invest (com validação SAS)
```

## 📚 Referências

- **Solana Attestation Service**: https://attest.solana.com
- **SAS GitHub**: https://github.com/solana-foundation/solana-attestation-service
- **Civic Pass**: https://docs.civic.com/pass/integration-guide/solana
- **Anchor Framework**: https://www.anchor-lang.com
- **Token-2022**: https://spl.solana.com/token-2022
- **Agave Transition**: https://github.com/anza-xyz/agave/wiki/Agave-Transition

## 🎯 Arquitetura Simplificada

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ Phantom Wallet │  │  Civic Pass    │  │  Property    │  │
│  │   Integration  │  │      KYC       │  │  Marketplace │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    BACKEND (NestJS)                          │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ Solana Web3.js │  │   SAS Client   │  │  IPFS/       │  │
│  │   Client       │  │   Integration  │  │  Arweave     │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    SOLANA BLOCKCHAIN                         │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ HUB Token      │  │  Solana        │  │  Token-2022  │  │
│  │ Program (RWA)  │←─│  Attestation   │  │   Program    │  │
│  │                │  │  Service (SAS) │  │              │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 💡 Conceito de Negócio

### **Exemplo de Uso**

**Imóvel**: Edifício comercial em São Paulo
**Valor**: $1,000,000 USD
**Tokenização**: 1,000,000 tokens (1 token = $1 USD)
**Rental Yield**: 8% ao ano

**Investidor**:
1. Faz KYC via Civic Pass ($15 one-time)
2. Compra 10,000 tokens ($10,000 USD)
3. Recebe 800 tokens/ano em dividendos (8% yield)
4. Pode vender tokens a qualquer momento (liquidez)

**Benefícios**:
- ✅ Investimento fracionado (a partir de $100)
- ✅ Liquidez 24/7 (transferências on-chain)
- ✅ Transparência total (blockchain)
- ✅ Compliance automático (SAS)
- ✅ Sem intermediários (custos reduzidos)

---

**Status**: Programa implementado, aguardando resolução de conflitos de compilação.
**Próximo passo**: Resolver toolchain ou testar com solana-test-validator local.
