import { Buffer } from 'buffer';

// Polyfill Buffer globally for Solana/Anchor dependencies
// This MUST run before any Anchor code is imported
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
  (globalThis as any).Buffer = Buffer;
}

export { Buffer };
