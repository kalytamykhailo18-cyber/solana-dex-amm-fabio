//! Initialize Pool Instruction
//! Creates a new liquidity pool for a token pair

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::DexError;
use crate::state::Pool;

/// Accounts required for pool initialization
/// EVM: Like constructor parameters + msg.sender
#[derive(Accounts)]
pub struct InitializePool<'info> {
    /// Who pays for account creation (like msg.sender in EVM)
    /// Must be mutable to deduct SOL for rent
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Pool account being created (like deploying new contract in EVM)
    /// init: Create new account
    /// payer: Who pays rent (~0.00124 SOL)
    /// space: Account size (180 bytes)
    /// seeds: Derives address from token mints (deterministic, one pool per pair)
    /// bump: PDA bump (stored in pool.bump)
    #[account(
        init,
        payer = payer,
        space = Pool::LEN,
        seeds = [POOL_SEED, token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    /// Token A mint (like ERC20 address)
    pub token_a_mint: Account<'info, Mint>,

    /// Token B mint
    pub token_b_mint: Account<'info, Mint>,

    /// Vault to hold Token A reserves
    /// init: Create new token account
    /// seeds: Derives vault address (owned by pool PDA)
    /// token::mint: This vault holds token_a_mint tokens
    /// token::authority: Pool controls this vault (can transfer tokens)
    #[account(
        init,
        payer = payer,
        seeds = [VAULT_SEED, pool.key().as_ref(), token_a_mint.key().as_ref()],
        bump,
        token::mint = token_a_mint,
        token::authority = pool,
    )]
    pub token_a_vault: Account<'info, TokenAccount>,

    /// Vault to hold Token B reserves
    #[account(
        init,
        payer = payer,
        seeds = [VAULT_SEED, pool.key().as_ref(), token_b_mint.key().as_ref()],
        bump,
        token::mint = token_b_mint,
        token::authority = pool,
    )]
    pub token_b_vault: Account<'info, TokenAccount>,

    /// LP token mint (pool can mint/burn LP tokens)
    /// mint::decimals: 9 (standard for Solana)
    /// mint::authority: Pool controls minting/burning
    #[account(
        init,
        payer = payer,
        seeds = [LP_MINT_SEED, pool.key().as_ref()],
        bump,
        mint::decimals = 9,
        mint::authority = pool,
    )]
    pub lp_mint: Account<'info, Mint>,

    /// SPL Token program (like calling ERC20 contract)
    pub token_program: Program<'info, Token>,

    /// System program (creates accounts)
    pub system_program: Program<'info, System>,

    /// Rent sysvar (calculates rent cost)
    pub rent: Sysvar<'info, Rent>,
}

/// Handler function - initializes pool state
/// Like: Uniswap V2 Factory's createPair()
pub fn handler(ctx: Context<InitializePool>, fee_rate_bps: u16) -> Result<()> {
    // Validate fee (must be <= 10%)
    // Like: require(fee <= MAX_FEE) in Solidity
    require!(fee_rate_bps <= MAX_FEE_BPS, DexError::InvalidFeeRate);

    let pool = &mut ctx.accounts.pool;

    // Store all addresses in pool state
    pool.token_a_mint = ctx.accounts.token_a_mint.key();
    pool.token_b_mint = ctx.accounts.token_b_mint.key();
    pool.token_a_vault = ctx.accounts.token_a_vault.key();
    pool.token_b_vault = ctx.accounts.token_b_vault.key();
    pool.lp_mint = ctx.accounts.lp_mint.key();

    // Store fee rate
    pool.fee_rate_bps = fee_rate_bps;

    // Store PDA bumps (used for signing later)
    pool.bump = ctx.bumps.pool;
    pool.lp_mint_bump = ctx.bumps.lp_mint;

    // Initial LP supply is 0 (no liquidity yet)
    pool.total_lp_supply = 0;

    msg!("Pool initialized: {}", pool.key());

    Ok(())
}
