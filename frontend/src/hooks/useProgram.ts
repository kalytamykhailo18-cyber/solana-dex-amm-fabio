import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { IDL } from '../idl/dex';
import { config } from '../config/env';

// Program ID from environment or IDL
const PROGRAM_ID = new PublicKey(
  config.programId || 'EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T'
);

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
    console.log('Wallet connected:', wallet.publicKey.toBase58());

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

    try {
      // Pass both IDL and program ID explicitly for Anchor 0.29
      return new Program(IDL as any, PROGRAM_ID, provider);
    } catch (error) {
      console.error('Failed to create program:', error);
      return null;
    }
  }, [provider]);

  return { program, provider, connection };
};
