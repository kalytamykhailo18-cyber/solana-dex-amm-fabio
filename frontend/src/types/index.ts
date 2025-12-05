import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface Pool {
  address: PublicKey;
  tokenAMint: PublicKey;
  tokenBMint: PublicKey;
  tokenAVault: PublicKey;
  tokenBVault: PublicKey;
  lpMint: PublicKey;
  feeRateBps: number;
  totalLpSupply: BN;
  reserveA: BN;
  reserveB: BN;
}

export interface TokenInfo {
  mint: PublicKey;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface UserBalance {
  mint: PublicKey;
  balance: BN;
  decimals: number;
}

export interface Transaction {
  signature: string;
  type: 'swap' | 'addLiquidity' | 'removeLiquidity' | 'createPool';
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  poolAddress?: PublicKey;
}

export interface SwapQuote {
  amountIn: BN;
  amountOut: BN;
  priceImpact: number;
  fee: BN;
}

export type LoadingState = 'idle' | 'pending' | 'succeeded' | 'failed';
