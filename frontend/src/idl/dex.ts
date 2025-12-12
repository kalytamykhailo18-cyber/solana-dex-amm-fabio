// IDL compatible with Anchor 0.30.1
// Using legacy format that works with Program constructor

export type Dex = {
  version: string;
  name: string;
  instructions: any[];
  accounts: any[];
  errors: any[];
};

export const IDL: Dex = {
  version: '0.1.0',
  name: 'dex',
  instructions: [
    {
      name: 'initializePool',
      accounts: [
        { name: 'pool', isMut: true, isSigner: false },
        { name: 'tokenAMint', isMut: false, isSigner: false },
        { name: 'tokenBMint', isMut: false, isSigner: false },
        { name: 'tokenAVault', isMut: true, isSigner: false },
        { name: 'tokenBVault', isMut: true, isSigner: false },
        { name: 'lpMint', isMut: true, isSigner: false },
        { name: 'payer', isMut: true, isSigner: true },
        { name: 'tokenProgram', isMut: false, isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false },
        { name: 'rent', isMut: false, isSigner: false },
      ],
      args: [{ name: 'feeRateBps', type: 'u16' }],
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
          { name: 'totalLpSupply', type: 'u64' },
          { name: 'bump', type: 'u8' },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: 'InvalidFeeRate', msg: 'Invalid fee rate' },
    { code: 6001, name: 'ZeroAmount', msg: 'Amount must be greater than zero' },
    { code: 6002, name: 'SlippageExceeded', msg: 'Slippage tolerance exceeded' },
    { code: 6003, name: 'InsufficientLiquidity', msg: 'Insufficient liquidity' },
    { code: 6004, name: 'MathOverflow', msg: 'Math operation overflow' },
    { code: 6005, name: 'InvalidTokenMint', msg: 'Invalid token mint' },
    { code: 6006, name: 'InvalidPoolState', msg: 'Invalid pool state' },
  ],
};
