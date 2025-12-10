import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { IDL } from '../idl/dex';
import { Buffer } from 'buffer';

export const useProgram = (): {
  program: Program | null;
  provider: AnchorProvider | null;
  connection: Connection;
} => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }
    console.log(wallet.publicKey);

    return new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      },
      { commitment: 'confirmed' }
    );
  }, [connection, wallet]);

  const program = useMemo((): Program | null => {
    if (!provider) return null;

    // Ensure Buffer is available globally
    if (typeof window !== 'undefined' && !window.Buffer) {
      window.Buffer = Buffer;
    }

    try {
      // The program ID is now in the IDL itself
      return new Program(IDL, provider);
    } catch (error) {
      console.error('Failed to create program:', error);
      return null;
    }
  }, [provider]);

  return { program, provider, connection };
};
