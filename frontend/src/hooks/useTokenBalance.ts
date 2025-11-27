import { useCallback, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

export const useTokenBalance = (mint: PublicKey | null) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !mint) {
      setBalance(0);
      return;
    }

    setLoading(true);
    try {
      const ata = await getAssociatedTokenAddress(mint, publicKey);
      const account = await getAccount(connection, ata);
      setBalance(Number(account.amount));
    } catch {
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, mint]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refresh: fetchBalance };
};

export const useMultipleTokenBalances = (mints: (PublicKey | null)[]) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!publicKey) {
      setBalances({});
      return;
    }

    setLoading(true);
    try {
      const newBalances: Record<string, number> = {};

      await Promise.all(
        mints.filter(Boolean).map(async (mint) => {
          if (!mint) return;
          try {
            const ata = await getAssociatedTokenAddress(mint, publicKey);
            const account = await getAccount(connection, ata);
            newBalances[mint.toBase58()] = Number(account.amount);
          } catch {
            newBalances[mint.toBase58()] = 0;
          }
        })
      );

      setBalances(newBalances);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, mints]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return { balances, loading, refresh: fetchBalances };
};
