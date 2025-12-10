import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { config } from '../config/env';

export const Header: FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-black border-b border-silver-800">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center shadow-lg shadow-gold-500/20">
                <span className="text-black font-bold text-lg">D</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gold-400 to-gold-500 text-transparent bg-clip-text">{config.appName}</h1>
            </Link>
            <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded border border-green-600/30">
              {config.network}
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition ${
                isActive('/') ? 'text-gold-400' : 'text-silver-400 hover:text-gold-400'
              }`}
            >
              Pools
            </Link>
            <Link
              to="/swap"
              className={`text-sm font-medium transition ${
                isActive('/swap') ? 'text-gold-400' : 'text-silver-400 hover:text-gold-400'
              }`}
            >
              Swap
            </Link>
            <Link
              to="/liquidity"
              className={`text-sm font-medium transition ${
                isActive('/liquidity') ? 'text-gold-400' : 'text-silver-400 hover:text-gold-400'
              }`}
            >
              Liquidity
            </Link>
            <Link
              to="/create-pool"
              className={`text-sm font-medium transition ${
                isActive('/create-pool') ? 'text-gold-400' : 'text-silver-400 hover:text-gold-400'
              }`}
            >
              Create Pool
            </Link>
            <WalletMultiButton />
          </nav>
        </div>
      </div>
    </header>
  );
};
