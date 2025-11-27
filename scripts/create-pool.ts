/**
 * Script to create a new liquidity pool
 * Run: npx ts-node scripts/create-pool.ts <tokenAMint> <tokenBMint> [feeRateBps]
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  clusterApiUrl,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Program, AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";
import * as fs from "fs";
import * as path from "path";

// Load IDL
const idlPath = path.join(__dirname, "../anchor/target/idl/dex.json");

// Seeds
const POOL_SEED = Buffer.from("pool");
const VAULT_SEED = Buffer.from("vault");
const LP_MINT_SEED = Buffer.from("lp_mint");

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: npx ts-node create-pool.ts <tokenAMint> <tokenBMint> [feeRateBps]");
    console.log("Example: npx ts-node create-pool.ts ABC123... XYZ789... 30");
    process.exit(1);
  }

  const tokenAMintStr = args[0];
  const tokenBMintStr = args[1];
  const feeRateBps = parseInt(args[2] || "30");

  console.log("=".repeat(50));
  console.log("Create Pool Script");
  console.log("=".repeat(50));

  // Validate inputs
  let tokenAMint: PublicKey;
  let tokenBMint: PublicKey;

  try {
    tokenAMint = new PublicKey(tokenAMintStr);
    tokenBMint = new PublicKey(tokenBMintStr);
  } catch {
    console.error("Invalid mint address format");
    process.exit(1);
  }

  if (feeRateBps < 0 || feeRateBps > 1000) {
    console.error("Fee rate must be between 0 and 1000 (0% to 10%)");
    process.exit(1);
  }

  console.log(`Token A: ${tokenAMint.toBase58()}`);
  console.log(`Token B: ${tokenBMint.toBase58()}`);
  console.log(`Fee Rate: ${feeRateBps / 100}%`);

  // Load environment
  const network = process.env.SOLANA_NETWORK || "devnet";
  const programIdStr = process.env.PROGRAM_ID;

  if (!programIdStr) {
    console.error("PROGRAM_ID not set in environment");
    process.exit(1);
  }

  const programId = new PublicKey(programIdStr);
  console.log(`Program ID: ${programId.toBase58()}`);

  // Load keypair
  const keypairPath =
    process.env.DEPLOYER_KEYPAIR_PATH ||
    `${process.env.HOME}/.config/solana/devnet.json`;

  let payer: Keypair;

  try {
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    payer = Keypair.fromSecretKey(new Uint8Array(keypairData));
  } catch {
    console.error(`Error loading keypair from ${keypairPath}`);
    process.exit(1);
  }

  console.log(`Payer: ${payer.publicKey.toBase58()}`);

  // Connect
  const connection = new Connection(
    network === "mainnet-beta"
      ? clusterApiUrl("mainnet-beta")
      : clusterApiUrl("devnet"),
    "confirmed"
  );

  // Check balance
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Balance: ${balance / 1e9} SOL`);

  if (balance < 0.05 * 1e9) {
    console.error("Insufficient balance. Need at least 0.05 SOL");
    process.exit(1);
  }

  // Load IDL
  let idl;
  try {
    idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  } catch {
    console.error(`Error loading IDL from ${idlPath}`);
    console.error("Run 'anchor build' first");
    process.exit(1);
  }

  // Setup provider and program
  const wallet = new Wallet(payer);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(idl, programId, provider);

  // Derive PDAs
  const [poolPda] = PublicKey.findProgramAddressSync(
    [POOL_SEED, tokenAMint.toBuffer(), tokenBMint.toBuffer()],
    programId
  );

  const [tokenAVault] = PublicKey.findProgramAddressSync(
    [VAULT_SEED, poolPda.toBuffer(), tokenAMint.toBuffer()],
    programId
  );

  const [tokenBVault] = PublicKey.findProgramAddressSync(
    [VAULT_SEED, poolPda.toBuffer(), tokenBMint.toBuffer()],
    programId
  );

  const [lpMint] = PublicKey.findProgramAddressSync(
    [LP_MINT_SEED, poolPda.toBuffer()],
    programId
  );

  console.log("\nDerived Addresses:");
  console.log(`Pool PDA: ${poolPda.toBase58()}`);
  console.log(`Token A Vault: ${tokenAVault.toBase58()}`);
  console.log(`Token B Vault: ${tokenBVault.toBase58()}`);
  console.log(`LP Mint: ${lpMint.toBase58()}`);

  // Check if pool already exists
  try {
    const existingPool = await program.account.pool.fetch(poolPda);
    if (existingPool) {
      console.error("\nPool already exists for this token pair!");
      process.exit(1);
    }
  } catch {
    // Pool doesn't exist, we can create it
  }

  // Create pool
  console.log("\nCreating pool...");

  try {
    const tx = await program.methods
      .initializePool(feeRateBps)
      .accounts({
        payer: payer.publicKey,
        pool: poolPda,
        tokenAMint,
        tokenBMint,
        tokenAVault,
        tokenBVault,
        lpMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log(`Transaction: ${tx}`);
    console.log(`Explorer: https://explorer.solana.com/tx/${tx}?cluster=${network}`);

    // Verify pool
    const poolAccount = await program.account.pool.fetch(poolPda);
    console.log("\nPool created successfully!");
    console.log(`Fee Rate: ${poolAccount.feeRateBps / 100}%`);

    // Save pool info
    const poolInfo = {
      network,
      poolAddress: poolPda.toBase58(),
      tokenAMint: tokenAMint.toBase58(),
      tokenBMint: tokenBMint.toBase58(),
      tokenAVault: tokenAVault.toBase58(),
      tokenBVault: tokenBVault.toBase58(),
      lpMint: lpMint.toBase58(),
      feeRateBps,
      createdAt: new Date().toISOString(),
      transaction: tx,
    };

    const outputPath = path.join(__dirname, `pool-${poolPda.toBase58().slice(0, 8)}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(poolInfo, null, 2));
    console.log(`\nPool info saved to: ${outputPath}`);

  } catch (error) {
    console.error("\nError creating pool:", error);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(50));
  console.log("Pool created successfully!");
  console.log("=".repeat(50));
  console.log(`\nPool Address: ${poolPda.toBase58()}`);
  console.log("\nNext step: Add initial liquidity to the pool");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
