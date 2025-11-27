use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Pool {
    /// Token A mint
    pub token_a_mint: Pubkey,

    /// Token B mint
    pub token_b_mint: Pubkey,

    /// Token A vault (PDA)
    pub token_a_vault: Pubkey,

    /// Token B vault (PDA)
    pub token_b_vault: Pubkey,

    /// LP token mint
    pub lp_mint: Pubkey,

    /// Fee rate in basis points
    pub fee_rate_bps: u16,

    /// Pool authority bump
    pub bump: u8,

    /// LP mint bump
    pub lp_mint_bump: u8,

    /// Total LP tokens minted
    pub total_lp_supply: u64,
}

impl Pool {
    pub const LEN: usize = 8 +  // discriminator
        32 +  // token_a_mint
        32 +  // token_b_mint
        32 +  // token_a_vault
        32 +  // token_b_vault
        32 +  // lp_mint
        2 +   // fee_rate_bps
        1 +   // bump
        1 +   // lp_mint_bump
        8;    // total_lp_supply
}
