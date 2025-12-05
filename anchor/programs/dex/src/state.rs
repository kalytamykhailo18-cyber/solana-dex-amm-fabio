//! Pool Account State
//!
//! EVM: State in contract | Solana: State in accounts (like database rows)
//! Each pool = one account with this struct's data

use anchor_lang::prelude::*;

/// Pool account structure (180 bytes)
/// Like: Uniswap V2 Pair contract state
#[account]
#[derive(Default)]
pub struct Pool {
    /// Token A mint address (like ERC20 address in EVM)
    /// Type: Pubkey (32 bytes) vs address (20 bytes in EVM)
    pub token_a_mint: Pubkey,

    /// Token B mint address
    pub token_b_mint: Pubkey,

    /// Token A vault - SPL token account holding Token A reserves
    /// EVM: Tokens sent to pair contract | Solana: Held in separate vault account
    /// Pool owns vault via PDA (Program Derived Address)
    pub token_a_vault: Pubkey,

    /// Token B vault - holds Token B reserves
    pub token_b_vault: Pubkey,

    /// LP token mint - pool has authority to mint/burn
    /// EVM: Pair contract IS the LP token | Solana: Separate mint
    pub lp_mint: Pubkey,

    /// Fee rate in basis points (30 = 0.3%, 100 = 1%)
    /// Type: u16 (2 bytes), max 1000 (10%)
    /// EVM: Uniswap hardcodes 0.3% | This DEX: configurable per pool
    pub fee_rate_bps: u16,

    /// Pool PDA bump seed (Solana-specific)
    /// Used to sign transactions on behalf of pool
    /// No EVM equivalent (similar to CREATE2 but with no private key)
    pub bump: u8,

    /// LP mint PDA bump seed
    pub lp_mint_bump: u8,

    /// Total LP tokens minted (includes 9 decimals)
    /// Type: u64 (8 bytes) vs uint256 (32 bytes in EVM)
    /// Used to calculate user's share: user_lp / total_lp
    pub total_lp_supply: u64,
}

impl Pool {
    /// Account size: 180 bytes
    /// Cost: ~0.00124 SOL (~$0.22 @ $180/SOL)
    /// vs Uniswap pair creation: ~$50-200
    ///
    /// Breakdown:
    /// 8 (discriminator) + 32*5 (pubkeys) + 2 (u16) + 1 (u8) + 1 (u8) + 8 (u64)
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 32 + 2 + 1 + 1 + 8;
}
