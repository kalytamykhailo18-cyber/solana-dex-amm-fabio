//! Add Liquidity Instruction
//! Deposit tokens into pool and receive LP tokens

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::DexError;
use crate::state::Pool;

/// Accounts for adding liquidity
/// EVM: Like addLiquidity() in Uniswap V2 Router
#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    /// User adding liquidity (pays gas, signs transaction)
    #[account(mut)]
    pub user: Signer<'info>,

    /// Pool to add liquidity to
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    /// User's Token A account (source)
    #[account(mut)]
    pub user_token_a: Account<'info, TokenAccount>,

    /// User's Token B account (source)
    #[account(mut)]
    pub user_token_b: Account<'info, TokenAccount>,

    /// Pool's Token A vault (destination)
    #[account(mut)]
    pub token_a_vault: Account<'info, TokenAccount>,

    /// Pool's Token B vault (destination)
    #[account(mut)]
    pub token_b_vault: Account<'info, TokenAccount>,

    /// LP token mint (pool controls this)
    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,

    /// User's LP token account (receives LP tokens)
    #[account(mut)]
    pub user_lp_token: Account<'info, TokenAccount>,

    /// SPL Token program for CPI calls
    pub token_program: Program<'info, Token>,
}

/// Handler - deposits tokens, mints LP tokens
/// Like: Uniswap V2 Router's addLiquidity()
/// @param amount_a - Token A to deposit
/// @param amount_b - Token B to deposit
/// @param min_lp_tokens - Slippage protection (minimum LP tokens to receive)
pub fn handler(
    ctx: Context<AddLiquidity>,
    amount_a: u64,
    amount_b: u64,
    min_lp_tokens: u64,
) -> Result<()> {
    // Validate amounts (no zero deposits)
    require!(amount_a > 0 && amount_b > 0, DexError::ZeroAmount);

    let reserve_a = ctx.accounts.token_a_vault.amount;
    let reserve_b = ctx.accounts.token_b_vault.amount;

    // Extract values before mutable borrow
    let token_a_mint = ctx.accounts.pool.token_a_mint;
    let token_b_mint = ctx.accounts.pool.token_b_mint;
    let bump = ctx.accounts.pool.bump;
    let total_lp_supply = ctx.accounts.pool.total_lp_supply;

    // Calculate LP tokens to mint
    let lp_tokens_to_mint = if total_lp_supply == 0 {
        // First deposit: Use geometric mean (sqrt(a * b))
        // Like: Uniswap V2's sqrt(amount0 * amount1)
        let initial_lp = integer_sqrt(
            (amount_a as u128)
                .checked_mul(amount_b as u128)
                .ok_or(DexError::MathOverflow)?
        );

        // Prevent dust attacks
        require!(initial_lp >= MIN_LIQUIDITY as u128, DexError::InsufficientLiquidity);
        initial_lp as u64
    } else {
        // Subsequent deposits: Proportional to reserves
        // LP_from_A = (amount_a * total_lp) / reserve_a
        let lp_from_a = (amount_a as u128)
            .checked_mul(total_lp_supply as u128)
            .ok_or(DexError::MathOverflow)?
            .checked_div(reserve_a as u128)
            .ok_or(DexError::MathOverflow)? as u64;

        let lp_from_b = (amount_b as u128)
            .checked_mul(total_lp_supply as u128)
            .ok_or(DexError::MathOverflow)?
            .checked_div(reserve_b as u128)
            .ok_or(DexError::MathOverflow)? as u64;

        // Take minimum to maintain pool ratio
        std::cmp::min(lp_from_a, lp_from_b)
    };

    // Slippage check (like require(lpTokens >= minLpTokens))
    require!(lp_tokens_to_mint >= min_lp_tokens, DexError::SlippageExceeded);

    // Transfer Token A: user → vault
    // CPI = Cross-Program Invocation (like calling another contract in EVM)
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_a.to_account_info(),
                to: ctx.accounts.token_a_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_a,
    )?;

    // Transfer Token B: user → vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_b.to_account_info(),
                to: ctx.accounts.token_b_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_b,
    )?;

    // Mint LP tokens to user
    // Pool PDA signs this (using bump seed)
    let seeds = &[
        POOL_SEED,
        token_a_mint.as_ref(),
        token_b_mint.as_ref(),
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.lp_mint.to_account_info(),
                to: ctx.accounts.user_lp_token.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        ),
        lp_tokens_to_mint,
    )?;

    // Update total LP supply
    ctx.accounts.pool.total_lp_supply = ctx.accounts.pool
        .total_lp_supply
        .checked_add(lp_tokens_to_mint)
        .ok_or(DexError::MathOverflow)?;

    msg!("Added liquidity: {} LP tokens minted", lp_tokens_to_mint);

    Ok(())
}

/// Integer square root (Newton's method)
/// Used for first liquidity deposit calculation
fn integer_sqrt(value: u128) -> u128 {
    if value == 0 {
        return 0;
    }
    let mut x = value;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + value / x) / 2;
    }
    x
}
