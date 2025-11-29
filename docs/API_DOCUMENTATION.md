# HUB Token Program - API Documentation

## Visão Geral

Programa Solana para tokenização de imóveis (RWA - Real World Assets) com verificação KYC via Solana Attestation Service (SAS).

**Program ID**: `CA7Z9VgsUuDWZreqaUfJztBgEgi6ksW9iyW9pjvMarKU`

---

## 📋 Índice

1. [Tipos de Dados](#tipos-de-dados)
2. [Contas (Accounts)](#contas-accounts)
3. [Instruções (Instructions)](#instruções-instructions)
4. [Eventos (Events)](#eventos-events)
5. [Erros (Errors)](#erros-errors)
6. [Fluxo de Integração](#fluxo-de-integração)
7. [Exemplos de Uso](#exemplos-de-uso)

---

## Tipos de Dados

### PropertyDetails

Estrutura que armazena detalhes do imóvel tokenizado.

```rust
pub struct PropertyDetails {
    pub property_address: String,    // max 200 chars
    pub property_type: String,        // max 100 chars
    pub total_value_usd: u64,        // Valor em centavos (ex: 100000000 = $1,000,000)
    pub rental_yield_bps: u16,       // Basis points (ex: 800 = 8%)
    pub metadata_uri: String,        // max 500 chars (IPFS/Arweave)
}
```

**TypeScript**:
```typescript
type PropertyDetails = {
  propertyAddress: string;
  propertyType: string;
  totalValueUsd: BN;          // anchor.BN
  rentalYieldBps: number;
  metadataUri: string;
};
```

**Campos**:
- `property_address`: Endereço físico do imóvel (ex: "Av. Paulista, 1000, São Paulo - SP")
- `property_type`: Tipo do imóvel (ex: "Commercial Office Building", "Residential Apartment")
- `total_value_usd`: Valor total em centavos de dólar (para evitar problemas com decimais)
- `rental_yield_bps`: Rendimento de aluguel em basis points (100 bps = 1%, 10000 bps = 100%)
- `metadata_uri`: URI para metadados adicionais (imagens, documentos, etc.)

---

## Contas (Accounts)

### PropertyState

Conta principal que armazena o estado de um imóvel tokenizado.

**PDA Seeds**: `["property", mint_pubkey]`

```rust
#[account]
pub struct PropertyState {
    pub authority: Pubkey,           // 32 bytes
    pub mint: Pubkey,                // 32 bytes
    pub property_name: String,       // 4 + max 50 chars
    pub property_symbol: String,     // 4 + max 10 chars
    pub total_supply: u64,           // 8 bytes
    pub circulating_supply: u64,     // 8 bytes
    pub details: PropertyDetails,    // ~800 bytes
    pub is_active: bool,             // 1 byte
    pub created_at: i64,             // 8 bytes
    pub updated_at: i64,             // 8 bytes
    pub bump: u8,                    // 1 byte
}
```

**Tamanho aproximado**: ~1000 bytes + discriminator (8 bytes)

**TypeScript**:
```typescript
type PropertyState = {
  authority: PublicKey;
  mint: PublicKey;
  propertyName: string;
  propertySymbol: string;
  totalSupply: BN;
  circulatingSupply: BN;
  details: PropertyDetails;
  isActive: boolean;
  createdAt: BN;
  updatedAt: BN;
  bump: number;
};
```

---

## Instruções (Instructions)

### 1. initialize_property

Inicializa um novo imóvel tokenizado.

**Parâmetros**:
```rust
decimals: u8,
property_name: String,
property_symbol: String,
total_supply: u64,
property_details: PropertyDetails
```

**Contas**:
```typescript
{
  authority: Signer,              // Dono do imóvel
  propertyState: PDA (mut),       // PDA derivado de ["property", mint]
  mint: Signer (mut),             // Novo mint para os tokens
  tokenProgram: Token2022,
  systemProgram: SystemProgram,
  rent: Sysvar
}
```

**Validações**:
- `property_name` não vazio e <= 50 caracteres
- `property_symbol` não vazio e <= 10 caracteres
- `rental_yield_bps` <= 10000 (100%)
- `metadata_uri` não vazio

**Evento Emitido**: `PropertyInitialized`

**Exemplo TypeScript**:
```typescript
const [propertyStatePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("property"), mint.publicKey.toBuffer()],
  program.programId
);

await program.methods
  .initializeProperty(
    6,                           // decimals
    "Edifício Santos Dumont",
    "EDSANTO",
    new BN(1_000_000_000_000),   // 1M tokens com 6 decimais
    {
      propertyAddress: "Av. Paulista, 1000, SP",
      propertyType: "Commercial",
      totalValueUsd: new BN(100_000_000), // $1M
      rentalYieldBps: 800,                // 8%
      metadataUri: "ipfs://Qm..."
    }
  )
  .accounts({
    authority: authority.publicKey,
    propertyState: propertyStatePda,
    mint: mint.publicKey,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .signers([authority, mint])
  .rpc();
```

---

### 2. mint_property_tokens

Minta tokens para investidores (requer KYC via SAS).

**Parâmetros**:
```rust
amount: u64
```

**Contas**:
```typescript
{
  authority: Signer (mut),           // Authority do PropertyState
  propertyState: PDA (mut),
  mint: Token2022Mint (mut),
  investor: PublicKey,               // Investidor que receberá tokens
  investorTokenAccount: ATA (mut),   // Associated Token Account
  investorAttestation: SAS Account,  // ⚠️ Conta de atestação SAS
  tokenProgram: Token2022,
  associatedTokenProgram: ATA,
  systemProgram: SystemProgram
}
```

**Validações**:
- Property deve estar ativa (`is_active = true`)
- `circulating_supply + amount <= total_supply`
- Verificação SAS:
  - Account owner = SAS_PROGRAM_ID
  - Subject = investor pubkey
  - Não expirado
  - `is_valid = true`

**Evento Emitido**: `TokensMinted`, `SasVerificationSuccess`

**Exemplo TypeScript**:
```typescript
const investorTokenAccount = getAssociatedTokenAddressSync(
  mint.publicKey,
  investor.publicKey,
  false,
  TOKEN_2022_PROGRAM_ID
);

await program.methods
  .mintPropertyTokens(new BN(100_000_000_000)) // 100k tokens
  .accounts({
    authority: authority.publicKey,
    propertyState: propertyStatePda,
    mint: mint.publicKey,
    investor: investor.publicKey,
    investorTokenAccount,
    investorAttestation: attestationPubkey,  // Do SAS
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([authority])
  .rpc();
```

---

### 3. burn_property_tokens

Queima tokens do investidor (resgate/redemption).

**Parâmetros**:
```rust
amount: u64
```

**Contas**:
```typescript
{
  investor: Signer (mut),            // Dono dos tokens
  propertyState: PDA (mut),
  mint: Token2022Mint (mut),
  investorTokenAccount: ATA (mut),
  tokenProgram: Token2022
}
```

**Validações**:
- Balance do investidor >= amount

**Evento Emitido**: `TokensBurned`

**Exemplo TypeScript**:
```typescript
await program.methods
  .burnPropertyTokens(new BN(10_000_000_000)) // 10k tokens
  .accounts({
    investor: investor.publicKey,
    propertyState: propertyStatePda,
    mint: mint.publicKey,
    investorTokenAccount,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
  })
  .signers([investor])
  .rpc();
```

---

### 4. update_property_details

Atualiza detalhes do imóvel (somente authority).

**Parâmetros**:
```rust
new_details: PropertyDetails
```

**Contas**:
```typescript
{
  authority: Signer (mut),
  propertyState: PDA (mut),
  mint: Token2022Mint
}
```

**Validações**:
- Caller deve ser authority
- `rental_yield_bps` <= 10000

**Evento Emitido**: `PropertyUpdated`

**Exemplo TypeScript**:
```typescript
await program.methods
  .updatePropertyDetails({
    propertyAddress: "Av. Paulista, 1000 - Updated",
    propertyType: "Mixed Use",
    totalValueUsd: new BN(120_000_000), // Valorização
    rentalYieldBps: 850,
    metadataUri: "ipfs://Qm..."
  })
  .accounts({
    authority: authority.publicKey,
    propertyState: propertyStatePda,
    mint: mint.publicKey,
  })
  .signers([authority])
  .rpc();
```

---

### 5. toggle_property_status

Ativa/desativa o imóvel (somente authority).

**Parâmetros**: Nenhum

**Contas**:
```typescript
{
  authority: Signer (mut),
  propertyState: PDA (mut),
  mint: Token2022Mint
}
```

**Validações**:
- Caller deve ser authority

**Evento Emitido**: `PropertyStatusChanged`

**Exemplo TypeScript**:
```typescript
await program.methods
  .togglePropertyStatus()
  .accounts({
    authority: authority.publicKey,
    propertyState: propertyStatePda,
    mint: mint.publicKey,
  })
  .signers([authority])
  .rpc();
```

---

## Eventos (Events)

### PropertyInitialized
```rust
{
  mint: Pubkey,
  authority: Pubkey,
  property_name: String,
  total_supply: u64,
  timestamp: i64
}
```

### TokensMinted
```rust
{
  mint: Pubkey,
  investor: Pubkey,
  amount: u64,
  circulating_supply: u64,
  timestamp: i64
}
```

### TokensBurned
```rust
{
  mint: Pubkey,
  investor: Pubkey,
  amount: u64,
  circulating_supply: u64,
  timestamp: i64
}
```

### PropertyUpdated
```rust
{
  mint: Pubkey,
  property_address: String,
  total_value_usd: u64,
  rental_yield_bps: u16,
  timestamp: i64
}
```

### PropertyStatusChanged
```rust
{
  mint: Pubkey,
  is_active: bool,
  timestamp: i64
}
```

### SasVerificationSuccess
```rust
{
  investor: Pubkey,
  property: Pubkey,
  attestation: Pubkey,
  timestamp: i64
}
```

### SasVerificationFailed
```rust
{
  investor: Pubkey,
  property: Pubkey,
  reason: String,
  timestamp: i64
}
```

---

## Erros (Errors)

| Código | Nome | Descrição |
|--------|------|-----------|
| 6000 | `Unauthorized` | Apenas authority pode executar esta ação |
| 6001 | `KycVerificationRequired` | Atestação SAS não encontrada ou inválida |
| 6002 | `SasAttestationExpired` | Atestação SAS expirada |
| 6003 | `SasAttestationNotVerified` | Atestação SAS não verificada |
| 6004 | `InvalidSasProgram` | Program ID do SAS inválido |
| 6005 | `PropertyNotActive` | Imóvel não está ativo |
| 6006 | `ExceedsMaxSupply` | Mintagem excederia supply máximo |
| 6007 | `InsufficientBalance` | Saldo de tokens insuficiente |
| 6008 | `InvalidPropertyName` | Nome do imóvel vazio ou muito longo |
| 6009 | `InvalidPropertySymbol` | Símbolo do imóvel vazio ou muito longo |
| 6010 | `InvalidRentalYield` | Yield deve estar entre 0-10000 bps |
| 6011 | `InvalidMint` | Conta mint inválida |
| 6012 | `InvalidMetadataUri` | URI de metadata inválida |

---

## Fluxo de Integração

### 1. Integração SAS (Solana Attestation Service)

#### Pré-requisitos
1. Deploy do SAS program ou uso do SAS da Solana Foundation
2. Integração com Civic Pass ou outro provedor KYC
3. Atualizar `SAS_PROGRAM_ID` em `constants.rs`

#### Fluxo de KYC do Investidor

```
┌─────────────┐
│  Investor   │
└──────┬──────┘
       │ 1. Complete KYC
       v
┌─────────────┐
│   Civic     │
│   Pass      │
└──────┬──────┘
       │ 2. Issue Civic Pass
       v
┌─────────────┐
│     SAS     │
│   Program   │
└──────┬──────┘
       │ 3. Create Attestation Account
       v
┌─────────────┐
│ Attestation │ ───> Usado em mint_property_tokens
│  Account    │
└─────────────┘
```

#### Estrutura da Attestation Account (SAS)

```rust
pub struct SasAttestation {
    pub subject: Pubkey,      // Investidor
    pub issuer: Pubkey,       // Provedor KYC (ex: Civic)
    pub data: [u8; 32],       // Hash dos dados KYC
    pub expiration: i64,      // Unix timestamp
    pub is_valid: bool,       // Flag de validação
    pub created_at: i64,
    pub updated_at: i64,
}
```

### 2. Fluxo Completo de Investimento

```typescript
// PASSO 1: Inicializar Imóvel
const mint = Keypair.generate();
const [propertyState] = PublicKey.findProgramAddressSync(
  [Buffer.from("property"), mint.publicKey.toBuffer()],
  program.programId
);

await program.methods
  .initializeProperty(...)
  .accounts({ ... })
  .rpc();

// PASSO 2: Investidor completa KYC (off-chain)
// - Usuário completa KYC com Civic
// - Civic emite Civic Pass
// - SAS cria attestation account

// PASSO 3: Mintar tokens para investidor
const investorAta = getAssociatedTokenAddressSync(...);

await program.methods
  .mintPropertyTokens(amount)
  .accounts({
    ...
    investorAttestation: attestationPubkey // Do SAS
  })
  .rpc();

// PASSO 4: Investidor mantém tokens
// - Recebe rendimentos proporcionais (off-chain)
// - Pode negociar no mercado secundário

// PASSO 5: Atualizar valor do imóvel
await program.methods
  .updatePropertyDetails(newDetails)
  .rpc();

// PASSO 6: Investidor resgata tokens
await program.methods
  .burnPropertyTokens(amount)
  .rpc();
```

---

## Exemplos de Uso

### Setup Inicial

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { HubTokenProgram } from "../target/types/hub_token_program";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.HubTokenProgram as Program<HubTokenProgram>;
```

### Exemplo 1: Tokenizar Imóvel

```typescript
const authority = Keypair.generate();
const mint = Keypair.generate();

const [propertyState, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("property"), mint.publicKey.toBuffer()],
  program.programId
);

const tx = await program.methods
  .initializeProperty(
    6,                                    // 6 decimais
    "Torre Empresarial Faria Lima",      // Nome
    "TEFL",                              // Símbolo
    new BN(10_000_000 * 1e6),            // 10M tokens
    {
      propertyAddress: "Av. Faria Lima, 3500, São Paulo",
      propertyType: "Commercial Office Building",
      totalValueUsd: new BN(50_000_000 * 100), // $50M
      rentalYieldBps: 750,                      // 7.5%
      metadataUri: "ipfs://QmPropertyDetails...",
    }
  )
  .accounts({
    authority: authority.publicKey,
    propertyState,
    mint: mint.publicKey,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  })
  .signers([authority, mint])
  .rpc();

console.log("Imóvel tokenizado:", tx);
console.log("Mint:", mint.publicKey.toString());
console.log("Property State:", propertyState.toString());
```

### Exemplo 2: Investir em Imóvel

```typescript
const investor = Keypair.generate();
const investmentAmount = new BN(100_000 * 1e6); // 100k tokens

// Obter atestação SAS do investidor (off-chain)
const attestationPubkey = await getSasAttestation(investor.publicKey);

const investorAta = getAssociatedTokenAddressSync(
  mint.publicKey,
  investor.publicKey,
  false,
  TOKEN_2022_PROGRAM_ID
);

const tx = await program.methods
  .mintPropertyTokens(investmentAmount)
  .accounts({
    authority: authority.publicKey,
    propertyState,
    mint: mint.publicKey,
    investor: investor.publicKey,
    investorTokenAccount: investorAta,
    investorAttestation: attestationPubkey,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([authority])
  .rpc();

console.log("Tokens mintados:", tx);
console.log("Ownership:", (100_000 / 10_000_000 * 100).toFixed(2) + "%");
```

### Exemplo 3: Resgatar Investimento

```typescript
const redeemAmount = new BN(50_000 * 1e6); // Resgatar 50k tokens

const tx = await program.methods
  .burnPropertyTokens(redeemAmount)
  .accounts({
    investor: investor.publicKey,
    propertyState,
    mint: mint.publicKey,
    investorTokenAccount: investorAta,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
  })
  .signers([investor])
  .rpc();

console.log("Tokens queimados:", tx);
console.log("Valor resgatado:", "$" + (50_000 / 10_000_000 * 50_000_000).toLocaleString());
```

### Exemplo 4: Atualizar Valor do Imóvel

```typescript
const tx = await program.methods
  .updatePropertyDetails({
    propertyAddress: "Av. Faria Lima, 3500, São Paulo",
    propertyType: "Commercial Office Building",
    totalValueUsd: new BN(55_000_000 * 100), // Valorização: $50M → $55M
    rentalYieldBps: 780,                      // Novo yield: 7.8%
    metadataUri: "ipfs://QmUpdatedDetails...",
  })
  .accounts({
    authority: authority.publicKey,
    propertyState,
    mint: mint.publicKey,
  })
  .signers([authority])
  .rpc();

console.log("Imóvel atualizado:", tx);
console.log("Nova avaliação: $55M (+10%)");
```

---

## Cálculos Úteis

### Conversão de Valores

```typescript
// USD para centavos
const usdToCents = (usd: number): BN => new BN(usd * 100);

// Centavos para USD
const centsToUsd = (cents: BN): number => cents.toNumber() / 100;

// Percentual para Basis Points
const percentToBps = (percent: number): number => Math.floor(percent * 100);

// Basis Points para Percentual
const bpsToPercent = (bps: number): number => bps / 100;

// Calcular ownership %
const calculateOwnership = (tokens: BN, totalSupply: BN): number => {
  return (tokens.toNumber() / totalSupply.toNumber()) * 100;
};

// Calcular valor do investimento
const calculateInvestmentValue = (
  tokens: BN,
  totalSupply: BN,
  propertyValueCents: BN
): number => {
  const ownership = tokens.toNumber() / totalSupply.toNumber();
  return (ownership * propertyValueCents.toNumber()) / 100;
};
```

### Exemplo de Cálculos

```typescript
const totalSupply = new BN(10_000_000 * 1e6);
const investorTokens = new BN(500_000 * 1e6);
const propertyValue = new BN(50_000_000 * 100); // $50M

// Ownership
const ownership = calculateOwnership(investorTokens, totalSupply);
console.log("Ownership:", ownership + "%"); // 5%

// Valor do investimento
const investmentValue = calculateInvestmentValue(
  investorTokens,
  totalSupply,
  propertyValue
);
console.log("Valor:", "$" + investmentValue.toLocaleString()); // $2,500,000

// Rendimento anual estimado (7.5%)
const rentalYieldBps = 750;
const annualIncome = investmentValue * (rentalYieldBps / 10000);
console.log("Renda anual:", "$" + annualIncome.toLocaleString()); // $187,500
```

---

## Segurança e Boas Práticas

### ⚠️ Avisos Importantes

1. **SAS Program ID**: Atualizar `constants.rs` com o ID real do SAS antes de produção
2. **KYC Validation**: Sempre verificar atestações SAS antes de mintar tokens
3. **Authority Control**: Proteger chaves privadas do authority (multi-sig recomendado)
4. **Supply Management**: Garantir que `total_supply` não será excedido
5. **Metadata**: Armazenar documentos importantes em IPFS/Arweave (imutável)

### Recomendações de Segurança

```typescript
// ✅ BOM: Usar multi-sig para authority
const multisig = new PublicKey("...");

// ✅ BOM: Validar atestação antes de transação
const isValid = await validateSasAttestation(attestationPubkey);
if (!isValid) throw new Error("KYC inválido");

// ✅ BOM: Verificar supply antes de mintar
const propertyState = await program.account.propertyState.fetch(...);
if (propertyState.circulatingSupply.add(amount).gt(propertyState.totalSupply)) {
  throw new Error("Excede supply máximo");
}

// ❌ MAU: Nunca expor chaves privadas
// const authority = Keypair.fromSecretKey(hardcodedKey);
```

---

## Testes

Execute os testes completos:

```bash
# Iniciar validador local
solana-test-validator

# Em outro terminal
cd hub_token_program
anchor test --skip-local-validator
```

Os testes cobrem:
- ✅ Inicialização de propriedades
- ✅ Validações de input
- ✅ Minting com KYC (SAS)
- ✅ Burning de tokens
- ✅ Atualização de detalhes
- ✅ Gerenciamento de status
- ✅ Fluxo end-to-end completo

---

## Recursos Adicionais

- **Solana Attestation Service**: https://attest.solana.com
- **Civic Pass**: https://docs.civic.com
- **Token-2022**: https://spl.solana.com/token-2022
- **Anchor Framework**: https://www.anchor-lang.com
- **MCP Solana**: https://mcp.solana.com

---

## Licença

Este programa é fornecido como está, sem garantias. Use por sua conta e risco.

## Suporte

Para questões e suporte, consulte a documentação oficial da Solana e Anchor.
