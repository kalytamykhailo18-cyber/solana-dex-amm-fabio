import { Buffer } from 'buffer';

// Polyfill Buffer globally for Solana dependencies
(window as any).Buffer = Buffer;
(window as any).global = window;
(window as any).process = {
  env: {},
  version: '',
  nextTick: (fn: Function) => setTimeout(fn, 0),
};

export {};
