import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreatePoolCard } from '../components/CreatePoolCard';

export const CreatePool: FC = () => {
  const navigate = useNavigate();

  const handlePoolCreated = (poolAddress: string) => {
    // Navigate to liquidity page with the new pool
    navigate(`/liquidity?pool=${poolAddress}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 animate-zoom-in animate-normal">Create New Pool</h1>
        <p className="text-gray-400 animate-fade-up animate-fast animate-delay-200">Start a new liquidity pool for any SPL token pair</p>
      </div>

      <div className="animate-fade-up animate-light-slow animate-delay-300">
        <CreatePoolCard onPoolCreated={handlePoolCreated} />
      </div>

      <div className="mt-8 bg-dark-800 rounded-xl p-6 animate-fade-up animate-slow animate-delay-500">
        <h3 className="text-lg font-bold text-white mb-4">How to create a pool</h3>
        <ol className="space-y-3 text-gray-400 text-sm list-decimal list-inside">
          <li className="animate-fade-right animate-fast animate-delay-600">
            <span className="text-white">Get token mint addresses</span>
            <p className="ml-6 mt-1">You need the mint addresses for both SPL tokens you want to pair.</p>
          </li>
          <li className="animate-fade-right animate-fast animate-delay-700">
            <span className="text-white">Choose a fee rate</span>
            <p className="ml-6 mt-1">Select an appropriate fee rate. Lower fees attract more volume, higher fees reward LPs more per trade.</p>
          </li>
          <li className="animate-fade-right animate-fast animate-delay-800">
            <span className="text-white">Create the pool</span>
            <p className="ml-6 mt-1">Click create and approve the transaction. This costs approximately 0.02 SOL in rent.</p>
          </li>
          <li className="animate-fade-right animate-fast animate-delay-900">
            <span className="text-white">Add initial liquidity</span>
            <p className="ml-6 mt-1">After creation, you'll be redirected to add the first liquidity. The ratio you set determines the initial price.</p>
          </li>
        </ol>
      </div>
    </div>
  );
};
