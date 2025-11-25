Visão geral (resumo rápido)

On-chain (Anchor Rust): Token-2022 mint com TransferHook que impede transferências para quem não tiver KYC válido (PDA UserKyc). PropertyState para cada imóvel/mint. Emite eventos Anchor para auditoria.

Off-chain (KYC microservice): Issuer/Verifier de Verifiable Credentials (W3C DID/VC) que valida VC, calcula credential_hash = sha256(canonical_vc), e chama register_kyc on-chain (assinada pela autoridade admin).

Frontend: React/Next + Phantom — pede KYC via microserviço e prepara transferências incluindo contas extras (PDAs) que wallets suportem via ExtraAccountMetaList.

Indexer / Monitor (Go): escuta logs/events do programa, decodifica eventos Anchor, indexa em DB para auditoria/dashboard.

Regras principais: NUNCA PII on-chain — só hashes, timestamps, pubkeys, status; PDAs por usuário (seeded) para evitar write contention.

Arquitetura técnica (componentes e responsabilidades)

Smart Contract (Anchor/Rust)

Mints Token-2022 com TransferHook apontando ao programa.

PDAs:

UserKyc: seed ["kyc", user_pubkey] — campos: is_verified, expiration, credential_hash: [u8;32], authority.

PropertyState: seed ["property", mint_pubkey] — admin_authority, mint.

ExtraAccountMetaList: para instruir wallets a enviar o PDA do usuário destino quando fizer transfer.

Instruções:

initialize_token — cria mint Token-2022 + PropertyState + ExtraAccountMetaList.

register_kyc — callable apenas por admin_authority do PropertyState. Cria/atualiza UserKyc.

transfer_hook — implementa spl_transfer_hook_interface, valida KYC do destination.

Eventos Anchor: KycRegistered, KycUpdated, TransferBlocked{reason}, TransferAllowed.

KYC Microservice (NestJS / Node.js)

Funções:

Recebe VC JSON (do provedor/issuer ou UI), valida estruturalmente e data de validade.

Calcula credential_hash = sha256(canonical_json).

Constrói e envia transação register_kyc assinada pela admin keypair.

Endpoints:

POST /kyc/register — cria on-chain (retorna tx sig).

GET /kyc/status/:wallet — lê PDA UserKyc.

Assinatura off-chain: admin/issuer assina a transação; microserviço guarda keypair de modo seguro (KMS/Hardware/Secure file).

Frontend (React + Tailwind)

Integra com Phantom para conectar wallet.

Para transferências, requisita unsigned tx ao microserviço blockchain, que adiciona ExtraAccountMetaList/accounts extras e retorna para o cliente assinar.

Onboard KYC: chama POST /kyc/register com VC; mostra resultado.

Monitor/Indexer (Golang)

Escuta blocos, filtra transações do programa, decodifica events Anchor e grava em DB (SQLite/Postgres).

Dashboard que mostra KYC regs, transferências bloqueadas, timeline por propriedade.

Fluxo de KYC / Transferência (passo a passo)

Usuário obtém VC de um Issuer (ou o próprio microserviço faz emissão após documentos off-chain).

Microserviço valida VC (estrutura + assinatura do issuer, valid_until > now).

Microserviço serializa canonical JSON da VC, calcula SHA-256 → credential_hash.

Microserviço envia transação register_kyc(user_wallet, expiration, credential_hash) assinada pela admin_authority.

Programa on-chain grava/atualiza PDA UserKyc (sem PII).

Quando alguém tenta transferir tokens (Token-2022 chama TransferHook), transfer_hook derivará PDA UserKyc do destination e validará is_verified e expiration. Se inválido, a transferência é revertida e um evento TransferBlocked é emitido com razão.

Principais decisões técnicas e por quê

Token-2022 + TransferHook: permite que o programa valide transferências no momento do token-transfer, bloqueando tokens para não-verificados. Recomendado para RWA.

PDAs por usuário: seed ["kyc", user_pubkey] — evita contensão de escrita e localiza KYC rapidamente sem registrar PII.

ExtraAccountMetaList: instruir wallets para passarem contas extras (UserKyc PDA) ao construir a transação, para que o TransferHook tenha acesso sem exigir que o usuário faça passos manuais.

W3C DID + VC: fornece padrão interoperável para credenciais verificáveis (issuer signatures) e traz confiança institucional.

Eventos Anchor + msg!(): permitem indexação/monitoramento eficiente. Armazene somentes hashes, timestamps, pubkeys.

Segurança & privacidade (regras obrigatórias)

NUNCA enviar PII on-chain. Armazene apenas: credential_hash, is_verified, expiration, authority(pubkey).

Key management: admin keypair em HSM/KMS (Hashicorp Vault, AWS KMS or similar). Nunca comitar keypair no repo.

Replay / Freshness: expiration + credential_hash verificam validade; inclua também issued_at na VC e verifique off-chain.

Rate limiting & abuse protection: microservice deve ter rate limits, authentication (mTLS, JWT) e logging.

Tx authorization: register_kyc deve exigir sia uma assinatura do admin_authority no instruction accounts e o programa deve checar property_state.admin_authority == signer.

Audit trail: eventos Anchor com tx_signature e timestamp (indexador decodifica).

Handling missing ExtraAccount: se a carteira não enviar o UserKyc PDA, o program deve retornar erro claro MissingExtraAccount instruindo o usuário a usar uma carteira compatível.

Testes (essenciais)

Unit & integration (Anchor tests TS):

initialize_token cria mint + property state + extra account meta.

Try transfer to recipient without KYC → expect KycNotFound/blocked.

Register KYC via microservice (simulate signature + call) → PDA exists.

Transfer now → success.

Update KYC to expired → transfer fails with KycExpired.

Assert events emitted: KycRegistered, TransferBlocked, TransferAllowed.

E2E: run localnet with Anchor, run KYC microservice, run frontend sign flows.

Security tests: try to call register_kyc from non-admin → rejected.

Snippets essenciais (exemplos práticos)
1) Rust (Anchor) — esqueleto do transfer_hook e UserKyc struct

Nota: isto é um esqueleto focado nas partes críticas; implemente validações, erros e mais tipos conforme padrão Anchor.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_error::ProgramError;

declare_id!("YourProgramPubkeyHere...");

#[program]
pub mod real_estate_rwa {
    use super::*;

    pub fn initialize_token(ctx: Context<InitializeToken>, /* params */) -> Result<()> {
        // criar mint Token-2022 (CPI para token program v2022), configurar TransferHook,
        // criar PropertyState PDA e ExtraAccountMetaList (calls apropriadas)
        Ok(())
    }

    pub fn register_kyc(
        ctx: Context<RegisterKyc>,
        expiration: i64,
        credential_hash: [u8; 32],
        is_verified: bool,
    ) -> Result<()> {
        let kyc = &mut ctx.accounts.user_kyc;
        // authorize: ensure signer == property_state.admin_authority
        if ctx.accounts.admin.key() != ctx.accounts.property_state.admin_authority {
            return Err(error!(ErrorCode::Unauthorized));
        }
        kyc.is_verified = is_verified;
        kyc.expiration = expiration;
        kyc.credential_hash = credential_hash;
        kyc.authority = ctx.accounts.admin.key();
        emit!(KycRegistered {
            user: ctx.accounts.user.key(),
            property: ctx.accounts.property_state.mint,
            credential_hash,
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    // transfer_hook is invoked by Token-2022 via CPI
    pub fn transfer_hook(ctx: Context<TransferHookContext>) -> Result<()> {
        // destination must be provided in accounts list
        let destination = ctx.accounts.destination.key();
        let (kyc_pda, _bump) = Pubkey::find_program_address(&[b"kyc", destination.as_ref()], ctx.program_id);
        let kyc_account_info = ctx.remaining_accounts.iter()
            .find(|a| a.key == &kyc_pda)
            .ok_or(error!(ErrorCode::KycNotFound))?;

        // deserialize UserKyc
        let user_kyc: UserKyc = try_from_slice_unchecked(&kyc_account_info.data.borrow())?;

        if !user_kyc.is_verified { return Err(error!(ErrorCode::KycNotVerified)); }
        if Clock::get()?.unix_timestamp > user_kyc.expiration { return Err(error!(ErrorCode::KycExpired)); }

        emit!(TransferAllowed {
            from: ctx.accounts.source.key(),
            to: destination,
            property: ctx.accounts.property_state.mint,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[account]
pub struct UserKyc {
    pub is_verified: bool,
    pub expiration: i64,
    pub credential_hash: [u8; 32],
    pub authority: Pubkey,
}

#[account]
pub struct PropertyState {
    pub admin_authority: Pubkey,
    pub mint: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("KYC record not found")]
    KycNotFound,
    #[msg("KYC not verified")]
    KycNotVerified,
    #[msg("KYC expired")]
    KycExpired,
    #[msg("Unauthorized")]
    Unauthorized,
}

#[event]
pub struct KycRegistered {
    pub user: Pubkey,
    pub property: Pubkey,
    pub credential_hash: [u8;32],
    pub timestamp: i64,
}

#[event]
pub struct TransferAllowed {
    pub from: Pubkey,
    pub to: Pubkey,
    pub property: Pubkey,
    pub timestamp: i64,
}


Observações:

Implementar ExtraAccountMetaList::init e populá-la no initialize_token.

Serialização/deserialização cuidadosa: use Anchor borsh or anchor's account system.

Mensagens de erro e logs com msg!() contendo hashes e PDAs (não PII).

2) TypeScript (microservice) — calcular hash da VC e chamar register_kyc

Exemplo usando @coral-xyz/anchor + @solana/web3.js

import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import crypto from "crypto";

// canonicalize JSON (sorting keys) for deterministic hashing
function canonicalize(obj: any): string {
  // simple stable stringify: sort keys recursively
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

function sha256Hex(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function registerKyc(anchorProvider: anchor.AnchorProvider, program: anchor.Program, adminKeypair: Keypair, userPubkey: string, vc: any, expiration: number) {
  const canonical = canonicalize(vc);
  const hashHex = sha256Hex(canonical);
  const credentialHash = Buffer.from(hashHex, 'hex');

  // derive PDA (client side, for building accounts)
  const userPub = new PublicKey(userPubkey);
  const [userKycPda, _bump] = await PublicKey.findProgramAddress(
    [Buffer.from("kyc"), userPub.toBuffer()],
    program.programId,
  );

  // call register_kyc instruction
  const tx = await program.rpc.registerKyc(
    new anchor.BN(expiration),
    Array.from(credentialHash),
    true, // is_verified
    {
      accounts: {
        admin: adminKeypair.publicKey,
        propertyState: /* property state PDA */,
        user: userPub,
        userKyc: userKycPda,
        systemProgram: SystemProgram.programId,
      },
      signers: [adminKeypair],
    }
  );

  return { tx, userKycPda: userKycPda.toBase58(), credentialHash: hashHex };
}


Atenção:

Use canonical JSON sempre para evitar diferentes hashes por ordem de campos.

credentialHash stored as [u8;32] — envie como array de bytes.

Como integrar Wallets / ExtraAccountMetaList na prática

No initialize_token, chame ExtraAccountMetaList::init e insira uma meta que instrua runtime/wallets a derivar PDA ["kyc", destination_pubkey].

Quando frontend solicita unsigned tx ao microserviço blockchain, o backend deve incluir essa ExtraAccountMetaList meta e as contas extras no Message antes de enviar para assinar. Carteiras compatíveis (Phantom com suporte a Token-2022 extras) irão incluir a conta PDA automaticamente.

Se a carteira não suportar, UX deve instruir o usuário a usar a carteira compatível ou fornecer um fallback (usuario fornece PDA manualmente — ruim UX e inseguro).

Monitor / Indexer (Go) — esqueleto de funcionamento

Conectar a RPC/websocket (solana JSON RPC).

Subscribir a logsSubscribe para o programa id (filtro por Program).

Para cada log, se for ProgramData de anchor event, decodificar pelo IDL (anchor events têm prefix Program log: e payload).

Extrair campos e inserir em DB (tx signature, slot, timestamp, event type, fields).

Expor API REST para dashboard.

Checklist de implementação (pragmático)

Smart contract Anchor:

 initialize_token implementado e cria mint Token-2022.

 register_kyc implementado e checa admin_authority.

 transfer_hook implementado com as checagens KycNotFound/KycNotVerified/KycExpired.

 ExtraAccountMetaList inicializada e documentada.

 Eventos Anchor emitidos para KYC e transferências.

 Scripts build.sh, deploy.sh e Anchor.toml configurados.

KYC microservice:

 POST /kyc/register calcula credential_hash e chama register_kyc.

 GET /kyc/status/:wallet lê PDA.

 Admin keypair carregável via env var/KMS; rate limit e logs.

Frontend / Wallet:

 Conecta Phantom e solicita unsigned tx com accounts extras.

 Onboard KYC chama microservice e exibe status.

Tests:

 anchor test cobre cenários: fail without KYC, success after KYC, fail when expired.

Monitor:

 Indexer decodifica events e popula DB.

 Dashboard exibe KYC registrations, transfers blocked/allowed.

Plano de rollout / deployment (sugestão)

Desenvolvimento: localnet Anchor + docker-compose rodando microservices + frontend (localhost). Testes automatizados com anchor test.

Staging: devnet, deploy program (careful with programId), use mcp para assistance/devtools, conectar indexer a devnet RPC.

Prod: mainnet-beta, admin keys em HSM/KMS, observability (Prometheus + Grafana), auditor externo review.

Observações operacionais importantes

Governança e revogação: modelar processo de revogação: register_kyc pode sobrescrever is_verified=false para revogar. Mantenha histórico via eventos.

Compliancy/legal: trabalhar com advogado/regulator para armazenar hashes e sobreregistros off-chain (quem emitiu VC) e política de retenção.

Escalabilidade: PDAs por usuário escalam; indexer sharding por slot/slot ranges, usar Kafka se alto throughput.

MCP (mcp.solana.com): integre SDK/config no ambiente de desenvolvimento para ajudar revisão assistida pelo MCP (documente como habilitar no README do programa).


Voce deve implementar o solana program seguindo os padroes da comunidade como a raydium: https://github.com/raydium-io/raydium-clmm

https://github.com/raydium-io/raydium-amm

Mantendo padrão de desenvolvimento do mercado!

Use o mcp da solana por favor!

Micro serviços de monitoramento - golang
Front- React com tailwind, zustand e na arquitetura hexagonal
Back-end do KYC (credenciais verificavels) - Golang
Back-end das interacoes solana: NestJS
Front-end do monitor: React

Mas pra inicio vamos focar apenas nos contratos inteligentes programs e no kyc e interagindo ja antes de comecar um front-end
