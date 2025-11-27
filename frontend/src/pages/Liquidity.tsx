import { FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LiquidityCard } from '../components/LiquidityCard';
import { PoolList } from '../components/PoolList';

export const Liquidity: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const poolAddress = searchParams.get('pool') || '';

  const handleSelectPool = (address: string) => {
    setSearchParams({ pool: address });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Manage Liquidity</h1>
        <p className="text-gray-400">Add or remove liquidity from pools and earn fees</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <LiquidityCard poolAddress={poolAddress} />
        </div>
        <div>
          <PoolList onSelectPool={handleSelectPool} selectedPool={poolAddress} />
        </div>
      </div>
    </div>
  );
};
