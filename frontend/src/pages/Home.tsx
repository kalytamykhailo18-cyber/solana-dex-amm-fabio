import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PoolList } from '../components/PoolList';

export const Home: FC = () => {
  const navigate = useNavigate();
  const [selectedPool, setSelectedPool] = useState<string>('');

  const handleSelectPool = (poolAddress: string) => {
    setSelectedPool(poolAddress);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-transparent bg-clip-text mb-3">Welcome to DexSpeed</h1>
        <p className="text-silver-300 text-lg">Trade EBK and SPL tokens with lightning speed on Solana</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-black-100 to-black-200 border border-silver-800 rounded-xl p-6 text-center hover:border-gold-500/50 transition-all">
          <div className="text-3xl mb-2">⚡</div>
          <h3 className="text-lg font-bold text-gold-400 mb-1">Swap Tokens</h3>
          <p className="text-sm text-silver-400">Exchange tokens instantly with minimal fees</p>
        </div>
        <div className="bg-gradient-to-br from-black-100 to-black-200 border border-silver-800 rounded-xl p-6 text-center hover:border-gold-500/50 transition-all">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="text-lg font-bold text-gold-400 mb-1">Provide Liquidity</h3>
          <p className="text-sm text-silver-400">Earn fees by adding liquidity to pools</p>
        </div>
        <div className="bg-gradient-to-br from-black-100 to-black-200 border border-silver-800 rounded-xl p-6 text-center hover:border-gold-500/50 transition-all">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="text-lg font-bold text-gold-400 mb-1">Create Pools</h3>
          <p className="text-sm text-silver-400">Start new liquidity pools for any token pair</p>
        </div>
      </div>

      <PoolList onSelectPool={handleSelectPool} selectedPool={selectedPool} />

      {selectedPool && (
        <div className="mt-4 flex gap-4 justify-center">
          <button
            onClick={() => navigate(`/swap?pool=${selectedPool}`)}
            className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black font-semibold px-6 py-3 rounded-lg transition shadow-lg shadow-gold-500/20"
          >
            Swap in this Pool
          </button>
          <button
            onClick={() => navigate(`/liquidity?pool=${selectedPool}`)}
            className="bg-silver-800 hover:bg-silver-700 text-silver-100 px-6 py-3 rounded-lg font-medium transition border border-silver-600"
          >
            Manage Liquidity
          </button>
        </div>
      )}
    </div>
  );
};
