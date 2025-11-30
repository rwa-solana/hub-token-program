# HUB Token Program - Documentação Completa

## Tokenização Imobiliária com KYC Compliance (RWA - Real World Assets)

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Instalação](#2-instalação)
3. [Testes Locais](#3-testes-locais)
4. [Deploy na Devnet](#4-deploy-na-devnet)
5. [Deploy na Mainnet](#5-deploy-na-mainnet)
6. [Verificação de Contratos](#6-verificação-de-contratos)
7. [Comandos Úteis](#7-comandos-úteis)
8. [Arquitetura do Programa](#8-arquitetura-do-programa)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Pré-requisitos

### ⚠️ Importante para usuários macOS (M1/M2/M3)

Se você encontrar o erro:
```
Error: failed to start validator: Failed to create ledger at test-ledger:
io error: Error checking to unpack genesis archive: Archive error:
extra entry found: "._genesis.bin" Regular
```

**Solução**: O macOS usa BSD tar, mas o Solana precisa do GNU tar:

```bash
# Instalar GNU tar via Homebrew
brew install gnu-tar

# Adicionar ao seu ~/.zshrc (já foi feito automaticamente)
export PATH="/opt/homebrew/opt/gnu-tar/libexec/gnubin:$PATH"

# Aplicar mudanças no terminal atual
source ~/.zshrc

# Limpar ledgers corrompidos
rm -rf test-ledger .anchor/test-ledger /tmp/solana-test-ledger
find ~/.local/share/solana -name "._*" -type f -delete
```

Agora o `solana-test-validator` funcionará corretamente! ✅

---

### Instalar Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup default stable
```

### Instalar Solana CLI (Agave)
```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verificar instalação
solana --version
# Esperado: solana-cli 2.x.x ou agave 3.x.x
```

### Instalar Anchor
```bash
# Via AVM (Anchor Version Manager) - Recomendado
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1

# Verificar instalação
anchor --version
# Esperado: anchor-cli 0.30.1
```

### Instalar Node.js e Yarn
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Yarn
npm install -g yarn
```

---

## 2. Instalação

### Clonar e configurar o projeto
```bash
cd /path/to/hub_token_program

# Instalar dependências Node
yarn install

# Build do programa
anchor build

# Gerar IDL customizado (necessário para Anchor 0.32 CLI com 0.30.1 lang)
node scripts/generate-idl.js
```

### Configurar Wallet
```bash
# Gerar nova wallet (se não tiver)
solana-keygen new --outfile ~/.config/solana/id.json

# Ver endereço da wallet
solana address

# Configurar para localhost (testes)
solana config set --url localhost
```

---

## 3. Testes Locais

### Opção A: Usando Makefile (mais fácil)
```bash
# Iniciar validador local
make validator-start

# Em outro terminal, configurar CLI para localhost
make localhost

# Solicitar airdrop de SOL
make airdrop

# Fazer build e deploy
make anchor-build
anchor deploy --provider.cluster localhost

# Parar validador
make validator-stop

# Ver todos os comandos disponíveis
make help
```

### Opção B: Teste completo com Anchor (automático)
```bash
# Inicia validator, deploya e roda testes automaticamente
anchor test

# Output esperado:
# 18 passing
```

### Opção B: Passo a passo manual

#### 3.1 Iniciar Test Validator
```bash
# Terminal 1: Inicia o validator local
solana-test-validator --reset

# Aguarde aparecer "Processed Slot: X"
```

#### 3.2 Configurar para localhost
```bash
# Terminal 2
solana config set --url localhost

# Verificar saldo (deve ter 500M SOL)
solana balance
```

#### 3.3 Build e Deploy
```bash
# Build
anchor build

# Deploy
anchor deploy

# Output:
# Program Id: Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z
```

#### 3.4 Rodar Testes
```bash
# Roda testes sem reiniciar validator
anchor test --skip-local-validator
```

### Ver logs do programa
```bash
# Em outro terminal, enquanto roda testes
solana logs
```

---

## 4. Deploy na Devnet

### 4.1 Configurar para Devnet
```bash
# Mudar para devnet
solana config set --url devnet

# Verificar configuração
solana config get
```

### 4.2 Obter SOL de teste
```bash
# Airdrop (máximo 2 SOL por request)
solana airdrop 2

# Repetir se necessário
solana airdrop 2

# Verificar saldo
solana balance
```

### 4.3 Atualizar Anchor.toml
```toml
# Anchor.toml
[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[programs.devnet]
hub_token_program = "Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z"
```

### 4.4 Build e Deploy
```bash
# Build
anchor build

# Deploy para devnet
anchor deploy --provider.cluster devnet

# Ou usando solana diretamente (mais controle)
solana program deploy \
  --program-id target/deploy/hub_token_program-keypair.json \
  target/deploy/hub_token_program.so \
  --url devnet
```

### 4.5 Verificar Deploy
```bash
# Ver informações do programa
solana program show Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z --url devnet

# Output:
# Program Id: Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# ProgramData Address: ...
# Authority: <sua wallet>
# Last Deployed In Slot: ...
# Data Length: ... bytes
# Balance: ... SOL
```

### 4.6 Rodar Testes na Devnet
```bash
# Atualizar Anchor.toml para devnet primeiro
anchor test --provider.cluster devnet --skip-deploy
```

---

## 5. Deploy na Mainnet

### ⚠️ CHECKLIST PRÉ-MAINNET

```
□ Todos os testes passando
□ Auditoria de segurança realizada
□ Testado extensivamente na devnet
□ Wallet com SOL suficiente (~3-5 SOL para deploy)
□ Backup da keypair do programa
□ Decisão sobre upgrade authority (manter ou revogar)
```

### 5.1 Configurar para Mainnet
```bash
# Mudar para mainnet
solana config set --url mainnet-beta

# Verificar saldo (precisa de SOL REAL)
solana balance
```

### 5.2 Atualizar Anchor.toml
```toml
# Anchor.toml
[provider]
cluster = "mainnet"
wallet = "~/.config/solana/id.json"

[programs.mainnet]
hub_token_program = "Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z"
```

### 5.3 Deploy para Mainnet
```bash
# Build final
anchor build

# Deploy (CUIDADO: usa SOL real!)
anchor deploy --provider.cluster mainnet

# Ou com mais controle
solana program deploy \
  --program-id target/deploy/hub_token_program-keypair.json \
  target/deploy/hub_token_program.so \
  --url mainnet-beta \
  --with-compute-unit-price 1000 \
  --max-sign-attempts 5
```

### 5.4 Verificar Deploy na Mainnet
```bash
solana program show Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z --url mainnet-beta
```

---

## 6. Verificação de Contratos

### Diferenças Solana vs Ethereum

| Aspecto | Ethereum | Solana |
|---------|----------|--------|
| Verificação | Etherscan verifica bytecode | Não há equivalente direto |
| Código fonte | Upload para Etherscan | Publicar no GitHub/Anchor Registry |
| Imutabilidade | Contratos são imutáveis | Programas são upgradeable por padrão |
| Interface | ABI | IDL (Interface Definition Language) |

### 6.1 Anchor Verified Builds

O Anchor oferece "Verified Builds" que permitem verificar que o binário deployado corresponde ao código fonte.

```bash
# Criar build verificável (usa Docker para reproducibilidade)
anchor build --verifiable

# O output inclui um hash do build que pode ser verificado
```

### 6.2 Publicar no Anchor Registry
```bash
# Login no registry
anchor login

# Publicar programa
anchor publish hub_token_program

# Isso publica:
# - Código fonte
# - IDL
# - Build verificável
```

### 6.3 Publicar IDL On-chain
```bash
# O IDL é publicado automaticamente no deploy com Anchor
# Para publicar/atualizar manualmente:
anchor idl init --filepath target/idl/hub_token_program.json Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z

# Atualizar IDL existente
anchor idl upgrade --filepath target/idl/hub_token_program.json Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z
```

### 6.4 Tornar Programa Imutável (Opcional)

**⚠️ ATENÇÃO: Isso é IRREVERSÍVEL!**

```bash
# Remove a autoridade de upgrade - programa fica imutável PARA SEMPRE
solana program set-upgrade-authority \
  Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z \
  --final

# Verificar que não tem mais upgrade authority
solana program show Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z
# Authority: none (imutável)
```

### 6.5 Transferir Upgrade Authority

Para transferir controle do programa para uma multisig ou outra entidade:

```bash
# Transferir autoridade para outro endereço
solana program set-upgrade-authority \
  Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z \
  --new-upgrade-authority <NOVA_AUTORIDADE>
```

### 6.6 Verificação Manual por Terceiros

Qualquer pessoa pode verificar o programa:

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-repo/hub-token-program

# 2. Build com mesma versão
anchor build --verifiable

# 3. Comparar hash do binário com o deployado
sha256sum target/deploy/hub_token_program.so

# 4. Dump do programa on-chain
solana program dump Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z program_dump.so

# 5. Comparar
sha256sum program_dump.so
# Se os hashes forem iguais, o código fonte corresponde ao deployado
```

---

## 7. Comandos Úteis

### Solana CLI
```bash
# Configuração
solana config get                          # Ver configuração atual
solana config set --url <URL>              # Mudar RPC
solana config set --keypair <PATH>         # Mudar wallet

# Wallet
solana address                             # Ver endereço
solana balance                             # Ver saldo
solana airdrop 2                           # Airdrop (devnet/testnet)

# Programa
solana program show <PROGRAM_ID>           # Info do programa
solana program dump <PROGRAM_ID> out.so    # Download do binário
solana logs                                # Ver logs em tempo real
solana logs <PROGRAM_ID>                   # Logs de programa específico

# Contas
solana account <ADDRESS>                   # Ver dados de conta
solana account <ADDRESS> --output json     # Output em JSON
```

### Anchor CLI
```bash
# Build
anchor build                               # Build normal
anchor build --verifiable                  # Build verificável (Docker)

# Deploy
anchor deploy                              # Deploy no cluster configurado
anchor deploy --provider.cluster devnet    # Deploy em cluster específico

# Teste
anchor test                                # Build + deploy + test
anchor test --skip-local-validator         # Só testes
anchor test --skip-deploy                  # Testes sem redeploy

# IDL
anchor idl init <PROGRAM_ID>               # Publicar IDL
anchor idl upgrade <PROGRAM_ID>            # Atualizar IDL
anchor idl fetch <PROGRAM_ID>              # Baixar IDL on-chain

# Keys
anchor keys list                           # Listar program IDs
anchor keys sync                           # Sincronizar IDs nos arquivos
```

### SPL Token (Token-2022)
```bash
# Criar token
spl-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb create-token

# Com Transfer Hook
spl-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  create-token --transfer-hook <PROGRAM_ID>

# Ver info do token
spl-token display <MINT_ADDRESS>

# Ver balance
spl-token balance <MINT_ADDRESS>
```

---

## 8. Arquitetura do Programa

### Instruções Disponíveis

| Instrução | Descrição | Quem pode chamar |
|-----------|-----------|------------------|
| `create_property_mint` | Cria propriedade tokenizada com TransferHook | Qualquer um (se torna authority) |
| `mint_property_tokens` | Emite tokens para investidor com KYC | Authority |
| `burn_property_tokens` | Queima tokens (resgate) | Holder dos tokens |
| `update_property_details` | Atualiza metadados do imóvel | Authority |
| `toggle_property_status` | Ativa/desativa operações | Authority |
| `initialize_extra_account_metas` | Setup manual do hook (backup) | Payer |
| `transfer_hook_execute` | Verifica KYC em transfers | Token-2022 (automático) |
| `deposit_revenue` | Deposita dividendos | Authority |
| `claim_revenue` | Resgata dividendo proporcional | Holder dos tokens |

### PDAs (Program Derived Addresses)

```
PropertyState:        ["property", mint]
ExtraAccountMetaList: ["extra-account-metas", mint]
RevenueEpoch:         ["revenue_epoch", propertyState, epochNumber]
ClaimRecord:          ["claim_record", revenueEpoch, investor]
RevenueVault:         ["revenue_vault", revenueEpoch]
```

### Eventos

```rust
PropertyInitialized    // Propriedade criada
TokensMinted           // Tokens emitidos
TokensBurned           // Tokens queimados
PropertyUpdated        // Metadados atualizados
PropertyStatusChanged  // Status alterado
SasVerificationSuccess // KYC verificado no mint
TransferKycVerified    // KYC verificado no transfer
RevenueDeposited       // Dividendo depositado
RevenueClaimed         // Dividendo resgatado
```

---

## 9. Troubleshooting

### Erro: "Account not found"
```bash
# Provavelmente o programa não está deployado
solana program show <PROGRAM_ID>

# Se não existir, fazer deploy
anchor deploy
```

### Erro: "Insufficient funds"
```bash
# Verificar saldo
solana balance

# Devnet: solicitar airdrop
solana airdrop 2

# Mainnet: precisa depositar SOL real
```

### Erro: "Program failed to complete"
```bash
# Ver logs detalhados
solana logs <PROGRAM_ID>

# Aumentar compute units no cliente
const tx = await program.methods
  .someInstruction()
  .accounts({...})
  .preInstructions([
    ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 })
  ])
  .rpc();
```

### Erro: "Transaction simulation failed"
```bash
# Simular transação para ver erro detalhado
const tx = await program.methods
  .someInstruction()
  .accounts({...})
  .simulate();

console.log(tx);
```

### Erro: "Blockhash not found"
```bash
# RPC pode estar congestionado, tentar:
# 1. Usar RPC diferente
solana config set --url https://api.mainnet-beta.solana.com

# 2. Ou usar RPC privado (Helius, QuickNode, etc)
solana config set --url https://rpc.helius.xyz/?api-key=<KEY>
```

### Test Validator não inicia (macOS)
```bash
# Usar Agave em vez de Solana Labs
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verificar versão
solana-test-validator --version
# Deve mostrar "Agave" não "SolanaLabs"
```

---

## Links Úteis

- **Solana Docs**: https://docs.solana.com
- **Anchor Book**: https://book.anchor-lang.com
- **Token-2022 Docs**: https://spl.solana.com/token-2022
- **Solana Explorer**: https://explorer.solana.com
- **Devnet Explorer**: https://explorer.solana.com/?cluster=devnet
- **SAS (Attestation)**: https://attest.solana.com
- **Civic Pass**: https://docs.civic.com

---

## Contato

Para dúvidas ou suporte, abra uma issue no repositório.

---

**Program ID**: `Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z`

**Versão**: 0.1.0

**Licença**: MIT
