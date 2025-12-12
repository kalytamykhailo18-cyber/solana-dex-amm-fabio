//! Initialize LP Mint and Vault B Instruction
//! Creates LP mint and vault B for an existing pool (Step 2 of pool creation)

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::state::Pool;

/// Accounts for initializing vault B and LP mint (Step 2)
#[derive(Accounts)]
pub struct InitializeLpMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub pool: Account<'info, Pool>,

    /// CHECK: Validated against pool state
    pub token_b_mint: AccountInfo<'info>,

    #[account(
        init,
        payer = payer,
        seeds = [VAULT_SEED, pool.key().as_ref(), token_b_mint.key().as_ref()],
        bump,
        token::mint = token_b_mint,
        token::authority = pool,
    )]
    pub token_b_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        seeds = [LP_MINT_SEED, pool.key().as_ref()],
        bump,
        mint::decimals = 9,
        mint::authority = pool,
    )]
    pub lp_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Handler - creates vault B, LP mint and updates pool
pub fn handler(ctx: Context<InitializeLpMint>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    // Store vault B and LP mint addresses
    pool.token_b_vault = ctx.accounts.token_b_vault.key();
    pool.lp_mint = ctx.accounts.lp_mint.key();
    pool.lp_mint_bump = ctx.bumps.lp_mint;

    msg!("Pool initialization complete (step 2/2): {}", pool.key());

    Ok(())
}
