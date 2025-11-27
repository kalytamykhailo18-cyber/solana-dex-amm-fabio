import { FC, useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { usePool, PoolData } from '../hooks/usePool';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { fromBaseUnits, toBaseUnits, shortenAddress } from '../utils/constants';
import toast from 'react-hot-toast';

interface Props {
  poolAddress?: string;
}

export const LiquidityCard: FC<Props> = ({ poolAddress }) => {
  const { connected } = useWallet();
  const { addLiquidity, removeLiquidity, getPoolData, loading } = usePool();

  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [lpTokens, setLpTokens] = useState('');

  const { balance: tokenABalance, refresh: refreshABalance } = useTokenBalance(poolData?.tokenAMint || null);
  const { balance: tokenBBalance, refresh: refreshBBalance } = useTokenBalance(poolData?.tokenBMint || null);
  const { balance: lpTokenBalance, refresh: refreshLpBalance } = useTokenBalance(poolData?.lpMint || null);

  const loadPoolData = useCallback(async () => {
    if (!poolAddress) return;
    try {
      const data = await getPoolData(new PublicKey(poolAddress));
      setPoolData(data);
    } catch (error) {
      console.error('Failed to load pool:', error);
    }
  }, [poolAddress, getPoolData]);

  useEffect(() => {
    loadPoolData();
  }, [loadPoolData]);

  // Calculate proportional amount B when amount A changes
  useEffect(() => {
    if (mode !== 'add' || !amountA || !poolData || poolData.reserveA === 0) {
      return;
    }

    if (poolData.totalLpSupply.toNumber() > 0) {
      const ratio = poolData.reserveB / poolData.reserveA;
      const calculatedB = parseFloat(amountA) * ratio;
      setAmountB(calculatedB.toFixed(6));
    }
  }, [amountA, poolData, mode]);

  const handleAddLiquidity = async () => {
    if (!poolAddress || !amountA || !amountB) return;

    try {
      const amountABase = toBaseUnits(parseFloat(amountA));
      const amountBBase = toBaseUnits(parseFloat(amountB));

      const tx = await addLiquidity(
        new PublicKey(poolAddress),
        amountABase,
        amountBBase,
        0 // min LP tokens (can add slippage protection)
      );

      toast.success(
        <div>
          <p>Liquidity added successfully!</p>
          <a
            href={`https://explorer.solana.com/tx/${tx}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 underline"
          >
            View transaction
          </a>
        </div>
      );

      setAmountA('');
      setAmountB('');
      loadPoolData();
      refreshABalance();
      refreshBBalance();
      refreshLpBalance();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add liquidity';
      toast.error(errorMessage);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!poolAddress || !lpTokens) return;

    try {
      const lpTokensBase = toBaseUnits(parseFloat(lpTokens));

      const tx = await removeLiquidity(
        new PublicKey(poolAddress),
        lpTokensBase,
        0, // min amount A
        0  // min amount B
      );

      toast.success(
        <div>
          <p>Liquidity removed successfully!</p>
          <a
            href={`https://explorer.solana.com/tx/${tx}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 underline"
          >
            View transaction
          </a>
        </div>
      );

      setLpTokens('');
      loadPoolData();
      refreshABalance();
      refreshBBalance();
      refreshLpBalance();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove liquidity';
      toast.error(errorMessage);
    }
  };

  // Calculate expected tokens when removing liquidity
  const getExpectedTokensFromLp = (lpAmount: string) => {
    if (!lpAmount || !poolData || poolData.totalLpSupply.toNumber() === 0) {
      return { tokenA: 0, tokenB: 0 };
    }

    const lpBase = toBaseUnits(parseFloat(lpAmount));
    const totalLp = poolData.totalLpSupply.toNumber();

    const tokenA = (lpBase * poolData.reserveA) / totalLp;
    const tokenB = (lpBase * poolData.reserveB) / totalLp;

    return {
      tokenA: fromBaseUnits(tokenA),
      tokenB: fromBaseUnits(tokenB),
    };
  };

  const expectedTokens = getExpectedTokensFromLp(lpTokens);

  if (!poolAddress) {
    return (
      <div className="bg-dark-800 rounded-xl p-6 max-w-md mx-auto">
        <div className="text-center text-gray-400">
          <p>No pool selected</p>
          <p className="text-sm mt-2">Please select a pool to manage liquidity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-800 rounded-xl p-6 max-w-md mx-auto">
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('add')}
          className={`flex-1 py-3 rounded-lg font-bold transition ${
            mode === 'add'
              ? 'bg-primary-600 text-white'
              : 'bg-dark-700 text-gray-400 hover:text-white'
          }`}
        >
          Add Liquidity
        </button>
        <button
          onClick={() => setMode('remove')}
          className={`flex-1 py-3 rounded-lg font-bold transition ${
            mode === 'remove'
              ? 'bg-primary-600 text-white'
              : 'bg-dark-700 text-gray-400 hover:text-white'
          }`}
        >
          Remove Liquidity
        </button>
      </div>

      {mode === 'add' ? (
        <div className="space-y-4">
          {/* Token A Input */}
          <div className="bg-dark-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Token A</span>
              <span className="text-sm text-gray-400">
                Balance: {fromBaseUnits(tokenABalance).toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-xl text-white outline-none"
              />
              <button
                onClick={() => setAmountA(fromBaseUnits(tokenABalance).toString())}
                className="text-xs text-primary-400 hover:text-primary-300 px-2 py-1 rounded bg-primary-600/20"
              >
                MAX
              </button>
              <span className="text-gray-400 text-sm">
                {poolData ? shortenAddress(poolData.tokenAMint) : '-'}
              </span>
            </div>
          </div>

          {/* Plus Icon */}
          <div className="flex justify-center">
            <div className="bg-dark-700 p-2 rounded-lg">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
              </svg>
            </div>
          </div>

          {/* Token B Input */}
          <div className="bg-dark-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Token B</span>
              <span className="text-sm text-gray-400">
                Balance: {fromBaseUnits(tokenBBalance).toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-xl text-white outline-none"
              />
              <button
                onClick={() => setAmountB(fromBaseUnits(tokenBBalance).toString())}
                className="text-xs text-primary-400 hover:text-primary-300 px-2 py-1 rounded bg-primary-600/20"
              >
                MAX
              </button>
              <span className="text-gray-400 text-sm">
                {poolData ? shortenAddress(poolData.tokenBMint) : '-'}
              </span>
            </div>
          </div>

          {/* Pool Share Info */}
          {poolData && amountA && amountB && (
            <div className="bg-dark-900/50 rounded-lg p-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Pool Share</span>
                <span>
                  {poolData.totalLpSupply.toNumber() > 0
                    ? (
                        (toBaseUnits(parseFloat(amountA)) /
                          (poolData.reserveA + toBaseUnits(parseFloat(amountA)))) *
                        100
                      ).toFixed(2)
                    : '100'}
                  %
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleAddLiquidity}
            disabled={!connected || loading || !amountA || !amountB}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition"
          >
            {!connected
              ? 'Connect Wallet'
              : loading
              ? 'Adding...'
              : 'Add Liquidity'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* LP Token Input */}
          <div className="bg-dark-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">LP Tokens</span>
              <span className="text-sm text-gray-400">
                Balance: {fromBaseUnits(lpTokenBalance).toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={lpTokens}
                onChange={(e) => setLpTokens(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-xl text-white outline-none"
              />
              <button
                onClick={() => setLpTokens(fromBaseUnits(lpTokenBalance).toString())}
                className="text-xs text-primary-400 hover:text-primary-300 px-2 py-1 rounded bg-primary-600/20"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Expected Output */}
          {lpTokens && (
            <div className="bg-dark-900/50 rounded-lg p-4 space-y-2">
              <span className="text-sm text-gray-400">You will receive:</span>
              <div className="flex justify-between text-white">
                <span>Token A</span>
                <span>{expectedTokens.tokenA.toFixed(6)}</span>
              </div>
              <div className="flex justify-between text-white">
                <span>Token B</span>
                <span>{expectedTokens.tokenB.toFixed(6)}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleRemoveLiquidity}
            disabled={!connected || loading || !lpTokens}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition"
          >
            {!connected
              ? 'Connect Wallet'
              : loading
              ? 'Removing...'
              : 'Remove Liquidity'}
          </button>
        </div>
      )}

      {/* Pool Info */}
      {poolData && (
        <div className="mt-4 pt-4 border-t border-dark-700">
          <div className="text-sm space-y-2">
            <div className="flex justify-between text-gray-400">
              <span>Total LP Supply</span>
              <span>{fromBaseUnits(poolData.totalLpSupply.toNumber()).toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Reserve A</span>
              <span>{fromBaseUnits(poolData.reserveA).toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Reserve B</span>
              <span>{fromBaseUnits(poolData.reserveB).toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
