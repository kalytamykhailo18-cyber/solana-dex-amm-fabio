import { FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SwapCard } from '../components/SwapCard';
import { PoolList } from '../components/PoolList';

export const Swap: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const poolAddress = searchParams.get('pool') || '';

  const handleSelectPool = (address: string) => {
    setSearchParams({ pool: address });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 animate-fade-down animate-fast">Swap Tokens</h1>
        <p className="text-gray-400 animate-fade-up animate-normal animate-delay-100">Exchange tokens with minimal slippage</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="animate-fade-right animate-light-slow animate-delay-200">
          <SwapCard poolAddress={poolAddress} />
        </div>
        <div className="animate-fade-left animate-light-slow animate-delay-300">
          <PoolList onSelectPool={handleSelectPool} selectedPool={poolAddress} />
        </div>
      </div>
    </div>
  );
};
