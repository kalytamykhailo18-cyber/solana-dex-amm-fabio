export type Dex = {
  "version": "0.1.0",
  "name": "dex",
  "instructions": [
    {
      "name": "initializePool",
      "accounts": [
        { "name": "payer", "isMut": true, "isSigner": true },
        { "name": "pool", "isMut": true, "isSigner": false },
        { "name": "tokenAMint", "isMut": false, "isSigner": false },
        { "name": "tokenBMint", "isMut": false, "isSigner": false },
        { "name": "tokenAVault", "isMut": true, "isSigner": false },
        { "name": "tokenBVault", "isMut": true, "isSigner": false },
        { "name": "lpMint", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false },
        { "name": "rent", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "feeRateBps", "type": "u16" }
      ]
    },
    {
      "name": "addLiquidity",
      "accounts": [
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "pool", "isMut": true, "isSigner": false },
        { "name": "userTokenA", "isMut": true, "isSigner": false },
        { "name": "userTokenB", "isMut": true, "isSigner": false },
        { "name": "tokenAVault", "isMut": true, "isSigner": false },
        { "name": "tokenBVault", "isMut": true, "isSigner": false },
        { "name": "lpMint", "isMut": true, "isSigner": false },
        { "name": "userLpToken", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "amountA", "type": "u64" },
        { "name": "amountB", "type": "u64" },
        { "name": "minLpTokens", "type": "u64" }
      ]
    },
    {
      "name": "removeLiquidity",
      "accounts": [
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "pool", "isMut": true, "isSigner": false },
        { "name": "userTokenA", "isMut": true, "isSigner": false },
        { "name": "userTokenB", "isMut": true, "isSigner": false },
        { "name": "tokenAVault", "isMut": true, "isSigner": false },
        { "name": "tokenBVault", "isMut": true, "isSigner": false },
        { "name": "lpMint", "isMut": true, "isSigner": false },
        { "name": "userLpToken", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "lpTokens", "type": "u64" },
        { "name": "minAmountA", "type": "u64" },
        { "name": "minAmountB", "type": "u64" }
      ]
    },
    {
      "name": "swap",
      "accounts": [
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "pool", "isMut": true, "isSigner": false },
        { "name": "userTokenIn", "isMut": true, "isSigner": false },
        { "name": "userTokenOut", "isMut": true, "isSigner": false },
        { "name": "vaultIn", "isMut": true, "isSigner": false },
        { "name": "vaultOut", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "amountIn", "type": "u64" },
        { "name": "minAmountOut", "type": "u64" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "pool",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "tokenAMint", "type": "publicKey" },
          { "name": "tokenBMint", "type": "publicKey" },
          { "name": "tokenAVault", "type": "publicKey" },
          { "name": "tokenBVault", "type": "publicKey" },
          { "name": "lpMint", "type": "publicKey" },
          { "name": "feeRateBps", "type": "u16" },
          { "name": "bump", "type": "u8" },
          { "name": "lpMintBump", "type": "u8" },
          { "name": "totalLpSupply", "type": "u64" }
        ]
      }
    }
  ],
  "errors": [
    { "code": 6000, "name": "InvalidFeeRate", "msg": "Invalid fee rate" },
    { "code": 6001, "name": "InsufficientLiquidity", "msg": "Insufficient liquidity" },
    { "code": 6002, "name": "SlippageExceeded", "msg": "Slippage exceeded" },
    { "code": 6003, "name": "InvalidTokenMint", "msg": "Invalid token mint" },
    { "code": 6004, "name": "MathOverflow", "msg": "Math overflow" },
    { "code": 6005, "name": "ZeroAmount", "msg": "Zero amount not allowed" },
    { "code": 6006, "name": "PoolAlreadyExists", "msg": "Pool already exists" },
    { "code": 6007, "name": "InvalidPoolState", "msg": "Invalid pool state" }
  ]
};

export const IDL: Dex = {
  "version": "0.1.0",
  "name": "dex",
  "instructions": [
    {
      "name": "initializePool",
      "accounts": [
        { "name": "payer", "isMut": true, "isSigner": true },
        { "name": "pool", "isMut": true, "isSigner": false },
        { "name": "tokenAMint", "isMut": false, "isSigner": false },
        { "name": "tokenBMint", "isMut": false, "isSigner": false },
        { "name": "tokenAVault", "isMut": true, "isSigner": false },
        { "name": "tokenBVault", "isMut": true, "isSigner": false },
        { "name": "lpMint", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false },
        { "name": "rent", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "feeRateBps", "type": "u16" }
      ]
    },
    {
      "name": "addLiquidity",
      "accounts": [
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "pool", "isMut": true, "isSigner": false },
        { "name": "userTokenA", "isMut": true, "isSigner": false },
        { "name": "userTokenB", "isMut": true, "isSigner": false },
        { "name": "tokenAVault", "isMut": true, "isSigner": false },
        { "name": "tokenBVault", "isMut": true, "isSigner": false },
        { "name": "lpMint", "isMut": true, "isSigner": false },
        { "name": "userLpToken", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "amountA", "type": "u64" },
        { "name": "amountB", "type": "u64" },
        { "name": "minLpTokens", "type": "u64" }
      ]
    },
    {
      "name": "removeLiquidity",
      "accounts": [
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "pool", "isMut": true, "isSigner": false },
        { "name": "userTokenA", "isMut": true, "isSigner": false },
        { "name": "userTokenB", "isMut": true, "isSigner": false },
        { "name": "tokenAVault", "isMut": true, "isSigner": false },
        { "name": "tokenBVault", "isMut": true, "isSigner": false },
        { "name": "lpMint", "isMut": true, "isSigner": false },
        { "name": "userLpToken", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "lpTokens", "type": "u64" },
        { "name": "minAmountA", "type": "u64" },
        { "name": "minAmountB", "type": "u64" }
      ]
    },
    {
      "name": "swap",
      "accounts": [
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "pool", "isMut": true, "isSigner": false },
        { "name": "userTokenIn", "isMut": true, "isSigner": false },
        { "name": "userTokenOut", "isMut": true, "isSigner": false },
        { "name": "vaultIn", "isMut": true, "isSigner": false },
        { "name": "vaultOut", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "amountIn", "type": "u64" },
        { "name": "minAmountOut", "type": "u64" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "pool",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "tokenAMint", "type": "publicKey" },
          { "name": "tokenBMint", "type": "publicKey" },
          { "name": "tokenAVault", "type": "publicKey" },
          { "name": "tokenBVault", "type": "publicKey" },
          { "name": "lpMint", "type": "publicKey" },
          { "name": "feeRateBps", "type": "u16" },
          { "name": "bump", "type": "u8" },
          { "name": "lpMintBump", "type": "u8" },
          { "name": "totalLpSupply", "type": "u64" }
        ]
      }
    }
  ],
  "errors": [
    { "code": 6000, "name": "InvalidFeeRate", "msg": "Invalid fee rate" },
    { "code": 6001, "name": "InsufficientLiquidity", "msg": "Insufficient liquidity" },
    { "code": 6002, "name": "SlippageExceeded", "msg": "Slippage exceeded" },
    { "code": 6003, "name": "InvalidTokenMint", "msg": "Invalid token mint" },
    { "code": 6004, "name": "MathOverflow", "msg": "Math overflow" },
    { "code": 6005, "name": "ZeroAmount", "msg": "Zero amount not allowed" },
    { "code": 6006, "name": "PoolAlreadyExists", "msg": "Pool already exists" },
    { "code": 6007, "name": "InvalidPoolState", "msg": "Invalid pool state" }
  ]
};
