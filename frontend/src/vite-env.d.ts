/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLANA_NETWORK: string;
  readonly VITE_SOLANA_RPC_URL: string;
  readonly VITE_PROGRAM_ID: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_DESCRIPTION: string;
  readonly VITE_DEFAULT_SLIPPAGE_BPS: string;
  readonly VITE_MAX_SLIPPAGE_BPS: string;
  readonly VITE_JUPITER_ENABLED: string;
  readonly VITE_JUPITER_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  Buffer: typeof Buffer;
}
