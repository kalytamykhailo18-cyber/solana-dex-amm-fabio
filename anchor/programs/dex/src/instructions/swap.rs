//! Swap Instruction
//! Exchange one token for another using AMM formula

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::DexError;
use crate::state::Pool;

/// Accounts for token swap
/// EVM: Like swap() in Uniswap V2 Router
#[derive(Accounts)]
pub struct Swap<'info> {
    /// User performing swap (signs transaction)
    #[account(mut)]
    pub user: Signer<'info>,

    /// Pool to swap through
    /// seeds check: Ensures correct pool PDA
    #[account(
        mut,
        seeds = [POOL_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    /// User's input token account (source)
    /// constraint: User must own this account
    #[account(
        mut,
        constraint = user_token_in.owner == user.key()
    )]
    pub user_token_in: Account<'info, TokenAccount>,

    /// User's output token account (destination)
    #[account(
        mut,
        constraint = user_token_out.owner == user.key()
    )]
    pub user_token_out: Account<'info, TokenAccount>,

    /// Pool's input vault (receives tokens)
    /// constraint: Must be one of pool's vaults
    #[account(
        mut,
        constraint = vault_in.key() == pool.token_a_vault || vault_in.key() == pool.token_b_vault @ DexError::InvalidPoolState
    )]
    pub vault_in: Account<'info, TokenAccount>,

    /// Pool's output vault (sends tokens)
    /// constraint: Must be other pool vault (not same as vault_in)
    #[account(
        mut,
        constraint = vault_out.key() == pool.token_a_vault || vault_out.key() == pool.token_b_vault @ DexError::InvalidPoolState,
        constraint = vault_out.key() != vault_in.key() @ DexError::InvalidPoolState
    )]
    pub vault_out: Account<'info, TokenAccount>,

    /// SPL Token program
    pub token_program: Program<'info, Token>,
}

/// Handler - swaps tokens using constant product formula
/// Like: Uniswap V2's swap()
/// Formula: x * y = k (constant product AMM)
/// @param amount_in - Input token amount
/// @param min_amount_out - Minimum output (slippage protection)
pub fn handler(
    ctx: Context<Swap>,
    amount_in: u64,
    min_amount_out: u64,
) -> Result<()> {
    // Validate input amount
    require!(amount_in > 0, DexError::ZeroAmount);

    let pool = &ctx.accounts.pool;
    let reserve_in = ctx.accounts.vault_in.amount;
    let reserve_out = ctx.accounts.vault_out.amount;

    // Ensure pool has liquidity
    require!(reserve_in > 0 && reserve_out > 0, DexError::InsufficientLiquidity);

    // Calculate output using constant product formula with fee
    // amount_out = (reserve_out * amount_in * (1 - fee)) / (reserve_in + amount_in * (1 - fee))

    // Fee factor: 10000 - fee_bps (e.g., 10000 - 30 = 9970 for 0.3% fee)
    let fee_factor = FEE_DENOMINATOR
        .checked_sub(pool.fee_rate_bps as u64)
        .ok_or(DexError::MathOverflow)?;

    // Amount after fee deduction
    let amount_in_with_fee = (amount_in as u128)
        .checked_mul(fee_factor as u128)
        .ok_or(DexError::MathOverflow)?;

    // Numerator: amount_in_with_fee * reserve_out
    let numerator = amount_in_with_fee
        .checked_mul(reserve_out as u128)
        .ok_or(DexError::MathOverflow)?;

    // Denominator: reserve_in * 10000 + amount_in_with_fee
    let denominator = (reserve_in as u128)
        .checked_mul(FEE_DENOMINATOR as u128)
        .ok_or(DexError::MathOverflow)?
        .checked_add(amount_in_with_fee)
        .ok_or(DexError::MathOverflow)?;

    // Final output amount
    let amount_out = numerator
        .checked_div(denominator)
        .ok_or(DexError::MathOverflow)? as u64;

    // Slippage check
    require!(amount_out >= min_amount_out, DexError::SlippageExceeded);
    // Ensure sufficient reserves remain
    require!(amount_out < reserve_out, DexError::InsufficientLiquidity);

    // Transfer input tokens: user → vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_in.to_account_info(),
                to: ctx.accounts.vault_in.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_in,
    )?;

    // Prepare pool PDA signer
    let token_a_mint = pool.token_a_mint;
    let token_b_mint = pool.token_b_mint;
    let bump = pool.bump;

    let seeds = &[
        POOL_SEED,
        token_a_mint.as_ref(),
        token_b_mint.as_ref(),
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];

    // Transfer output tokens: vault → user
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_out.to_account_info(),
                to: ctx.accounts.user_token_out.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        ),
        amount_out,
    )?;

    msg!("Swapped {} for {}", amount_in, amount_out);

    Ok(())
}
