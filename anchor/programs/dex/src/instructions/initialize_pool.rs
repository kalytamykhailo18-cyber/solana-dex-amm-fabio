//! Initialize Pool Instruction
//! Creates a new liquidity pool for a token pair

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::DexError;
use crate::state::Pool;

/// Accounts required for pool initialization (Step 1: Pool + Vault A)
#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = Pool::LEN,
        seeds = [POOL_SEED, token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    /// CHECK: Token mint validation done manually
    pub token_a_mint: AccountInfo<'info>,

    /// CHECK: Token mint validation done manually
    pub token_b_mint: AccountInfo<'info>,

    #[account(
        init,
        payer = payer,
        seeds = [VAULT_SEED, pool.key().as_ref(), token_a_mint.key().as_ref()],
        bump,
        token::mint = token_a_mint,
        token::authority = pool,
    )]
    pub token_a_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Handler function - initializes pool state (Step 1)
/// Like: Uniswap V2 Factory's createPair()
pub fn handler(ctx: Context<InitializePool>, fee_rate_bps: u16) -> Result<()> {
    // Validate fee (must be <= 10%)
    require!(fee_rate_bps <= MAX_FEE_BPS, DexError::InvalidFeeRate);

    // Validate token mints (basic checks)
    require!(
        ctx.accounts.token_a_mint.owner == &anchor_spl::token::ID,
        DexError::InvalidTokenMint
    );
    require!(
        ctx.accounts.token_b_mint.owner == &anchor_spl::token::ID,
        DexError::InvalidTokenMint
    );

    let pool = &mut ctx.accounts.pool;

    // Store token mints and vault A
    pool.token_a_mint = ctx.accounts.token_a_mint.key();
    pool.token_b_mint = ctx.accounts.token_b_mint.key();
    pool.token_a_vault = ctx.accounts.token_a_vault.key();

    // Vault B and LP mint will be set in step 2
    pool.token_b_vault = Pubkey::default();
    pool.lp_mint = Pubkey::default();
    pool.lp_mint_bump = 0;

    // Store fee rate
    pool.fee_rate_bps = fee_rate_bps;

    // Store pool PDA bump
    pool.bump = ctx.bumps.pool;

    // Initial LP supply is 0 (no liquidity yet)
    pool.total_lp_supply = 0;

    msg!("Pool initialized (step 1/3): {}", pool.key());

    Ok(())
}
