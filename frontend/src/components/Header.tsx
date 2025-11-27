import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { config } from '../config/env';

export const Header: FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-dark-900 border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className="text-xl font-bold text-white">{config.appName}</h1>
            </Link>
            <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-1 rounded border border-primary-600/30">
              {config.network}
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition ${
                isActive('/') ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Pools
            </Link>
            <Link
              to="/swap"
              className={`text-sm font-medium transition ${
                isActive('/swap') ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Swap
            </Link>
            <Link
              to="/liquidity"
              className={`text-sm font-medium transition ${
                isActive('/liquidity') ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Liquidity
            </Link>
            <Link
              to="/create-pool"
              className={`text-sm font-medium transition ${
                isActive('/create-pool') ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Pool
            </Link>
            <WalletMultiButton className="!bg-primary-600 hover:!bg-primary-700 !rounded-lg !h-10" />
          </nav>
        </div>
      </div>
    </header>
  );
};
