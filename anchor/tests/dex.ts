import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Dex } from "../target/types/dex";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { assert } from "chai";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";

describe("dex", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Dex as Program<Dex>;
  const payer = provider.wallet as anchor.Wallet;

  // Test tokens
  let tokenAMint: PublicKey;
  let tokenBMint: PublicKey;
  let userTokenA: PublicKey;
  let userTokenB: PublicKey;

  // Pool PDAs
  let poolPda: PublicKey;
  let poolBump: number;
  let tokenAVault: PublicKey;
  let tokenBVault: PublicKey;
  let lpMint: PublicKey;
  let userLpToken: PublicKey;

  // Seeds
  const POOL_SEED = Buffer.from("pool");
  const VAULT_SEED = Buffer.from("vault");
  const LP_MINT_SEED = Buffer.from("lp_mint");

  // Test amounts
  const INITIAL_MINT_AMOUNT = 1_000_000_000_000; // 1000 tokens with 9 decimals
  const ADD_LIQUIDITY_A = 100_000_000_000; // 100 tokens
  const ADD_LIQUIDITY_B = 100_000_000_000; // 100 tokens
  const SWAP_AMOUNT = 10_000_000_000; // 10 tokens

  before(async () => {
    console.log("Setting up test environment...");

    // Create Token A mint
    tokenAMint = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      9 // decimals
    );
    console.log("Token A Mint:", tokenAMint.toBase58());

    // Create Token B mint
    tokenBMint = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      9 // decimals
    );
    console.log("Token B Mint:", tokenBMint.toBase58());

    // Create user token accounts
    userTokenA = await createAccount(
      provider.connection,
      payer.payer,
      tokenAMint,
      payer.publicKey
    );
    console.log("User Token A Account:", userTokenA.toBase58());

    userTokenB = await createAccount(
      provider.connection,
      payer.payer,
      tokenBMint,
      payer.publicKey
    );
    console.log("User Token B Account:", userTokenB.toBase58());

    // Mint tokens to user
    await mintTo(
      provider.connection,
      payer.payer,
      tokenAMint,
      userTokenA,
      payer.publicKey,
      INITIAL_MINT_AMOUNT
    );

    await mintTo(
      provider.connection,
      payer.payer,
      tokenBMint,
      userTokenB,
      payer.publicKey,
      INITIAL_MINT_AMOUNT
    );

    // Derive PDAs
    [poolPda, poolBump] = PublicKey.findProgramAddressSync(
      [POOL_SEED, tokenAMint.toBuffer(), tokenBMint.toBuffer()],
      program.programId
    );
    console.log("Pool PDA:", poolPda.toBase58());

    [tokenAVault] = PublicKey.findProgramAddressSync(
      [VAULT_SEED, poolPda.toBuffer(), tokenAMint.toBuffer()],
      program.programId
    );

    [tokenBVault] = PublicKey.findProgramAddressSync(
      [VAULT_SEED, poolPda.toBuffer(), tokenBMint.toBuffer()],
      program.programId
    );

    [lpMint] = PublicKey.findProgramAddressSync(
      [LP_MINT_SEED, poolPda.toBuffer()],
      program.programId
    );

    // Get user LP token ATA
    userLpToken = await getAssociatedTokenAddress(lpMint, payer.publicKey);
  });

  it("Initialize pool", async () => {
    const feeRateBps = 30; // 0.3%

    const tx = await program.methods
      .initializePool(feeRateBps)
      .accounts({
        payer: payer.publicKey,
        pool: poolPda,
        tokenAMint: tokenAMint,
        tokenBMint: tokenBMint,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        lpMint: lpMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("Initialize pool tx:", tx);

    // Verify pool state
    const poolAccount = await program.account.pool.fetch(poolPda);
    assert.equal(poolAccount.feeRateBps, feeRateBps);
    assert.ok(poolAccount.tokenAMint.equals(tokenAMint));
    assert.ok(poolAccount.tokenBMint.equals(tokenBMint));
    assert.ok(poolAccount.tokenAVault.equals(tokenAVault));
    assert.ok(poolAccount.tokenBVault.equals(tokenBVault));
    assert.ok(poolAccount.lpMint.equals(lpMint));
    assert.equal(poolAccount.totalLpSupply.toNumber(), 0);

    console.log("Pool initialized successfully!");
  });

  it("Add initial liquidity", async () => {
    // Create LP token account for user
    const createAtaIx = createAssociatedTokenAccountInstruction(
      payer.publicKey,
      userLpToken,
      payer.publicKey,
      lpMint
    );

    const createAtaTx = new Transaction().add(createAtaIx);
    await provider.sendAndConfirm(createAtaTx);

    // Add liquidity
    const tx = await program.methods
      .addLiquidity(
        new BN(ADD_LIQUIDITY_A),
        new BN(ADD_LIQUIDITY_B),
        new BN(0) // min LP tokens
      )
      .accounts({
        user: payer.publicKey,
        pool: poolPda,
        userTokenA: userTokenA,
        userTokenB: userTokenB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        lpMint: lpMint,
        userLpToken: userLpToken,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Add liquidity tx:", tx);

    // Verify vault balances
    const vaultAAccount = await getAccount(provider.connection, tokenAVault);
    const vaultBAccount = await getAccount(provider.connection, tokenBVault);
    assert.equal(Number(vaultAAccount.amount), ADD_LIQUIDITY_A);
    assert.equal(Number(vaultBAccount.amount), ADD_LIQUIDITY_B);

    // Verify LP tokens minted
    const lpAccount = await getAccount(provider.connection, userLpToken);
    assert.ok(Number(lpAccount.amount) > 0);
    console.log("LP tokens received:", Number(lpAccount.amount));

    // Verify pool state
    const poolAccount = await program.account.pool.fetch(poolPda);
    assert.ok(poolAccount.totalLpSupply.toNumber() > 0);

    console.log("Initial liquidity added successfully!");
  });

  it("Swap Token A for Token B", async () => {
    // Get balances before swap
    const userBBefore = await getAccount(provider.connection, userTokenB);
    const vaultABefore = await getAccount(provider.connection, tokenAVault);
    const vaultBBefore = await getAccount(provider.connection, tokenBVault);

    console.log("Before swap:");
    console.log("  User Token B:", Number(userBBefore.amount));
    console.log("  Vault A:", Number(vaultABefore.amount));
    console.log("  Vault B:", Number(vaultBBefore.amount));

    // Execute swap
    const tx = await program.methods
      .swap(
        new BN(SWAP_AMOUNT),
        new BN(0) // min amount out (no slippage protection for test)
      )
      .accounts({
        user: payer.publicKey,
        pool: poolPda,
        userTokenIn: userTokenA,
        userTokenOut: userTokenB,
        vaultIn: tokenAVault,
        vaultOut: tokenBVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Swap tx:", tx);

    // Get balances after swap
    const userBAfter = await getAccount(provider.connection, userTokenB);
    const vaultAAfter = await getAccount(provider.connection, tokenAVault);
    const vaultBAfter = await getAccount(provider.connection, tokenBVault);

    console.log("After swap:");
    console.log("  User Token B:", Number(userBAfter.amount));
    console.log("  Vault A:", Number(vaultAAfter.amount));
    console.log("  Vault B:", Number(vaultBAfter.amount));

    // Verify vault A increased (received input)
    assert.ok(Number(vaultAAfter.amount) > Number(vaultABefore.amount));

    // Verify vault B decreased (sent output)
    assert.ok(Number(vaultBAfter.amount) < Number(vaultBBefore.amount));

    // Verify user received Token B
    assert.ok(Number(userBAfter.amount) > Number(userBBefore.amount));

    const amountOut = Number(userBAfter.amount) - Number(userBBefore.amount);
    console.log("Amount received:", amountOut);

    console.log("Swap completed successfully!");
  });

  it("Swap Token B for Token A", async () => {
    // Get balances before swap
    const userABefore = await getAccount(provider.connection, userTokenA);

    // Execute swap (reverse direction)
    const tx = await program.methods
      .swap(
        new BN(SWAP_AMOUNT),
        new BN(0)
      )
      .accounts({
        user: payer.publicKey,
        pool: poolPda,
        userTokenIn: userTokenB,
        userTokenOut: userTokenA,
        vaultIn: tokenBVault,
        vaultOut: tokenAVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Reverse swap tx:", tx);

    // Get balance after
    const userAAfter = await getAccount(provider.connection, userTokenA);
    assert.ok(Number(userAAfter.amount) > Number(userABefore.amount));

    console.log("Reverse swap completed successfully!");
  });

  it("Add more liquidity (proportional)", async () => {
    const poolAccountBefore = await program.account.pool.fetch(poolPda);
    const lpBefore = await getAccount(provider.connection, userLpToken);

    const addAmountA = 50_000_000_000; // 50 tokens
    const addAmountB = 50_000_000_000; // Approximately proportional

    const tx = await program.methods
      .addLiquidity(
        new BN(addAmountA),
        new BN(addAmountB),
        new BN(0)
      )
      .accounts({
        user: payer.publicKey,
        pool: poolPda,
        userTokenA: userTokenA,
        userTokenB: userTokenB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        lpMint: lpMint,
        userLpToken: userLpToken,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Add more liquidity tx:", tx);

    const poolAccountAfter = await program.account.pool.fetch(poolPda);
    const lpAfter = await getAccount(provider.connection, userLpToken);

    assert.ok(
      poolAccountAfter.totalLpSupply.toNumber() >
        poolAccountBefore.totalLpSupply.toNumber()
    );
    assert.ok(Number(lpAfter.amount) > Number(lpBefore.amount));

    console.log("Additional liquidity added successfully!");
  });

  it("Remove liquidity", async () => {
    const lpBefore = await getAccount(provider.connection, userLpToken);
    const userABefore = await getAccount(provider.connection, userTokenA);
    const userBBefore = await getAccount(provider.connection, userTokenB);

    // Remove 50% of LP tokens
    const lpToRemove = Math.floor(Number(lpBefore.amount) / 2);

    const tx = await program.methods
      .removeLiquidity(
        new BN(lpToRemove),
        new BN(0), // min amount A
        new BN(0) // min amount B
      )
      .accounts({
        user: payer.publicKey,
        pool: poolPda,
        userTokenA: userTokenA,
        userTokenB: userTokenB,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        lpMint: lpMint,
        userLpToken: userLpToken,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Remove liquidity tx:", tx);

    // Verify LP tokens burned
    const lpAfter = await getAccount(provider.connection, userLpToken);
    assert.ok(Number(lpAfter.amount) < Number(lpBefore.amount));

    // Verify user received tokens
    const userAAfter = await getAccount(provider.connection, userTokenA);
    const userBAfter = await getAccount(provider.connection, userTokenB);
    assert.ok(Number(userAAfter.amount) > Number(userABefore.amount));
    assert.ok(Number(userBAfter.amount) > Number(userBBefore.amount));

    console.log("Tokens received:");
    console.log("  Token A:", Number(userAAfter.amount) - Number(userABefore.amount));
    console.log("  Token B:", Number(userBAfter.amount) - Number(userBBefore.amount));

    console.log("Liquidity removed successfully!");
  });

  it("Fails with invalid fee rate", async () => {
    // Try to create pool with >10% fee
    const [invalidPoolPda] = PublicKey.findProgramAddressSync(
      [POOL_SEED, tokenBMint.toBuffer(), tokenAMint.toBuffer()], // Reversed order for different pool
      program.programId
    );

    const [invalidVaultA] = PublicKey.findProgramAddressSync(
      [VAULT_SEED, invalidPoolPda.toBuffer(), tokenBMint.toBuffer()],
      program.programId
    );

    const [invalidVaultB] = PublicKey.findProgramAddressSync(
      [VAULT_SEED, invalidPoolPda.toBuffer(), tokenAMint.toBuffer()],
      program.programId
    );

    const [invalidLpMint] = PublicKey.findProgramAddressSync(
      [LP_MINT_SEED, invalidPoolPda.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .initializePool(1001) // >10% fee
        .accounts({
          payer: payer.publicKey,
          pool: invalidPoolPda,
          tokenAMint: tokenBMint,
          tokenBMint: tokenAMint,
          tokenAVault: invalidVaultA,
          tokenBVault: invalidVaultB,
          lpMint: invalidLpMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      assert.fail("Should have failed with invalid fee rate");
    } catch (error: any) {
      assert.include(error.message, "Invalid fee rate");
      console.log("Invalid fee rate correctly rejected!");
    }
  });

  it("Fails swap with zero amount", async () => {
    try {
      await program.methods
        .swap(
          new BN(0), // Zero amount
          new BN(0)
        )
        .accounts({
          user: payer.publicKey,
          pool: poolPda,
          userTokenIn: userTokenA,
          userTokenOut: userTokenB,
          vaultIn: tokenAVault,
          vaultOut: tokenBVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      assert.fail("Should have failed with zero amount");
    } catch (error: any) {
      assert.include(error.message, "Zero amount");
      console.log("Zero amount correctly rejected!");
    }
  });

  it("Fails swap with slippage exceeded", async () => {
    try {
      await program.methods
        .swap(
          new BN(SWAP_AMOUNT),
          new BN(SWAP_AMOUNT * 2) // Expect more than possible
        )
        .accounts({
          user: payer.publicKey,
          pool: poolPda,
          userTokenIn: userTokenA,
          userTokenOut: userTokenB,
          vaultIn: tokenAVault,
          vaultOut: tokenBVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      assert.fail("Should have failed with slippage exceeded");
    } catch (error: any) {
      assert.include(error.message, "Slippage exceeded");
      console.log("Slippage protection working correctly!");
    }
  });

  after(async () => {
    console.log("\n=== Final State ===");

    const poolAccount = await program.account.pool.fetch(poolPda);
    const vaultA = await getAccount(provider.connection, tokenAVault);
    const vaultB = await getAccount(provider.connection, tokenBVault);
    const lpAccount = await getAccount(provider.connection, userLpToken);

    console.log("Pool Address:", poolPda.toBase58());
    console.log("Total LP Supply:", poolAccount.totalLpSupply.toNumber());
    console.log("Vault A Balance:", Number(vaultA.amount));
    console.log("Vault B Balance:", Number(vaultB.amount));
    console.log("User LP Balance:", Number(lpAccount.amount));
    console.log("Fee Rate:", poolAccount.feeRateBps / 100, "%");

    console.log("\nAll tests completed successfully!");
  });
});
