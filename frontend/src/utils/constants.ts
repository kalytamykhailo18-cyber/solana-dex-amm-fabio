import { PublicKey } from '@solana/web3.js';

// PDA Seeds
export const POOL_SEED = Buffer.from('pool');
export const VAULT_SEED = Buffer.from('vault');
export const LP_MINT_SEED = Buffer.from('lp_mint');

// Fee constants
export const FEE_DENOMINATOR = 10000;

// Token decimals (standard Solana)
export const DEFAULT_DECIMALS = 9;

// Known token mints (devnet)
export const KNOWN_TOKENS: Record<string, { symbol: string; name: string; decimals: number; logoURI?: string }> = {
  // Add known devnet tokens here
};

// Helper to convert amount to base units
export const toBaseUnits = (amount: number, decimals: number = DEFAULT_DECIMALS): number => {
  return Math.floor(amount * Math.pow(10, decimals));
};

// Helper to convert from base units
export const fromBaseUnits = (amount: number | bigint, decimals: number = DEFAULT_DECIMALS): number => {
  return Number(amount) / Math.pow(10, decimals);
};

// Calculate swap output using constant product formula
export const calculateSwapOutput = (
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeRateBps: number
): number => {
  const feeFactor = FEE_DENOMINATOR - feeRateBps;
  const amountInWithFee = amountIn * feeFactor;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * FEE_DENOMINATOR + amountInWithFee;
  return Math.floor(numerator / denominator);
};

// Calculate price impact
export const calculatePriceImpact = (
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeRateBps: number
): number => {
  const spotPrice = reserveOut / reserveIn;
  const amountOut = calculateSwapOutput(amountIn, reserveIn, reserveOut, feeRateBps);
  const executionPrice = amountOut / amountIn;
  const priceImpact = ((spotPrice - executionPrice) / spotPrice) * 100;
  return priceImpact;
};

// Shorten address for display
export const shortenAddress = (address: string | PublicKey, chars: number = 4): string => {
  const str = typeof address === 'string' ? address : address.toBase58();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
};
