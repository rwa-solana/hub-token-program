/**
 * Exemplo de teste com dados REAIS da mainnet
 * Similar ao `forge test --fork-url` do Foundry
 *
 * Para rodar:
 * 1. Inicie o validator com fork: ./scripts/test-with-mainnet-fork.sh
 * 2. Execute: anchor test --skip-build --skip-local-validator
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { HubTokenProgram } from "../target/types/hub_token_program";
import { PublicKey, Connection } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, getMint } from "@solana/spl-token";

describe("Testes com Dados Reais da Mainnet", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.HubTokenProgram as Program<HubTokenProgram>;

  /**
   * Exemplo 1: Verificar que o Token-2022 está disponível
   * (clonado da mainnet)
   */
  it("Deve acessar Token-2022 Program da mainnet", async () => {
    const connection = provider.connection;

    // Token-2022 Program ID da mainnet
    const token2022Program = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

    // Verificar que o programa existe (foi clonado da mainnet)
    const accountInfo = await connection.getAccountInfo(token2022Program);

    console.log("\n📊 Token-2022 Program Info:");
    console.log("  Executable:", accountInfo?.executable);
    console.log("  Owner:", accountInfo?.owner.toString());
    console.log("  Data Length:", accountInfo?.data.length);

    if (!accountInfo?.executable) {
      throw new Error("Token-2022 não foi clonado da mainnet!");
    }
  });

  /**
   * Exemplo 2: Clonar uma conta específica da mainnet para testar
   */
  it("Exemplo de como clonar conta específica", async () => {
    console.log("\n🔍 Para clonar uma conta específica da mainnet:");
    console.log("\n1. Encontre o endereço da conta na mainnet:");
    console.log("   solana account <ADDRESS> --url mainnet-beta\n");

    console.log("2. Clone a conta no test-validator:");
    console.log("   solana-test-validator \\");
    console.log("     --clone <ADDRESS> \\");
    console.log("     --url https://api.mainnet-beta.solana.com\n");

    console.log("3. Acesse a conta nos seus testes:");
    console.log("   const accountInfo = await connection.getAccountInfo(address);\n");
  });

  /**
   * Exemplo 3: Testar interação com programa real da mainnet
   */
  it("Pode verificar estado de programas reais", async () => {
    const connection = provider.connection;

    // Metaplex Token Metadata Program (exemplo de programa popular)
    const metaplexProgram = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

    const accountInfo = await connection.getAccountInfo(metaplexProgram);

    console.log("\n📊 Metaplex Token Metadata Program:");
    console.log("  Existe:", accountInfo !== null);
    console.log("  Executable:", accountInfo?.executable);

    // Se quiser clonar:
    // solana-test-validator --clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
  });
});

/**
 * CASOS DE USO REAIS:
 *
 * 1. Testar integração com USDC real:
 *    --clone EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
 *
 * 2. Testar com pool Raydium real:
 *    --clone <POOL_ADDRESS>
 *
 * 3. Testar com Oracle Pyth real:
 *    --clone <ORACLE_ADDRESS>
 *
 * 4. Testar com wallet real (para verificar saldo):
 *    --clone <WALLET_ADDRESS>
 */
