import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { usePool } from '../hooks/usePool';
import toast from 'react-hot-toast';

interface Props {
  onPoolCreated?: (poolAddress: string) => void;
}

export const CreatePoolCard: FC<Props> = ({ onPoolCreated }) => {
  const { connected } = useWallet();
  const { initializePool, loading } = usePool();

  const [tokenAMint, setTokenAMint] = useState('');
  const [tokenBMint, setTokenBMint] = useState('');
  const [feeRate, setFeeRate] = useState('0.3'); // 0.3% default

  const validateMint = (mint: string): boolean => {
    try {
      new PublicKey(mint);
      return true;
    } catch {
      return false;
    }
  };

  const handleCreatePool = async () => {
    if (!tokenAMint || !tokenBMint) {
      toast.error('Please enter both token mint addresses');
      return;
    }

    if (!validateMint(tokenAMint)) {
      toast.error('Invalid Token A mint address');
      return;
    }

    if (!validateMint(tokenBMint)) {
      toast.error('Invalid Token B mint address');
      return;
    }

    if (tokenAMint === tokenBMint) {
      toast.error('Token A and Token B must be different');
      return;
    }

    try {
      const feeRateBps = Math.floor(parseFloat(feeRate) * 100); // Convert to basis points

      if (feeRateBps < 0 || feeRateBps > 1000) {
        toast.error('Fee rate must be between 0% and 10%');
        return;
      }

      const { tx, poolPda } = await initializePool(
        new PublicKey(tokenAMint),
        new PublicKey(tokenBMint),
        feeRateBps
      );

      toast.success(
        <div>
          <p>Pool created successfully!</p>
          <p className="text-sm text-gray-400 mt-1">Pool: {poolPda.toBase58().slice(0, 20)}...</p>
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

      // Reset form
      setTokenAMint('');
      setTokenBMint('');
      setFeeRate('0.3');

      // Callback with new pool address
      if (onPoolCreated) {
        onPoolCreated(poolPda.toBase58());
      }
    } catch (error: any) {
      console.error('Failed to create pool:', error);

      // Log transaction logs if available for debugging
      if (error?.logs) {
        console.error('Transaction logs:', error.logs);
      }
      if (error?.transactionLogs) {
        console.error('Transaction logs:', error.transactionLogs);
      }

      let errorMessage = 'Failed to create pool';
      if (error?.message) {
        errorMessage = error.message;
      }
      // Extract meaningful error from transaction logs
      const logs = error?.logs || error?.transactionLogs || [];
      if (logs.length > 0) {
        const errorLog = logs.find((log: string) =>
          log.includes('Error') || log.includes('failed') || log.includes('custom program error')
        );
        if (errorLog) {
          console.error('Found error log:', errorLog);
        }
      }

      toast.error(errorMessage);
    }
  };

  return (
    <div className="bg-dark-800 rounded-xl p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">Create Liquidity Pool</h2>

      <div className="space-y-4">
        {/* Token A Mint */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Token A Mint Address</label>
          <input
            type="text"
            value={tokenAMint}
            onChange={(e) => setTokenAMint(e.target.value)}
            placeholder="Enter SPL token mint address"
            className={`w-full bg-dark-900 border rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none transition ${
              tokenAMint && !validateMint(tokenAMint)
                ? 'border-red-500'
                : 'border-dark-700 focus:border-primary-500'
            }`}
          />
          {tokenAMint && !validateMint(tokenAMint) && (
            <p className="text-red-500 text-xs mt-1">Invalid address format</p>
          )}
        </div>

        {/* Token B Mint */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Token B Mint Address</label>
          <input
            type="text"
            value={tokenBMint}
            onChange={(e) => setTokenBMint(e.target.value)}
            placeholder="Enter SPL token mint address"
            className={`w-full bg-dark-900 border rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none transition ${
              tokenBMint && !validateMint(tokenBMint)
                ? 'border-red-500'
                : 'border-dark-700 focus:border-primary-500'
            }`}
          />
          {tokenBMint && !validateMint(tokenBMint) && (
            <p className="text-red-500 text-xs mt-1">Invalid address format</p>
          )}
        </div>

        {/* Fee Rate */}
        <div>
          <label className="block text-sm mb-2">Swap Fee Rate (%)</label>
          <select
            value={feeRate}
            onChange={(e) => setFeeRate(e.target.value)}
            className="w-full bg-dark-900 text-[#555] border border-dark-700 rounded-lg px-4 py-3 outline-none focus:border-primary-500 transition"
          >
            <option value="0.1">0.1% (Low fee)</option>
            <option value="0.3">0.3% (Standard)</option>
            <option value="0.5">0.5% (Medium)</option>
            <option value="1">1% (High)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Fees are distributed to liquidity providers
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-dark-900/50 rounded-lg p-4 text-sm text-gray-400">
          <h4 className="font-medium text-white mb-2">Pool Creation Info</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li>Pool creation costs ~0.02 SOL in rent</li>
            <li>You'll need to add initial liquidity after creation</li>
            <li>Pools are deterministic based on token pair</li>
            <li>Each token pair can only have one pool</li>
          </ul>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreatePool}
          disabled={!connected || loading || !tokenAMint || !tokenBMint}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition"
        >
          {!connected
            ? 'Connect Wallet'
            : loading
            ? 'Creating Pool...'
            : 'Create Pool'}
        </button>
      </div>
    </div>
  );
};
