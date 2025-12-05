//! Custom Error Codes
//!
//! Like: Solidity custom errors or require() messages
//! Anchor auto-generates error codes starting from 6000

use anchor_lang::prelude::*;

#[error_code]
pub enum DexError {
    #[msg("Invalid fee rate")]
    InvalidFeeRate,              // Fee > MAX_FEE_BPS (1000 = 10%)

    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,       // Pool has no liquidity or amount too small

    #[msg("Slippage exceeded")]
    SlippageExceeded,            // Output < min expected (price moved too much)

    #[msg("Invalid token mint")]
    InvalidTokenMint,            // Wrong token type for this pool

    #[msg("Math overflow")]
    MathOverflow,                // Arithmetic overflow (like SafeMath in Solidity)

    #[msg("Zero amount not allowed")]
    ZeroAmount,                  // User tried to swap/add 0 tokens

    #[msg("Pool already exists")]
    PoolAlreadyExists,           // Pool for this token pair already created

    #[msg("Invalid pool state")]
    InvalidPoolState,            // Pool account data corrupted or wrong
}
