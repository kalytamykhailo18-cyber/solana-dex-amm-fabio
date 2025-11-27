import { FC, useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { usePool, PoolData } from '../hooks/usePool';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { calculateSwapOutput, fromBaseUnits, toBaseUnits, shortenAddress } from '../utils/constants';
import toast from 'react-hot-toast';

interface Props {
  poolAddress?: string;
}

export const SwapCard: FC<Props> = ({ poolAddress }) => {
  const { connected } = useWallet();
  const { swap, getPoolData, loading } = usePool();

  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [swapDirection, setSwapDirection] = useState<'AtoB' | 'BtoA'>('AtoB');
  const [slippage, setSlippage] = useState(1); // 1%

  const tokenInMint = poolData
    ? (swapDirection === 'AtoB' ? poolData.tokenAMint : poolData.tokenBMint)
    : null;
  const tokenOutMint = poolData
    ? (swapDirection === 'AtoB' ? poolData.tokenBMint : poolData.tokenAMint)
    : null;

  const { balance: tokenInBalance, refresh: refreshInBalance } = useTokenBalance(tokenInMint);
  const { balance: tokenOutBalance, refresh: refreshOutBalance } = useTokenBalance(tokenOutMint);

  const reserveIn = poolData
    ? (swapDirection === 'AtoB' ? poolData.reserveA : poolData.reserveB)
    : 0;
  const reserveOut = poolData
    ? (swapDirection === 'AtoB' ? poolData.reserveB : poolData.reserveA)
    : 0;

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

  // Calculate output amount when input changes
  useEffect(() => {
    if (!amountIn || !poolData || reserveIn === 0 || reserveOut === 0) {
      setAmountOut('');
      return;
    }

    const inputBaseUnits = toBaseUnits(parseFloat(amountIn));
    const outputBaseUnits = calculateSwapOutput(
      inputBaseUnits,
      reserveIn,
      reserveOut,
      poolData.feeRateBps
    );
    setAmountOut(fromBaseUnits(outputBaseUnits).toFixed(6));
  }, [amountIn, poolData, reserveIn, reserveOut]);

  const handleSwapDirection = () => {
    setSwapDirection(d => d === 'AtoB' ? 'BtoA' : 'AtoB');
    setAmountIn('');
    setAmountOut('');
  };

  const handleSwap = async () => {
    if (!poolAddress || !amountIn || !amountOut) return;

    try {
      const inputBaseUnits = toBaseUnits(parseFloat(amountIn));
      const minOutputBaseUnits = Math.floor(toBaseUnits(parseFloat(amountOut)) * (1 - slippage / 100));

      const tx = await swap(
        new PublicKey(poolAddress),
        inputBaseUnits,
        minOutputBaseUnits,
        swapDirection === 'AtoB'
      );

      toast.success(
        <div>
          <p>Swap successful!</p>
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

      setAmountIn('');
      setAmountOut('');
      loadPoolData();
      refreshInBalance();
      refreshOutBalance();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Swap failed';
      toast.error(errorMessage);
    }
  };

  const handleMaxInput = () => {
    if (tokenInBalance > 0) {
      setAmountIn(fromBaseUnits(tokenInBalance).toString());
    }
  };

  if (!poolAddress) {
    return (
      <div className="bg-dark-800 rounded-xl p-6 max-w-md mx-auto">
        <div className="text-center text-gray-400">
          <p>No pool selected</p>
          <p className="text-sm mt-2">Please select a pool to start swapping</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-800 rounded-xl p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Swap</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Slippage:</span>
          <select
            value={slippage}
            onChange={(e) => setSlippage(Number(e.target.value))}
            className="bg-dark-700 border border-dark-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value={0.5}>0.5%</option>
            <option value={1}>1%</option>
            <option value={2}>2%</option>
            <option value={5}>5%</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {/* Input Token */}
        <div className="bg-dark-900 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">You Pay</span>
            <span className="text-sm text-gray-400">
              Balance: {fromBaseUnits(tokenInBalance).toFixed(4)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl text-white outline-none"
            />
            <button
              onClick={handleMaxInput}
              className="text-xs text-primary-400 hover:text-primary-300 px-2 py-1 rounded bg-primary-600/20"
            >
              MAX
            </button>
            <div className="bg-dark-700 px-3 py-2 rounded-lg">
              <span className="text-white font-medium">
                {tokenInMint ? shortenAddress(tokenInMint) : 'Token A'}
              </span>
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleSwapDirection}
            className="bg-dark-700 hover:bg-dark-800 border-4 border-dark-800 p-2 rounded-xl transition"
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* Output Token */}
        <div className="bg-dark-900 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">You Receive</span>
            <span className="text-sm text-gray-400">
              Balance: {fromBaseUnits(tokenOutBalance).toFixed(4)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amountOut}
              readOnly
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl text-white outline-none"
            />
            <div className="bg-dark-700 px-3 py-2 rounded-lg">
              <span className="text-white font-medium">
                {tokenOutMint ? shortenAddress(tokenOutMint) : 'Token B'}
              </span>
            </div>
          </div>
        </div>

        {/* Pool Info */}
        {poolData && (
          <div className="bg-dark-900/50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between text-gray-400">
              <span>Fee</span>
              <span>{poolData.feeRateBps / 100}%</span>
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
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!connected || loading || !amountIn || !amountOut}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition"
        >
          {!connected
            ? 'Connect Wallet'
            : loading
            ? 'Swapping...'
            : !amountIn
            ? 'Enter Amount'
            : 'Swap'}
        </button>
      </div>
    </div>
  );
};
