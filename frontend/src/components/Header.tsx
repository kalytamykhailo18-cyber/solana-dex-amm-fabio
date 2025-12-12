import { FC, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { config } from '../config/env';

export const Header: FC = () => {
  const location = useLocation();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    // Fetch initial balance
    const fetchBalance = async () => {
      try {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
        setBalance(null);
      }
    };

    fetchBalance();

    // Subscribe to balance changes
    const subscriptionId = connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
      },
      'confirmed'
    );

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [publicKey, connection]);

  return (
    <header className="bg-black border-b border-silver-800">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 animate-fade-right animate-fast">
              <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center shadow-lg shadow-gold-500/20">
                <span className="text-black font-bold text-lg">D</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gold-400 to-gold-500 text-transparent bg-clip-text">{config.appName}</h1>
            </Link>
            <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded border border-green-600/30 animate-zoom-in animate-very-fast animate-delay-100">
              {config.network}
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition animate-fade-down animate-very-fast animate-delay-100 ${
                isActive('/') ? 'text-gold-400' : 'text-silver-400 hover:text-gold-400'
              }`}
            >
              Pools
            </Link>
            <Link
              to="/swap"
              className={`text-sm font-medium transition animate-fade-down animate-very-fast animate-delay-200 ${
                isActive('/swap') ? 'text-gold-400' : 'text-silver-400 hover:text-gold-400'
              }`}
            >
              Swap
            </Link>
            <Link
              to="/liquidity"
              className={`text-sm font-medium transition animate-fade-down animate-very-fast animate-delay-300 ${
                isActive('/liquidity') ? 'text-gold-400' : 'text-silver-400 hover:text-gold-400'
              }`}
            >
              Liquidity
            </Link>
            <Link
              to="/create-pool"
              className={`text-sm font-medium transition animate-fade-down animate-very-fast animate-delay-400 ${
                isActive('/create-pool') ? 'text-gold-400' : 'text-silver-400 hover:text-gold-400'
              }`}
            >
              Create Pool
            </Link>
            <div className="flex items-center gap-3 animate-fade-left animate-fast animate-delay-500">
              {publicKey && balance !== null && (
                <div className="flex items-center gap-2 bg-dark-800 px-3 py-2 rounded-lg border border-dark-700">
                  <span className="text-gold-400 font-medium">{balance.toFixed(4)}</span>
                  <span className="text-silver-400 text-sm">SOL</span>
                </div>
              )}
              <WalletMultiButton />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
