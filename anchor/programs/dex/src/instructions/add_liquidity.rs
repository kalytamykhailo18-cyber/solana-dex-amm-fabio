use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::DexError;
use crate::state::Pool;

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        constraint = user_token_a.mint == pool.token_a_mint @ DexError::InvalidTokenMint,
        constraint = user_token_a.owner == user.key()
    )]
    pub user_token_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_b.mint == pool.token_b_mint @ DexError::InvalidTokenMint,
        constraint = user_token_b.owner == user.key()
    )]
    pub user_token_b: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = token_a_vault.key() == pool.token_a_vault @ DexError::InvalidPoolState
    )]
    pub token_a_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = token_b_vault.key() == pool.token_b_vault @ DexError::InvalidPoolState
    )]
    pub token_b_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = lp_mint.key() == pool.lp_mint @ DexError::InvalidPoolState
    )]
    pub lp_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = user_lp_token.mint == pool.lp_mint @ DexError::InvalidTokenMint,
        constraint = user_lp_token.owner == user.key()
    )]
    pub user_lp_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<AddLiquidity>,
    amount_a: u64,
    amount_b: u64,
    min_lp_tokens: u64,
) -> Result<()> {
    require!(amount_a > 0 && amount_b > 0, DexError::ZeroAmount);

    let pool = &mut ctx.accounts.pool;
    let reserve_a = ctx.accounts.token_a_vault.amount;
    let reserve_b = ctx.accounts.token_b_vault.amount;

    // Calculate LP tokens to mint
    let lp_tokens_to_mint = if pool.total_lp_supply == 0 {
        // Initial liquidity - use geometric mean
        let initial_lp = integer_sqrt(
            (amount_a as u128)
                .checked_mul(amount_b as u128)
                .ok_or(DexError::MathOverflow)?
        );

        require!(initial_lp >= MIN_LIQUIDITY as u128, DexError::InsufficientLiquidity);
        initial_lp as u64
    } else {
        // Subsequent liquidity - proportional to reserves
        let lp_from_a = (amount_a as u128)
            .checked_mul(pool.total_lp_supply as u128)
            .ok_or(DexError::MathOverflow)?
            .checked_div(reserve_a as u128)
            .ok_or(DexError::MathOverflow)? as u64;

        let lp_from_b = (amount_b as u128)
            .checked_mul(pool.total_lp_supply as u128)
            .ok_or(DexError::MathOverflow)?
            .checked_div(reserve_b as u128)
            .ok_or(DexError::MathOverflow)? as u64;

        // Take minimum to ensure proportional deposit
        std::cmp::min(lp_from_a, lp_from_b)
    };

    require!(lp_tokens_to_mint >= min_lp_tokens, DexError::SlippageExceeded);

    // Transfer token A from user to vault
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

    // Transfer token B from user to vault
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

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.lp_mint.to_account_info(),
                to: ctx.accounts.user_lp_token.to_account_info(),
                authority: pool.to_account_info(),
            },
            signer_seeds,
        ),
        lp_tokens_to_mint,
    )?;

    pool.total_lp_supply = pool
        .total_lp_supply
        .checked_add(lp_tokens_to_mint)
        .ok_or(DexError::MathOverflow)?;

    msg!("Added liquidity: {} LP tokens minted", lp_tokens_to_mint);

    Ok(())
}

// Integer square root using Newton's method
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
