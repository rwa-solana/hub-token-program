import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { HubTokenProgram } from "./target/types/hub_token_program";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as fs from "fs";

async function main() {
  // Setup
  const connection = new anchor.web3.Connection("https://solana-devnet.g.alchemy.com/v2/bctNGkPdumegFbmG338QD", "confirmed");
  
  // Load investor keypair
  const investorKeypairData = JSON.parse(fs.readFileSync("/Users/renancorrea/.config/solana/investor-keypair.json", "utf-8"));
  const investorKeypair = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(investorKeypairData));
  
  const wallet = new anchor.Wallet(investorKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  const programId = new PublicKey("FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om");
  const program = anchor.workspace.HubTokenProgram as Program<HubTokenProgram>;

  const propertyMint = new PublicKey("AdKctMi9QuwnSYLJ6KtzM75fGpp1tWaM1wZCruqw5jSe");
  const epochNumber = 1;

  // Derive PDAs
  const [propertyState] = PublicKey.findProgramAddressSync(
    [Buffer.from("property"), propertyMint.toBuffer()],
    programId
  );

  const [revenueEpoch] = PublicKey.findProgramAddressSync(
    [Buffer.from("revenue_epoch"), propertyState.toBuffer(), new anchor.BN(epochNumber).toArrayLike(Buffer, "le", 8)],
    programId
  );

  const [claimRecord] = PublicKey.findProgramAddressSync(
    [Buffer.from("claim_record"), revenueEpoch.toBuffer(), investorKeypair.publicKey.toBuffer()],
    programId
  );

  const [revenueVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("revenue_vault"), revenueEpoch.toBuffer()],
    programId
  );

  const investorTokenAccount = getAssociatedTokenAddressSync(
    propertyMint,
    investorKeypair.publicKey,
    false,
    new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb")
  );

  console.log("Investor:", investorKeypair.publicKey.toString());
  console.log("Property Mint:", propertyMint.toString());
  console.log("Property State:", propertyState.toString());
  console.log("Revenue Epoch:", revenueEpoch.toString());
  console.log("Revenue Vault:", revenueVault.toString());
  console.log("Claim Record:", claimRecord.toString());
  console.log("Investor Token Account:", investorTokenAccount.toString());

  // Fetch epoch data
  try {
    const epochData = await program.account.revenueEpoch.fetch(revenueEpoch);
    console.log("\nEpoch Data:");
    console.log("  Total Revenue:", epochData.totalRevenue.toString(), "lamports");
    console.log("  Eligible Supply:", epochData.eligibleSupply.toString());
    console.log("  Deposited At:", new Date(epochData.depositedAt.toNumber() * 1000).toISOString());
    console.log("  Is Finalized:", epochData.isFinalized);
  } catch (e) {
    console.error("Failed to fetch epoch:", e);
    return;
  }

  // Fetch investor token balance
  const tokenAccountInfo = await connection.getParsedAccountInfo(investorTokenAccount);
  if (tokenAccountInfo.value) {
    const data = (tokenAccountInfo.value.data as any).parsed.info;
    console.log("\nInvestor Token Balance:", data.tokenAmount.amount);
  }

  // Claim revenue
  console.log("\nClaiming revenue...");
  try {
    const tx = await program.methods
      .claimRevenue()
      .accounts({
        investor: investorKeypair.publicKey,
        propertyState,
        mint: propertyMint,
        investorTokenAccount,
        revenueEpoch,
        claimRecord,
        revenueVault,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Claim successful!");
    console.log("Transaction:", tx);
  } catch (e) {
    console.error("Claim failed:", e);
  }
}

main().catch(console.error);
