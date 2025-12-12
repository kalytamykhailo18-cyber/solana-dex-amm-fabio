// IDL for DEX program with two-step pool initialization
// Updated for stack overflow fix

export type Dex = {
  version: string;
  name: string;
  instructions: any[];
  accounts: any[];
  errors: any[];
  address: string;
};

export const IDL: Dex = {
  version: '0.1.0',
  name: 'dex',
  address: 'EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T',
  instructions: [
    {
      name: 'initializePool',
      accounts: [
        { name: 'payer', isMut: true, isSigner: true },
        { name: 'pool', isMut: true, isSigner: false },
        { name: 'tokenAMint', isMut: false, isSigner: false },
        { name: 'tokenBMint', isMut: false, isSigner: false },
        { name: 'tokenAVault', isMut: true, isSigner: false },
        { name: 'tokenProgram', isMut: false, isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [{ name: 'feeRateBps', type: 'u16' }],
    },
    {
      name: 'initializeLpMint',
      accounts: [
        { name: 'payer', isMut: true, isSigner: true },
        { name: 'pool', isMut: true, isSigner: false },
        { name: 'tokenBMint', isMut: false, isSigner: false },
        { name: 'tokenBVault', isMut: true, isSigner: false },
        { name: 'lpMint', isMut: true, isSigner: false },
        { name: 'tokenProgram', isMut: false, isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: 'addLiquidity',
      accounts: [
        { name: 'user', isMut: true, isSigner: true },
        { name: 'pool', isMut: true, isSigner: false },
        { name: 'userTokenA', isMut: true, isSigner: false },
        { name: 'userTokenB', isMut: true, isSigner: false },
        { name: 'tokenAVault', isMut: true, isSigner: false },
        { name: 'tokenBVault', isMut: true, isSigner: false },
        { name: 'lpMint', isMut: true, isSigner: false },
        { name: 'userLpToken', isMut: true, isSigner: false },
        { name: 'tokenProgram', isMut: false, isSigner: false },
      ],
      args: [
        { name: 'amountA', type: 'u64' },
        { name: 'amountB', type: 'u64' },
        { name: 'minLpTokens', type: 'u64' },
      ],
    },
    {
      name: 'removeLiquidity',
      accounts: [
        { name: 'user', isMut: true, isSigner: true },
        { name: 'pool', isMut: true, isSigner: false },
        { name: 'userTokenA', isMut: true, isSigner: false },
        { name: 'userTokenB', isMut: true, isSigner: false },
        { name: 'tokenAVault', isMut: true, isSigner: false },
        { name: 'tokenBVault', isMut: true, isSigner: false },
        { name: 'lpMint', isMut: true, isSigner: false },
        { name: 'userLpToken', isMut: true, isSigner: false },
        { name: 'tokenProgram', isMut: false, isSigner: false },
      ],
      args: [
        { name: 'lpTokens', type: 'u64' },
        { name: 'minAmountA', type: 'u64' },
        { name: 'minAmountB', type: 'u64' },
      ],
    },
    {
      name: 'swap',
      accounts: [
        { name: 'user', isMut: true, isSigner: true },
        { name: 'pool', isMut: true, isSigner: false },
        { name: 'userTokenIn', isMut: true, isSigner: false },
        { name: 'userTokenOut', isMut: true, isSigner: false },
        { name: 'vaultIn', isMut: true, isSigner: false },
        { name: 'vaultOut', isMut: true, isSigner: false },
        { name: 'tokenProgram', isMut: false, isSigner: false },
      ],
      args: [
        { name: 'amountIn', type: 'u64' },
        { name: 'minAmountOut', type: 'u64' },
      ],
    },
  ],
  accounts: [
    {
      name: 'Pool',
      type: {
        kind: 'struct',
        fields: [
          { name: 'tokenAMint', type: 'publicKey' },
          { name: 'tokenBMint', type: 'publicKey' },
          { name: 'tokenAVault', type: 'publicKey' },
          { name: 'tokenBVault', type: 'publicKey' },
          { name: 'lpMint', type: 'publicKey' },
          { name: 'feeRateBps', type: 'u16' },
          { name: 'bump', type: 'u8' },
          { name: 'lpMintBump', type: 'u8' },
          { name: 'totalLpSupply', type: 'u64' },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: 'InvalidFeeRate', msg: 'Fee rate must be <= 1000 bps (10%)' },
    { code: 6001, name: 'InvalidTokenMint', msg: 'Invalid token mint' },
    { code: 6002, name: 'InvalidPoolState', msg: 'Invalid pool state' },
    { code: 6003, name: 'ZeroAmount', msg: 'Amount must be greater than zero' },
    { code: 6004, name: 'InsufficientLiquidity', msg: 'Insufficient liquidity in pool' },
    { code: 6005, name: 'SlippageExceeded', msg: 'Slippage tolerance exceeded' },
    { code: 6006, name: 'MathOverflow', msg: 'Math operation overflow' },
  ],
};
