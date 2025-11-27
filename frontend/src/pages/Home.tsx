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
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to SolDEX</h1>
        <p className="text-gray-400">A simple decentralized exchange on Solana</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-dark-800 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">&#9879;</div>
          <h3 className="text-lg font-bold text-white mb-1">Swap Tokens</h3>
          <p className="text-sm text-gray-400">Exchange tokens instantly with low fees</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">&#128176;</div>
          <h3 className="text-lg font-bold text-white mb-1">Provide Liquidity</h3>
          <p className="text-sm text-gray-400">Earn fees by adding liquidity to pools</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">&#128200;</div>
          <h3 className="text-lg font-bold text-white mb-1">Create Pools</h3>
          <p className="text-sm text-gray-400">Start new liquidity pools for any token pair</p>
        </div>
      </div>

      <PoolList onSelectPool={handleSelectPool} selectedPool={selectedPool} />

      {selectedPool && (
        <div className="mt-4 flex gap-4 justify-center">
          <button
            onClick={() => navigate(`/swap?pool=${selectedPool}`)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Swap in this Pool
          </button>
          <button
            onClick={() => navigate(`/liquidity?pool=${selectedPool}`)}
            className="bg-dark-700 hover:bg-dark-600 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Manage Liquidity
          </button>
        </div>
      )}
    </div>
  );
};
