//! Remove Liquidity Instruction
//! Burn LP tokens and receive underlying tokens back

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::DexError;
use crate::state::Pool;

/// Accounts for removing liquidity
/// EVM: Like removeLiquidity() in Uniswap V2 Router
#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    /// User removing liquidity (signs transaction)
    #[account(mut)]
    pub user: Signer<'info>,

    /// Pool to remove liquidity from
    /// mut: Updates total_lp_supply
    #[account(
        mut,
        seeds = [POOL_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    /// User's Token A account (destination)
    #[account(
        mut,
        constraint = user_token_a.mint == pool.token_a_mint @ DexError::InvalidTokenMint,
        constraint = user_token_a.owner == user.key()
    )]
    pub user_token_a: Account<'info, TokenAccount>,

    /// User's Token B account (destination)
    #[account(
        mut,
        constraint = user_token_b.mint == pool.token_b_mint @ DexError::InvalidTokenMint,
        constraint = user_token_b.owner == user.key()
    )]
    pub user_token_b: Account<'info, TokenAccount>,

    /// Pool's Token A vault (source)
    #[account(
        mut,
        constraint = token_a_vault.key() == pool.token_a_vault @ DexError::InvalidPoolState
    )]
    pub token_a_vault: Account<'info, TokenAccount>,

    /// Pool's Token B vault (source)
    #[account(
        mut,
        constraint = token_b_vault.key() == pool.token_b_vault @ DexError::InvalidPoolState
    )]
    pub token_b_vault: Account<'info, TokenAccount>,

    /// LP token mint (to burn from)
    #[account(
        mut,
        constraint = lp_mint.key() == pool.lp_mint @ DexError::InvalidPoolState
    )]
    pub lp_mint: Account<'info, Mint>,

    /// User's LP token account (source of LP tokens to burn)
    #[account(
        mut,
        constraint = user_lp_token.mint == pool.lp_mint @ DexError::InvalidTokenMint,
        constraint = user_lp_token.owner == user.key()
    )]
    pub user_lp_token: Account<'info, TokenAccount>,

    /// SPL Token program
    pub token_program: Program<'info, Token>,
}

/// Handler - burns LP tokens, returns underlying tokens
/// Like: Uniswap V2 Router's removeLiquidity()
/// @param lp_tokens - LP tokens to burn
/// @param min_amount_a - Minimum Token A to receive (slippage protection)
/// @param min_amount_b - Minimum Token B to receive (slippage protection)
pub fn handler(
    ctx: Context<RemoveLiquidity>,
    lp_tokens: u64,
    min_amount_a: u64,
    min_amount_b: u64,
) -> Result<()> {
    // Validate LP token amount
    require!(lp_tokens > 0, DexError::ZeroAmount);

    let pool = &mut ctx.accounts.pool;
    let reserve_a = ctx.accounts.token_a_vault.amount;
    let reserve_b = ctx.accounts.token_b_vault.amount;

    // Ensure pool has liquidity
    require!(pool.total_lp_supply > 0, DexError::InsufficientLiquidity);

    // Calculate tokens to return (proportional to LP share)
    // amount_a = (lp_tokens * reserve_a) / total_lp_supply
    let amount_a = (lp_tokens as u128)
        .checked_mul(reserve_a as u128)
        .ok_or(DexError::MathOverflow)?
        .checked_div(pool.total_lp_supply as u128)
        .ok_or(DexError::MathOverflow)? as u64;

    let amount_b = (lp_tokens as u128)
        .checked_mul(reserve_b as u128)
        .ok_or(DexError::MathOverflow)?
        .checked_div(pool.total_lp_supply as u128)
        .ok_or(DexError::MathOverflow)? as u64;

    // Slippage checks
    require!(amount_a >= min_amount_a, DexError::SlippageExceeded);
    require!(amount_b >= min_amount_b, DexError::SlippageExceeded);

    // Burn LP tokens from user
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.lp_mint.to_account_info(),
                from: ctx.accounts.user_lp_token.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        lp_tokens,
    )?;

    // Prepare pool PDA signer (pool signs vault transfers)
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

    // Transfer Token A: vault → user
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.token_a_vault.to_account_info(),
                to: ctx.accounts.user_token_a.to_account_info(),
                authority: pool.to_account_info(),
            },
            signer_seeds,
        ),
        amount_a,
    )?;

    // Transfer Token B: vault → user
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.token_b_vault.to_account_info(),
                to: ctx.accounts.user_token_b.to_account_info(),
                authority: pool.to_account_info(),
            },
            signer_seeds,
        ),
        amount_b,
    )?;

    // Update total LP supply
    pool.total_lp_supply = pool
        .total_lp_supply
        .checked_sub(lp_tokens)
        .ok_or(DexError::MathOverflow)?;

    msg!("Removed liquidity: {} token_a, {} token_b", amount_a, amount_b);

    Ok(())
}
