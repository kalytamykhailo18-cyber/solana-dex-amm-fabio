import { useCallback, useState } from 'react';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useProgram } from './useProgram';
import { BN } from '@coral-xyz/anchor';
import { POOL_SEED, VAULT_SEED, LP_MINT_SEED } from '../utils/constants';

export interface PoolData {
  address: PublicKey;
  tokenAMint: PublicKey;
  tokenBMint: PublicKey;
  tokenAVault: PublicKey;
  tokenBVault: PublicKey;
  lpMint: PublicKey;
  feeRateBps: number;
  totalLpSupply: BN;
  reserveA: number;
  reserveB: number;
}

export const usePool = () => {
  const { program } = useProgram();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);

  const getPoolPda = useCallback((tokenAMint: PublicKey, tokenBMint: PublicKey): PublicKey | null => {
    if (!program) return null;
    const [poolPda] = PublicKey.findProgramAddressSync(
      [POOL_SEED, tokenAMint.toBuffer(), tokenBMint.toBuffer()],
      program.programId
    );
    return poolPda;
  }, [program]);

  const getPoolData = useCallback(async (poolPda: PublicKey): Promise<PoolData | null> => {
    if (!program) return null;
    try {
      const poolAccount = await (program.account as any).pool.fetch(poolPda);

      // Get vault balances
      const tokenAVaultAccount = await getAccount(connection, poolAccount.tokenAVault);
      const tokenBVaultAccount = await getAccount(connection, poolAccount.tokenBVault);

      return {
        address: poolPda,
        tokenAMint: poolAccount.tokenAMint,
        tokenBMint: poolAccount.tokenBMint,
        tokenAVault: poolAccount.tokenAVault,
        tokenBVault: poolAccount.tokenBVault,
        lpMint: poolAccount.lpMint,
        feeRateBps: poolAccount.feeRateBps,
        totalLpSupply: poolAccount.totalLpSupply,
        reserveA: Number(tokenAVaultAccount.amount),
        reserveB: Number(tokenBVaultAccount.amount),
      };
    } catch (error) {
      console.error('Failed to fetch pool data:', error);
      return null;
    }
  }, [program, connection]);

  const initializePool = useCallback(async (
    tokenAMint: PublicKey,
    tokenBMint: PublicKey,
    feeRateBps: number
  ): Promise<{ tx: string; poolPda: PublicKey }> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const poolPda = getPoolPda(tokenAMint, tokenBMint);
      if (!poolPda) throw new Error('Could not derive pool PDA');

      const [tokenAVault] = PublicKey.findProgramAddressSync(
        [VAULT_SEED, poolPda.toBuffer(), tokenAMint.toBuffer()],
        program.programId
      );

      const [tokenBVault] = PublicKey.findProgramAddressSync(
        [VAULT_SEED, poolPda.toBuffer(), tokenBMint.toBuffer()],
        program.programId
      );

      const [lpMint] = PublicKey.findProgramAddressSync(
        [LP_MINT_SEED, poolPda.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .initializePool(feeRateBps)
        .accounts({
          payer: wallet.publicKey,
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

      return { tx, poolPda };
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, getPoolPda]);

  const addLiquidity = useCallback(async (
    poolPda: PublicKey,
    amountA: number,
    amountB: number,
    minLpTokens: number = 0
  ): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const poolAccount = await (program.account as any).pool.fetch(poolPda);

      const userTokenA = await getAssociatedTokenAddress(poolAccount.tokenAMint, wallet.publicKey);
      const userTokenB = await getAssociatedTokenAddress(poolAccount.tokenBMint, wallet.publicKey);
      const userLpToken = await getAssociatedTokenAddress(poolAccount.lpMint, wallet.publicKey);

      // Check if LP token account exists, if not create it
      const preInstructions = [];

      try {
        await getAccount(connection, userLpToken);
      } catch {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userLpToken,
            wallet.publicKey,
            poolAccount.lpMint
          )
        );
      }

      const tx = await program.methods
        .addLiquidity(new BN(amountA), new BN(amountB), new BN(minLpTokens))
        .accounts({
          user: wallet.publicKey,
          pool: poolPda,
          userTokenA,
          userTokenB,
          tokenAVault: poolAccount.tokenAVault,
          tokenBVault: poolAccount.tokenBVault,
          lpMint: poolAccount.lpMint,
          userLpToken,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc();

      return tx;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, connection]);

  const removeLiquidity = useCallback(async (
    poolPda: PublicKey,
    lpTokens: number,
    minAmountA: number = 0,
    minAmountB: number = 0
  ): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const poolAccount = await (program.account as any).pool.fetch(poolPda);

      const userTokenA = await getAssociatedTokenAddress(poolAccount.tokenAMint, wallet.publicKey);
      const userTokenB = await getAssociatedTokenAddress(poolAccount.tokenBMint, wallet.publicKey);
      const userLpToken = await getAssociatedTokenAddress(poolAccount.lpMint, wallet.publicKey);

      // Check if token accounts exist, create if needed
      const preInstructions = [];

      try {
        await getAccount(connection, userTokenA);
      } catch {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userTokenA,
            wallet.publicKey,
            poolAccount.tokenAMint
          )
        );
      }

      try {
        await getAccount(connection, userTokenB);
      } catch {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userTokenB,
            wallet.publicKey,
            poolAccount.tokenBMint
          )
        );
      }

      const tx = await program.methods
        .removeLiquidity(new BN(lpTokens), new BN(minAmountA), new BN(minAmountB))
        .accounts({
          user: wallet.publicKey,
          pool: poolPda,
          userTokenA,
          userTokenB,
          tokenAVault: poolAccount.tokenAVault,
          tokenBVault: poolAccount.tokenBVault,
          lpMint: poolAccount.lpMint,
          userLpToken,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc();

      return tx;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, connection]);

  const swap = useCallback(async (
    poolPda: PublicKey,
    amountIn: number,
    minAmountOut: number,
    swapAToB: boolean
  ): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const poolAccount = await (program.account as any).pool.fetch(poolPda);

      const tokenInMint = swapAToB ? poolAccount.tokenAMint : poolAccount.tokenBMint;
      const tokenOutMint = swapAToB ? poolAccount.tokenBMint : poolAccount.tokenAMint;

      const userTokenIn = await getAssociatedTokenAddress(tokenInMint, wallet.publicKey);
      const userTokenOut = await getAssociatedTokenAddress(tokenOutMint, wallet.publicKey);

      const vaultIn = swapAToB ? poolAccount.tokenAVault : poolAccount.tokenBVault;
      const vaultOut = swapAToB ? poolAccount.tokenBVault : poolAccount.tokenAVault;

      // Check if output token account exists
      const preInstructions = [];

      try {
        await getAccount(connection, userTokenOut);
      } catch {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userTokenOut,
            wallet.publicKey,
            tokenOutMint
          )
        );
      }

      const tx = await program.methods
        .swap(new BN(amountIn), new BN(minAmountOut))
        .accounts({
          user: wallet.publicKey,
          pool: poolPda,
          userTokenIn,
          userTokenOut,
          vaultIn,
          vaultOut,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc();

      return tx;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, connection]);

  return {
    loading,
    getPoolPda,
    getPoolData,
    initializePool,
    addLiquidity,
    removeLiquidity,
    swap,
  };
};
