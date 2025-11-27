use anchor_lang::prelude::*;

#[error_code]
pub enum DexError {
    #[msg("Invalid fee rate")]
    InvalidFeeRate,

    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,

    #[msg("Slippage exceeded")]
    SlippageExceeded,

    #[msg("Invalid token mint")]
    InvalidTokenMint,

    #[msg("Math overflow")]
    MathOverflow,

    #[msg("Zero amount not allowed")]
    ZeroAmount,

    #[msg("Pool already exists")]
    PoolAlreadyExists,

    #[msg("Invalid pool state")]
    InvalidPoolState,
}
