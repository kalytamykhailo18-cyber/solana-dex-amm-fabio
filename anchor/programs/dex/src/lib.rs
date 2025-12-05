//! # Solana DEX Program
//!
//! **Solana vs EVM:**
//! - EVM: State in contract storage | Solana: State in separate accounts
//! - EVM: Contract address | Solana: Program ID + many account addresses
//! - Think: Program = API, Accounts = Database rows
//!
//! **This Program:** AMM DEX (like Uniswap V2)
//! - Create pools, add/remove liquidity, swap tokens
//! - Formula: x * y = k (constant product)

use anchor_lang::prelude::*;  // Anchor framework (like OpenZeppelin)

pub mod constants;    // MAX_FEE, MIN_LIQUIDITY, seeds
pub mod errors;       // Custom error codes
pub mod instructions; // Business logic
pub mod state;        // Account structures

use instructions::*;

// Program ID (like contract address in EVM)
// Update after: anchor build → solana address -k target/deploy/dex-keypair.json
declare_id!("D49a7ojaFB3DPfJJRKrnNz3XjZEcNGBPZBUHV9MghZqr");

#[program]
pub mod dex {
    use super::*;

    /// Creates a new liquidity pool for a token pair
    /// Like: Uniswap V2's createPair()
    ///
    /// @param ctx - All accounts needed (pool, vaults, LP mint, payer)
    /// @param fee_rate_bps - Fee in basis points (30 = 0.3%, max 1000 = 10%)
    ///
    /// Creates: Pool account + 2 vaults + LP mint
    /// Cost: ~0.0067 SOL
    pub fn initialize_pool(ctx: Context<InitializePool>, fee_rate_bps: u16) -> Result<()> {
        instructions::initialize_pool::handler(ctx, fee_rate_bps)
    }

    /// Add liquidity to pool, receive LP tokens
    /// Like: Uniswap V2's addLiquidity()
    ///
    /// @param amount_a - Token A amount (includes decimals: 1000000000 = 1 token @ 9 decimals)
    /// @param amount_b - Token B amount (must be proportional after first deposit)
    /// @param min_lp_tokens - Slippage protection (tx fails if LP tokens < this)
    ///
    /// Formula (first): LP = sqrt(amount_a * amount_b)
    /// Formula (later): LP = min(amount_a * total_lp / reserve_a, amount_b * total_lp / reserve_b)
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_a: u64,
        amount_b: u64,
        min_lp_tokens: u64,
    ) -> Result<()> {
        instructions::add_liquidity::handler(ctx, amount_a, amount_b, min_lp_tokens)
    }

    /// Burn LP tokens, receive underlying tokens
    /// Like: Uniswap V2's removeLiquidity()
    ///
    /// @param lp_tokens - LP tokens to burn
    /// @param min_amount_a - Slippage protection for Token A
    /// @param min_amount_b - Slippage protection for Token B
    ///
    /// Formula: amount = lp_tokens * reserve / total_lp_supply
    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_tokens: u64,
        min_amount_a: u64,
        min_amount_b: u64,
    ) -> Result<()> {
        instructions::remove_liquidity::handler(ctx, lp_tokens, min_amount_a, min_amount_b)
    }

    /// Swap one token for another using constant product AMM
    /// Like: Uniswap V2's swap()
    ///
    /// @param amount_in - Input token amount
    /// @param min_amount_out - Slippage protection (tx fails if output < this)
    ///
    /// Formula: x * y = k (constant product)
    /// With fees: amount_out = (reserve_out * amount_in * (1 - fee)) / (reserve_in + amount_in * (1 - fee))
    pub fn swap(ctx: Context<Swap>, amount_in: u64, min_amount_out: u64) -> Result<()> {
        instructions::swap::handler(ctx, amount_in, min_amount_out)
    }
}
