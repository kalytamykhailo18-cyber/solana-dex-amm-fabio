/**
 * Script to create test SPL tokens on devnet
 * Run: npx ts-node scripts/create-test-tokens.ts
 */

import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

// Configuration
const NETWORK = process.env.SOLANA_NETWORK || "devnet";
const DECIMALS = 9;
const MINT_AMOUNT = 1_000_000_000_000_000; // 1,000,000 tokens

async function main() {
  console.log("=".repeat(50));
  console.log("Create Test Tokens Script");
  console.log("=".repeat(50));
  console.log(`Network: ${NETWORK}`);

  // Load keypair from default location
  const keypairPath =
    process.env.DEPLOYER_KEYPAIR_PATH ||
    `${process.env.HOME}/.config/solana/devnet.json`;

  let payer: Keypair;

  try {
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    payer = Keypair.fromSecretKey(new Uint8Array(keypairData));
  } catch (error) {
    console.error(`Error loading keypair from ${keypairPath}`);
    console.error("Run: solana-keygen new --outfile ~/.config/solana/devnet.json");
    process.exit(1);
  }

  console.log(`Payer: ${payer.publicKey.toBase58()}`);

  // Connect to cluster
  const connection = new Connection(
    NETWORK === "mainnet-beta"
      ? clusterApiUrl("mainnet-beta")
      : clusterApiUrl("devnet"),
    "confirmed"
  );

  // Check balance
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Balance: ${balance / 1e9} SOL`);

  if (balance < 0.1 * 1e9) {
    console.log("\nInsufficient balance. Requesting airdrop...");
    const sig = await connection.requestAirdrop(payer.publicKey, 2 * 1e9);
    await connection.confirmTransaction(sig);
    console.log("Airdrop received!");
  }

  // Create Token A
  console.log("\n--- Creating Token A ---");
  const tokenAMint = await createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey, // freeze authority (null for no freeze)
    DECIMALS
  );
  console.log(`Token A Mint: ${tokenAMint.toBase58()}`);

  // Create Token A account
  const tokenAAccount = await createAccount(
    connection,
    payer,
    tokenAMint,
    payer.publicKey
  );
  console.log(`Token A Account: ${tokenAAccount.toBase58()}`);

  // Mint Token A
  await mintTo(
    connection,
    payer,
    tokenAMint,
    tokenAAccount,
    payer.publicKey,
    MINT_AMOUNT
  );
  console.log(`Minted ${MINT_AMOUNT / 1e9} Token A`);

  // Create Token B
  console.log("\n--- Creating Token B ---");
  const tokenBMint = await createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    DECIMALS
  );
  console.log(`Token B Mint: ${tokenBMint.toBase58()}`);

  // Create Token B account
  const tokenBAccount = await createAccount(
    connection,
    payer,
    tokenBMint,
    payer.publicKey
  );
  console.log(`Token B Account: ${tokenBAccount.toBase58()}`);

  // Mint Token B
  await mintTo(
    connection,
    payer,
    tokenBMint,
    tokenBAccount,
    payer.publicKey,
    MINT_AMOUNT
  );
  console.log(`Minted ${MINT_AMOUNT / 1e9} Token B`);

  // Verify balances
  console.log("\n--- Verifying Balances ---");
  const accountA = await getAccount(connection, tokenAAccount);
  const accountB = await getAccount(connection, tokenBAccount);
  console.log(`Token A Balance: ${Number(accountA.amount) / 1e9}`);
  console.log(`Token B Balance: ${Number(accountB.amount) / 1e9}`);

  // Save token info to file
  const tokenInfo = {
    network: NETWORK,
    tokenA: {
      mint: tokenAMint.toBase58(),
      account: tokenAAccount.toBase58(),
      decimals: DECIMALS,
    },
    tokenB: {
      mint: tokenBMint.toBase58(),
      account: tokenBAccount.toBase58(),
      decimals: DECIMALS,
    },
    createdAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "test-tokens.json");
  fs.writeFileSync(outputPath, JSON.stringify(tokenInfo, null, 2));
  console.log(`\nToken info saved to: ${outputPath}`);

  console.log("\n" + "=".repeat(50));
  console.log("Test tokens created successfully!");
  console.log("=".repeat(50));
  console.log("\nUse these mint addresses to create a pool:");
  console.log(`Token A Mint: ${tokenAMint.toBase58()}`);
  console.log(`Token B Mint: ${tokenBMint.toBase58()}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
