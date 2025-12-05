import { FC, ReactNode, useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { config } from '../config/env';
import { useAppDispatch } from '../store/hooks';
import { setWallet, disconnectWallet } from '../store/walletSlice';

import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

const WalletSync: FC<{ children: ReactNode }> = ({ children }) => {
  const { publicKey } = useWallet();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (publicKey) {
      dispatch(setWallet(publicKey));
    } else {
      dispatch(disconnectWallet());
    }
  }, [publicKey, dispatch]);

  return <>{children}</>;
};

export const WalletProvider: FC<Props> = ({ children }) => {
  const endpoint = config.rpcUrl;

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletSync>
            {children}
          </WalletSync>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
