import { FC, useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useProgram } from '../hooks/useProgram';
import { fromBaseUnits, shortenAddress } from '../utils/constants';
import { getAccount } from '@solana/spl-token';

interface PoolInfo {
  address: string;
  tokenAMint: string;
  tokenBMint: string;
  reserveA: number;
  reserveB: number;
  feeRateBps: number;
  totalLpSupply: number;
}

interface Props {
  onSelectPool?: (poolAddress: string) => void;
  selectedPool?: string;
}

export const PoolList: FC<Props> = ({ onSelectPool, selectedPool }) => {
  const { program, connection } = useProgram();
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualPoolAddress, setManualPoolAddress] = useState('');

  const loadPools = useCallback(async () => {
    if (!program) return;

    setLoading(true);
    try {
      // Fetch all pool accounts
      const poolAccounts = await program.account.pool.all();

      const poolInfos: PoolInfo[] = await Promise.all(
        poolAccounts.map(async (account) => {
          let reserveA = 0;
          let reserveB = 0;

          try {
            const vaultA = await getAccount(connection, account.account.tokenAVault);
            const vaultB = await getAccount(connection, account.account.tokenBVault);
            reserveA = Number(vaultA.amount);
            reserveB = Number(vaultB.amount);
          } catch (error) {
            console.error('Failed to fetch vault balances:', error);
          }

          return {
            address: account.publicKey.toBase58(),
            tokenAMint: account.account.tokenAMint.toBase58(),
            tokenBMint: account.account.tokenBMint.toBase58(),
            reserveA,
            reserveB,
            feeRateBps: account.account.feeRateBps,
            totalLpSupply: account.account.totalLpSupply.toNumber(),
          };
        })
      );

      setPools(poolInfos);
    } catch (error) {
      console.error('Failed to load pools:', error);
    } finally {
      setLoading(false);
    }
  }, [program, connection]);

  useEffect(() => {
    loadPools();
  }, [loadPools]);

  const handleManualPoolSelect = () => {
    if (!manualPoolAddress) return;
    try {
      new PublicKey(manualPoolAddress);
      if (onSelectPool) {
        onSelectPool(manualPoolAddress);
      }
    } catch {
      // Invalid address
    }
  };

  const validateAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="bg-dark-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Liquidity Pools</h2>
        <button
          onClick={loadPools}
          disabled={loading}
          className="text-sm text-primary-400 hover:text-primary-300 disabled:text-gray-500"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Manual Pool Address Input */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Or enter pool address manually:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualPoolAddress}
            onChange={(e) => setManualPoolAddress(e.target.value)}
            placeholder="Pool address"
            className={`flex-1 bg-dark-900 border rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none transition ${
              manualPoolAddress && !validateAddress(manualPoolAddress)
                ? 'border-red-500'
                : 'border-dark-700 focus:border-primary-500'
            }`}
          />
          <button
            onClick={handleManualPoolSelect}
            disabled={!manualPoolAddress || !validateAddress(manualPoolAddress)}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition"
          >
            Select
          </button>
        </div>
      </div>

      {/* Pool List */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          Loading pools...
        </div>
      ) : pools.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No pools found</p>
          <p className="text-sm mt-2">Create a new pool to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pools.map((pool) => (
            <div
              key={pool.address}
              onClick={() => onSelectPool && onSelectPool(pool.address)}
              className={`p-4 rounded-lg cursor-pointer transition ${
                selectedPool === pool.address
                  ? 'bg-primary-600/20 border border-primary-500'
                  : 'bg-dark-900 hover:bg-dark-700 border border-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white font-medium">
                    {shortenAddress(pool.tokenAMint)} / {shortenAddress(pool.tokenBMint)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pool: {shortenAddress(pool.address, 8)}
                  </p>
                </div>
                <span className="text-xs bg-dark-700 text-gray-300 px-2 py-1 rounded">
                  {pool.feeRateBps / 100}% fee
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                <div>
                  <p className="text-gray-500">Reserve A</p>
                  <p className="text-white">{fromBaseUnits(pool.reserveA).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Reserve B</p>
                  <p className="text-white">{fromBaseUnits(pool.reserveB).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">LP Supply</p>
                  <p className="text-white">{fromBaseUnits(pool.totalLpSupply).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
