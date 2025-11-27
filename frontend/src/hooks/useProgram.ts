import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { config } from '../config/env';
import { IDL, Dex } from '../idl/dex';

export const useProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }
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

  const program = useMemo(() => {
    if (!provider || !config.programId) return null;
    try {
      return new Program<Dex>(
        IDL as Idl as Dex,
        new PublicKey(config.programId),
        provider
      );
    } catch (error) {
      console.error('Failed to create program:', error);
      return null;
    }
  }, [provider]);

  return { program, provider, connection };
};
