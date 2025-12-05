export const config = {
  // Network
  network: import.meta.env.VITE_SOLANA_NETWORK || 'devnet',
  rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',

  // Program
  programId: import.meta.env.VITE_PROGRAM_ID || '',

  // App
  appName: import.meta.env.VITE_APP_NAME || 'DexSpeed',
  appDescription: import.meta.env.VITE_APP_DESCRIPTION || 'High-Speed Solana DEX for EBK Trading',

  // Trading
  defaultSlippageBps: Number(import.meta.env.VITE_DEFAULT_SLIPPAGE_BPS) || 100,
  maxSlippageBps: Number(import.meta.env.VITE_MAX_SLIPPAGE_BPS) || 1000,

  // Jupiter
  jupiterEnabled: import.meta.env.VITE_JUPITER_ENABLED === 'true',
  jupiterApiUrl: import.meta.env.VITE_JUPITER_API_URL || 'https://quote-api.jup.ag/v6',
};

export type Config = typeof config;
