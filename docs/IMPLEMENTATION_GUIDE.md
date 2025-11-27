# Solana DEX/AMM MVP - Step-by-Step Implementation Guide

This guide breaks down the implementation into small, manageable steps to minimize errors.

---

## Phase 0: Environment Setup

### Step 0.1: Install Rust
```bash
# Windows (PowerShell as Admin)
winget install Rustlang.Rust.MSVC

# Or download from https://rustup.rs
# After install, restart terminal and verify:
rustc --version
cargo --version
```

### Step 0.2: Install Solana CLI
```bash
# Windows
# Download installer from https://docs.solana.com/cli/install-solana-cli-tools
# Or use:
sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"

# Verify installation
solana --version
```

### Step 0.3: Install Anchor Framework
```bash
# Install AVM (Anchor Version Manager)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install latest Anchor
avm install latest
avm use latest

# Verify
anchor --version
```

### Step 0.4: Install Node.js and Yarn
```bash
# Install Node.js LTS from https://nodejs.org
node --version  # Should be 18+

# Install Yarn
npm install -g yarn
yarn --version
```

### Step 0.5: Configure Solana CLI for Devnet
```bash
# Set to devnet
solana config set --url devnet

# Generate a new keypair for development
solana-keygen new --outfile ~/.config/solana/devnet.json

# Set as default keypair
solana config set --keypair ~/.config/solana/devnet.json

# Get some devnet SOL for testing
solana airdrop 2

# Verify configuration
solana config get
solana balance
```

---

## Phase 1: Project Initialization

### Step 1.1: Create Project Directory Structure
```bash
# Create main project folder
mkdir solana-dex-mvp
cd solana-dex-mvp

# Initialize git
git init
```

### Step 1.2: Create Centralized Environment File
```bash
# Create .env file (we'll populate this fully later)
touch .env
touch .env.example
```

### Step 1.3: Initialize Anchor Project
```bash
# Create Anchor project
anchor init anchor --name dex

# This creates the anchor/ folder with basic structure
```

### Step 1.4: Initialize Frontend Project
```bash
# Create React project with Vite
npm create vite@latest frontend -- --template react-ts

# Navigate to frontend
cd frontend

# Install dependencies
yarn add @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/wallet-adapter-base @solana/spl-token @coral-xyz/anchor

# Install UI dependencies
yarn add @tailwindcss/forms tailwindcss postcss autoprefixer
yarn add react-hot-toast

# Initialize Tailwind
npx tailwindcss init -p

cd ..
```

### Step 1.5: Create .env File with All Parameters
Create the centralized configuration file at project root:

```env
# ============================================
# SOLANA DEX MVP - CENTRALIZED CONFIGURATION
# ============================================

# ----- NETWORK CONFIGURATION -----
SOLANA_NETWORK=devnet
# Options: devnet, testnet, mainnet-beta

SOLANA_RPC_URL=https://api.devnet.solana.com
# For mainnet, use: https://api.mainnet-beta.solana.com
# Or use custom RPC: https://your-rpc-provider.com

SOLANA_WEBSOCKET_URL=wss://api.devnet.solana.com
# WebSocket for real-time updates

# ----- WALLET CONFIGURATION -----
DEPLOYER_KEYPAIR_PATH=~/.config/solana/devnet.json
# Path to deployer wallet keypair

# ----- PROGRAM CONFIGURATION -----
PROGRAM_ID=
# Will be populated after first deployment
# Example: DexProgramXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ----- DEX PARAMETERS -----
DEFAULT_SWAP_FEE_BPS=30
# Swap fee in basis points (30 = 0.3%)

LP_FEE_SHARE_PERCENT=100
# Percentage of fees going to liquidity providers

MIN_LIQUIDITY=1000
# Minimum liquidity to initialize a pool (in base units)

# ----- TOKEN CONFIGURATION -----
BASE_TOKEN_MINT=
# Your base token mint address (leave empty to create new)

BASE_TOKEN_DECIMALS=9
# Decimals for base token (9 is Solana standard)

BASE_TOKEN_NAME=MyToken
BASE_TOKEN_SYMBOL=MTK

# ----- FRONTEND CONFIGURATION -----
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_PROGRAM_ID=
VITE_APP_NAME=SolDEX
VITE_APP_DESCRIPTION=Simple Solana DEX

# ----- POOL DEFAULTS -----
DEFAULT_SLIPPAGE_BPS=100
# Default slippage tolerance (100 = 1%)

MAX_SLIPPAGE_BPS=1000
# Maximum allowed slippage (1000 = 10%)

# ----- JUPITER INTEGRATION -----
JUPITER_ENABLED=false
# Set to true when Jupiter integration is active

JUPITER_API_URL=https://quote-api.jup.ag/v6
# Jupiter API endpoint

# ----- DEPLOYMENT -----
FRONTEND_URL=
# Your frontend URL after deployment

PRIORITY_FEE_LAMPORTS=1000
# Priority fee for faster transactions (optional)
```

### Step 1.6: Create .env.example (for version control)
Copy the same content but remove sensitive values.

---

## Phase 2: Smart Contract Development

### Step 2.1: Define Program Constants
Create `anchor/programs/dex/src/constants.rs`:

```rust
// Seed prefixes for PDAs
pub const POOL_SEED: &[u8] = b"pool";
pub const LP_MINT_SEED: &[u8] = b"lp_mint";
pub const VAULT_SEED: &[u8] = b"vault";

// Fee constants
pub const FEE_DENOMINATOR: u64 = 10000; // Basis points denominator
pub const MAX_FEE_BPS: u16 = 1000;      // Max 10% fee
pub const MIN_LIQUIDITY: u64 = 1000;    // Minimum initial liquidity
```

### Step 2.2: Define Error Types
Create `anchor/programs/dex/src/errors.rs`:

```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum DexError {
    #[msg("Invalid fee rate")]
    InvalidFeeRate,

    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,

    #[msg("Slippage exceeded")]
    SlippageExceeded,

    #[msg("Invalid token mint")]
    InvalidTokenMint,

    #[msg("Math overflow")]
    MathOverflow,

    #[msg("Zero amount not allowed")]
    ZeroAmount,

    #[msg("Pool already exists")]
    PoolAlreadyExists,

    #[msg("Invalid pool state")]
    InvalidPoolState,
}
```

### Step 2.3: Define State Structures
Create `anchor/programs/dex/src/state.rs`:

```rust
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
```

### Step 2.4: Create Initialize Pool Instruction
Create `anchor/programs/dex/src/instructions/initialize_pool.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::DexError;
use crate::state::Pool;

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

    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        seeds = [VAULT_SEED, pool.key().as_ref(), token_a_mint.key().as_ref()],
        bump,
        token::mint = token_a_mint,
        token::authority = pool,
    )]
    pub token_a_vault: Account<'info, TokenAccount>,

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
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializePool>, fee_rate_bps: u16) -> Result<()> {
    require!(fee_rate_bps <= MAX_FEE_BPS, DexError::InvalidFeeRate);

    let pool = &mut ctx.accounts.pool;

    pool.token_a_mint = ctx.accounts.token_a_mint.key();
    pool.token_b_mint = ctx.accounts.token_b_mint.key();
    pool.token_a_vault = ctx.accounts.token_a_vault.key();
    pool.token_b_vault = ctx.accounts.token_b_vault.key();
    pool.lp_mint = ctx.accounts.lp_mint.key();
    pool.fee_rate_bps = fee_rate_bps;
    pool.bump = ctx.bumps.pool;
    pool.lp_mint_bump = ctx.bumps.lp_mint;
    pool.total_lp_supply = 0;

    msg!("Pool initialized: {}", pool.key());

    Ok(())
}
```

### Step 2.5: Create Add Liquidity Instruction
Create `anchor/programs/dex/src/instructions/add_liquidity.rs`:

```rust
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
        constraint = user_token_a.mint == pool.token_a_mint,
        constraint = user_token_a.owner == user.key()
    )]
    pub user_token_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_b.mint == pool.token_b_mint,
        constraint = user_token_b.owner == user.key()
    )]
    pub user_token_b: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = token_a_vault.key() == pool.token_a_vault
    )]
    pub token_a_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = token_b_vault.key() == pool.token_b_vault
    )]
    pub token_b_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = lp_mint.key() == pool.lp_mint
    )]
    pub lp_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = user_lp_token.mint == pool.lp_mint,
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
        // Initial liquidity
        let initial_lp = (amount_a as u128)
            .checked_mul(amount_b as u128)
            .ok_or(DexError::MathOverflow)?
            .integer_sqrt() as u64;

        require!(initial_lp >= MIN_LIQUIDITY, DexError::InsufficientLiquidity);
        initial_lp
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
    let seeds = &[
        POOL_SEED,
        pool.token_a_mint.as_ref(),
        pool.token_b_mint.as_ref(),
        &[pool.bump],
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

// Helper trait for integer square root
trait IntegerSquareRoot {
    fn integer_sqrt(self) -> Self;
}

impl IntegerSquareRoot for u128 {
    fn integer_sqrt(self) -> Self {
        if self == 0 {
            return 0;
        }
        let mut x = self;
        let mut y = (x + 1) / 2;
        while y < x {
            x = y;
            y = (x + self / x) / 2;
        }
        x
    }
}
```

### Step 2.6: Create Remove Liquidity Instruction
Create `anchor/programs/dex/src/instructions/remove_liquidity.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::DexError;
use crate::state::Pool;

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
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
        constraint = user_token_a.mint == pool.token_a_mint,
        constraint = user_token_a.owner == user.key()
    )]
    pub user_token_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_b.mint == pool.token_b_mint,
        constraint = user_token_b.owner == user.key()
    )]
    pub user_token_b: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = token_a_vault.key() == pool.token_a_vault
    )]
    pub token_a_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = token_b_vault.key() == pool.token_b_vault
    )]
    pub token_b_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = lp_mint.key() == pool.lp_mint
    )]
    pub lp_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = user_lp_token.mint == pool.lp_mint,
        constraint = user_lp_token.owner == user.key()
    )]
    pub user_lp_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<RemoveLiquidity>,
    lp_tokens: u64,
    min_amount_a: u64,
    min_amount_b: u64,
) -> Result<()> {
    require!(lp_tokens > 0, DexError::ZeroAmount);

    let pool = &mut ctx.accounts.pool;
    let reserve_a = ctx.accounts.token_a_vault.amount;
    let reserve_b = ctx.accounts.token_b_vault.amount;

    require!(pool.total_lp_supply > 0, DexError::InsufficientLiquidity);

    // Calculate tokens to return
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

    require!(amount_a >= min_amount_a, DexError::SlippageExceeded);
    require!(amount_b >= min_amount_b, DexError::SlippageExceeded);

    // Burn LP tokens
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

    // Transfer tokens from vaults to user
    let seeds = &[
        POOL_SEED,
        pool.token_a_mint.as_ref(),
        pool.token_b_mint.as_ref(),
        &[pool.bump],
    ];
    let signer_seeds = &[&seeds[..]];

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

    pool.total_lp_supply = pool
        .total_lp_supply
        .checked_sub(lp_tokens)
        .ok_or(DexError::MathOverflow)?;

    msg!("Removed liquidity: {} token_a, {} token_b", amount_a, amount_b);

    Ok(())
}
```

### Step 2.7: Create Swap Instruction
Create `anchor/programs/dex/src/instructions/swap.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::DexError;
use crate::state::Pool;

#[derive(Accounts)]
pub struct Swap<'info> {
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
        constraint = user_token_in.owner == user.key()
    )]
    pub user_token_in: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_out.owner == user.key()
    )]
    pub user_token_out: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_in.key() == pool.token_a_vault || vault_in.key() == pool.token_b_vault
    )]
    pub vault_in: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_out.key() == pool.token_a_vault || vault_out.key() == pool.token_b_vault,
        constraint = vault_out.key() != vault_in.key()
    )]
    pub vault_out: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<Swap>,
    amount_in: u64,
    min_amount_out: u64,
) -> Result<()> {
    require!(amount_in > 0, DexError::ZeroAmount);

    let pool = &ctx.accounts.pool;
    let reserve_in = ctx.accounts.vault_in.amount;
    let reserve_out = ctx.accounts.vault_out.amount;

    require!(reserve_in > 0 && reserve_out > 0, DexError::InsufficientLiquidity);

    // Calculate output amount using constant product formula
    // amount_out = (reserve_out * amount_in * (1 - fee)) / (reserve_in + amount_in * (1 - fee))

    let fee_factor = FEE_DENOMINATOR
        .checked_sub(pool.fee_rate_bps as u64)
        .ok_or(DexError::MathOverflow)?;

    let amount_in_with_fee = (amount_in as u128)
        .checked_mul(fee_factor as u128)
        .ok_or(DexError::MathOverflow)?;

    let numerator = amount_in_with_fee
        .checked_mul(reserve_out as u128)
        .ok_or(DexError::MathOverflow)?;

    let denominator = (reserve_in as u128)
        .checked_mul(FEE_DENOMINATOR as u128)
        .ok_or(DexError::MathOverflow)?
        .checked_add(amount_in_with_fee)
        .ok_or(DexError::MathOverflow)?;

    let amount_out = numerator
        .checked_div(denominator)
        .ok_or(DexError::MathOverflow)? as u64;

    require!(amount_out >= min_amount_out, DexError::SlippageExceeded);
    require!(amount_out < reserve_out, DexError::InsufficientLiquidity);

    // Transfer input tokens from user to vault
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

    // Transfer output tokens from vault to user
    let seeds = &[
        POOL_SEED,
        pool.token_a_mint.as_ref(),
        pool.token_b_mint.as_ref(),
        &[pool.bump],
    ];
    let signer_seeds = &[&seeds[..]];

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
```

### Step 2.8: Create Instructions Module
Create `anchor/programs/dex/src/instructions/mod.rs`:

```rust
pub mod initialize_pool;
pub mod add_liquidity;
pub mod remove_liquidity;
pub mod swap;

pub use initialize_pool::*;
pub use add_liquidity::*;
pub use remove_liquidity::*;
pub use swap::*;
```

### Step 2.9: Create Main Program Entry Point
Update `anchor/programs/dex/src/lib.rs`:

```rust
use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("11111111111111111111111111111111"); // Will be updated after build

#[program]
pub mod dex {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>, fee_rate_bps: u16) -> Result<()> {
        instructions::initialize_pool::handler(ctx, fee_rate_bps)
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_a: u64,
        amount_b: u64,
        min_lp_tokens: u64,
    ) -> Result<()> {
        instructions::add_liquidity::handler(ctx, amount_a, amount_b, min_lp_tokens)
    }

    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_tokens: u64,
        min_amount_a: u64,
        min_amount_b: u64,
    ) -> Result<()> {
        instructions::remove_liquidity::handler(ctx, lp_tokens, min_amount_a, min_amount_b)
    }

    pub fn swap(ctx: Context<Swap>, amount_in: u64, min_amount_out: u64) -> Result<()> {
        instructions::swap::handler(ctx, amount_in, min_amount_out)
    }
}
```

### Step 2.10: Update Cargo.toml
Update `anchor/programs/dex/Cargo.toml`:

```toml
[package]
name = "dex"
version = "0.1.0"
description = "Simple Solana DEX with AMM"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "dex"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.30.0"
anchor-spl = "0.30.0"
```

### Step 2.11: Update Anchor.toml
Update `anchor/Anchor.toml`:

```toml
[features]
seeds = false
skip-lint = false

[programs.devnet]
dex = "11111111111111111111111111111111"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/devnet.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### Step 2.12: Build the Program
```bash
cd anchor
anchor build
```

### Step 2.13: Get Program ID and Update
```bash
# Get the generated program ID
solana address -k target/deploy/dex-keypair.json

# Update the program ID in:
# 1. anchor/programs/dex/src/lib.rs (declare_id!)
# 2. anchor/Anchor.toml ([programs.devnet])
# 3. .env file (PROGRAM_ID and VITE_PROGRAM_ID)

# Rebuild after updating
anchor build
```

### Step 2.14: Deploy to Devnet
```bash
# Ensure you have devnet SOL
solana balance

# Deploy
anchor deploy

# Verify deployment
solana program show <PROGRAM_ID>
```

---

## Phase 3: Frontend Development

### Step 3.1: Configure Tailwind CSS
Update `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        dark: {
          800: '#1e293b',
          900: '#0f172a',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

### Step 3.2: Create Environment Configuration
Create `frontend/src/config/env.ts`:

```typescript
export const config = {
  // Network
  network: import.meta.env.VITE_SOLANA_NETWORK || 'devnet',
  rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',

  // Program
  programId: import.meta.env.VITE_PROGRAM_ID || '',

  // App
  appName: import.meta.env.VITE_APP_NAME || 'SolDEX',
  appDescription: import.meta.env.VITE_APP_DESCRIPTION || 'Simple Solana DEX',

  // Trading
  defaultSlippageBps: Number(import.meta.env.VITE_DEFAULT_SLIPPAGE_BPS) || 100,
  maxSlippageBps: Number(import.meta.env.VITE_MAX_SLIPPAGE_BPS) || 1000,

  // Jupiter
  jupiterEnabled: import.meta.env.VITE_JUPITER_ENABLED === 'true',
  jupiterApiUrl: import.meta.env.VITE_JUPITER_API_URL || 'https://quote-api.jup.ag/v6',
};

export type Config = typeof config;
```

### Step 3.3: Create Wallet Provider
Create `frontend/src/components/WalletProvider.tsx`:

```tsx
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { config } from '../config/env';

import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletProvider: FC<Props> = ({ children }) => {
  const endpoint = config.rpcUrl;

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
```

### Step 3.4: Create IDL Type File
Create `frontend/src/idl/dex.ts` (copy from `anchor/target/idl/dex.json` after build):

```typescript
export type Dex = {
  "version": "0.1.0",
  "name": "dex",
  "instructions": [
    // This will be generated by Anchor - copy from target/idl/dex.json
  ],
  "accounts": [],
  "types": [],
  "errors": []
};

export const IDL: Dex = {
  "version": "0.1.0",
  "name": "dex",
  "instructions": [],
  "accounts": [],
  "types": [],
  "errors": []
};
```

### Step 3.5: Create Program Hook
Create `frontend/src/hooks/useProgram.ts`:

```typescript
import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { config } from '../config/env';
import { IDL } from '../idl/dex';

export const useProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet.publicKey) return null;
    return new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(
      IDL as Idl,
      new PublicKey(config.programId),
      provider
    );
  }, [provider]);

  return { program, provider };
};
```

### Step 3.6: Create Pool Hook
Create `frontend/src/hooks/usePool.ts`:

```typescript
import { useCallback, useState } from 'react';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useProgram } from './useProgram';
import { BN } from '@coral-xyz/anchor';

const POOL_SEED = Buffer.from('pool');
const VAULT_SEED = Buffer.from('vault');
const LP_MINT_SEED = Buffer.from('lp_mint');

export const usePool = () => {
  const { program } = useProgram();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);

  const getPoolPda = useCallback((tokenAMint: PublicKey, tokenBMint: PublicKey) => {
    if (!program) return null;
    const [poolPda] = PublicKey.findProgramAddressSync(
      [POOL_SEED, tokenAMint.toBuffer(), tokenBMint.toBuffer()],
      program.programId
    );
    return poolPda;
  }, [program]);

  const initializePool = useCallback(async (
    tokenAMint: PublicKey,
    tokenBMint: PublicKey,
    feeRateBps: number
  ) => {
    if (!program || !wallet.publicKey) throw new Error('Not connected');

    setLoading(true);
    try {
      const poolPda = getPoolPda(tokenAMint, tokenBMint);
      if (!poolPda) throw new Error('Could not derive pool PDA');

      const [tokenAVault] = PublicKey.findProgramAddressSync(
        [VAULT_SEED, poolPda.toBuffer(), tokenAMint.toBuffer()],
        program.programId
      );

      const [tokenBVault] = PublicKey.findProgramAddressSync(
        [VAULT_SEED, poolPda.toBuffer(), tokenBMint.toBuffer()],
        program.programId
      );

      const [lpMint] = PublicKey.findProgramAddressSync(
        [LP_MINT_SEED, poolPda.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .initializePool(feeRateBps)
        .accounts({
          payer: wallet.publicKey,
          pool: poolPda,
          tokenAMint,
          tokenBMint,
          tokenAVault,
          tokenBVault,
          lpMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      return { tx, poolPda };
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, getPoolPda]);

  const addLiquidity = useCallback(async (
    poolPda: PublicKey,
    amountA: number,
    amountB: number,
    minLpTokens: number
  ) => {
    if (!program || !wallet.publicKey) throw new Error('Not connected');

    setLoading(true);
    try {
      const pool = await program.account.pool.fetch(poolPda);

      const userTokenA = await getAssociatedTokenAddress(pool.tokenAMint, wallet.publicKey);
      const userTokenB = await getAssociatedTokenAddress(pool.tokenBMint, wallet.publicKey);
      const userLpToken = await getAssociatedTokenAddress(pool.lpMint, wallet.publicKey);

      // Check if LP token account exists, if not create it
      const lpAccountInfo = await connection.getAccountInfo(userLpToken);
      const preInstructions = [];

      if (!lpAccountInfo) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userLpToken,
            wallet.publicKey,
            pool.lpMint
          )
        );
      }

      const tx = await program.methods
        .addLiquidity(new BN(amountA), new BN(amountB), new BN(minLpTokens))
        .accounts({
          user: wallet.publicKey,
          pool: poolPda,
          userTokenA,
          userTokenB,
          tokenAVault: pool.tokenAVault,
          tokenBVault: pool.tokenBVault,
          lpMint: pool.lpMint,
          userLpToken,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc();

      return tx;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, connection]);

  const removeLiquidity = useCallback(async (
    poolPda: PublicKey,
    lpTokens: number,
    minAmountA: number,
    minAmountB: number
  ) => {
    if (!program || !wallet.publicKey) throw new Error('Not connected');

    setLoading(true);
    try {
      const pool = await program.account.pool.fetch(poolPda);

      const userTokenA = await getAssociatedTokenAddress(pool.tokenAMint, wallet.publicKey);
      const userTokenB = await getAssociatedTokenAddress(pool.tokenBMint, wallet.publicKey);
      const userLpToken = await getAssociatedTokenAddress(pool.lpMint, wallet.publicKey);

      const tx = await program.methods
        .removeLiquidity(new BN(lpTokens), new BN(minAmountA), new BN(minAmountB))
        .accounts({
          user: wallet.publicKey,
          pool: poolPda,
          userTokenA,
          userTokenB,
          tokenAVault: pool.tokenAVault,
          tokenBVault: pool.tokenBVault,
          lpMint: pool.lpMint,
          userLpToken,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return tx;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey]);

  const swap = useCallback(async (
    poolPda: PublicKey,
    amountIn: number,
    minAmountOut: number,
    swapAToB: boolean
  ) => {
    if (!program || !wallet.publicKey) throw new Error('Not connected');

    setLoading(true);
    try {
      const pool = await program.account.pool.fetch(poolPda);

      const userTokenIn = await getAssociatedTokenAddress(
        swapAToB ? pool.tokenAMint : pool.tokenBMint,
        wallet.publicKey
      );
      const userTokenOut = await getAssociatedTokenAddress(
        swapAToB ? pool.tokenBMint : pool.tokenAMint,
        wallet.publicKey
      );

      const vaultIn = swapAToB ? pool.tokenAVault : pool.tokenBVault;
      const vaultOut = swapAToB ? pool.tokenBVault : pool.tokenAVault;

      // Check if output token account exists
      const outAccountInfo = await connection.getAccountInfo(userTokenOut);
      const preInstructions = [];

      if (!outAccountInfo) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userTokenOut,
            wallet.publicKey,
            swapAToB ? pool.tokenBMint : pool.tokenAMint
          )
        );
      }

      const tx = await program.methods
        .swap(new BN(amountIn), new BN(minAmountOut))
        .accounts({
          user: wallet.publicKey,
          pool: poolPda,
          userTokenIn,
          userTokenOut,
          vaultIn,
          vaultOut,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc();

      return tx;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, connection]);

  return {
    loading,
    getPoolPda,
    initializePool,
    addLiquidity,
    removeLiquidity,
    swap,
  };
};
```

### Step 3.7: Create Header Component
Create `frontend/src/components/Header.tsx`:

```tsx
import { FC } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { config } from '../config/env';

export const Header: FC = () => {
  return (
    <header className="bg-dark-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">{config.appName}</h1>
          <span className="text-xs bg-primary-600 px-2 py-1 rounded text-white">
            {config.network}
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="/" className="text-gray-300 hover:text-white">Pools</a>
          <a href="/swap" className="text-gray-300 hover:text-white">Swap</a>
          <a href="/liquidity" className="text-gray-300 hover:text-white">Liquidity</a>
          <WalletMultiButton />
        </nav>
      </div>
    </header>
  );
};
```

### Step 3.8: Create Swap Component
Create `frontend/src/components/SwapCard.tsx`:

```tsx
import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { usePool } from '../hooks/usePool';
import toast from 'react-hot-toast';

interface Props {
  poolPda?: string;
}

export const SwapCard: FC<Props> = ({ poolPda }) => {
  const { connected } = useWallet();
  const { swap, loading } = usePool();

  const [amountIn, setAmountIn] = useState('');
  const [minAmountOut, setMinAmountOut] = useState('');
  const [swapDirection, setSwapDirection] = useState<'AtoB' | 'BtoA'>('AtoB');

  const handleSwap = async () => {
    if (!poolPda || !amountIn) return;

    try {
      const tx = await swap(
        new PublicKey(poolPda),
        Number(amountIn) * 1e9, // Assuming 9 decimals
        Number(minAmountOut || 0) * 1e9,
        swapDirection === 'AtoB'
      );
      toast.success(`Swap successful! TX: ${tx.slice(0, 8)}...`);
      setAmountIn('');
      setMinAmountOut('');
    } catch (error: any) {
      toast.error(error.message || 'Swap failed');
    }
  };

  return (
    <div className="bg-dark-800 rounded-xl p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-white mb-4">Swap Tokens</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-1">You Pay</label>
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            className="w-full bg-dark-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setSwapDirection(d => d === 'AtoB' ? 'BtoA' : 'AtoB')}
            className="bg-gray-700 p-2 rounded-full hover:bg-gray-600"
          >
            ↕️
          </button>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-1">You Receive (minimum)</label>
          <input
            type="number"
            value={minAmountOut}
            onChange={(e) => setMinAmountOut(e.target.value)}
            placeholder="0.0"
            className="w-full bg-dark-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
          />
        </div>

        <button
          onClick={handleSwap}
          disabled={!connected || loading || !amountIn}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
        >
          {!connected ? 'Connect Wallet' : loading ? 'Swapping...' : 'Swap'}
        </button>
      </div>
    </div>
  );
};
```

### Step 3.9: Create Liquidity Component
Create `frontend/src/components/LiquidityCard.tsx`:

```tsx
import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { usePool } from '../hooks/usePool';
import toast from 'react-hot-toast';

interface Props {
  poolPda?: string;
}

export const LiquidityCard: FC<Props> = ({ poolPda }) => {
  const { connected } = useWallet();
  const { addLiquidity, removeLiquidity, loading } = usePool();

  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [lpTokens, setLpTokens] = useState('');

  const handleAddLiquidity = async () => {
    if (!poolPda || !amountA || !amountB) return;

    try {
      const tx = await addLiquidity(
        new PublicKey(poolPda),
        Number(amountA) * 1e9,
        Number(amountB) * 1e9,
        0 // min LP tokens
      );
      toast.success(`Liquidity added! TX: ${tx.slice(0, 8)}...`);
      setAmountA('');
      setAmountB('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add liquidity');
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!poolPda || !lpTokens) return;

    try {
      const tx = await removeLiquidity(
        new PublicKey(poolPda),
        Number(lpTokens) * 1e9,
        0, // min amount A
        0  // min amount B
      );
      toast.success(`Liquidity removed! TX: ${tx.slice(0, 8)}...`);
      setLpTokens('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove liquidity');
    }
  };

  return (
    <div className="bg-dark-800 rounded-xl p-6 max-w-md mx-auto">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('add')}
          className={`flex-1 py-2 rounded-lg font-bold transition ${
            mode === 'add'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Add
        </button>
        <button
          onClick={() => setMode('remove')}
          className={`flex-1 py-2 rounded-lg font-bold transition ${
            mode === 'remove'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Remove
        </button>
      </div>

      {mode === 'add' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Token A Amount</label>
            <input
              type="number"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              placeholder="0.0"
              className="w-full bg-dark-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Token B Amount</label>
            <input
              type="number"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              placeholder="0.0"
              className="w-full bg-dark-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
            />
          </div>
          <button
            onClick={handleAddLiquidity}
            disabled={!connected || loading || !amountA || !amountB}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
          >
            {!connected ? 'Connect Wallet' : loading ? 'Adding...' : 'Add Liquidity'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">LP Tokens</label>
            <input
              type="number"
              value={lpTokens}
              onChange={(e) => setLpTokens(e.target.value)}
              placeholder="0.0"
              className="w-full bg-dark-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
            />
          </div>
          <button
            onClick={handleRemoveLiquidity}
            disabled={!connected || loading || !lpTokens}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
          >
            {!connected ? 'Connect Wallet' : loading ? 'Removing...' : 'Remove Liquidity'}
          </button>
        </div>
      )}
    </div>
  );
};
```

### Step 3.10: Create App Component
Update `frontend/src/App.tsx`:

```tsx
import { FC } from 'react';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './components/WalletProvider';
import { Header } from './components/Header';
import { SwapCard } from './components/SwapCard';
import { LiquidityCard } from './components/LiquidityCard';

const App: FC = () => {
  // For MVP, you can hardcode a pool address or implement pool selection
  const poolPda = ''; // Set this after creating a pool

  return (
    <WalletProvider>
      <div className="min-h-screen bg-dark-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <SwapCard poolPda={poolPda} />
            <LiquidityCard poolPda={poolPda} />
          </div>
        </main>
        <Toaster position="bottom-right" />
      </div>
    </WalletProvider>
  );
};

export default App;
```

### Step 3.11: Update CSS
Update `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-dark-900 text-white;
}

.wallet-adapter-button {
  @apply bg-primary-600 hover:bg-primary-700 !important;
}
```

### Step 3.12: Build Frontend
```bash
cd frontend
yarn build
```

---

## Phase 4: Testing

### Step 4.1: Create Test Tokens (Devnet)
```bash
# Create two test tokens
spl-token create-token --decimals 9
# Note: Token A mint address

spl-token create-token --decimals 9
# Note: Token B mint address

# Create token accounts
spl-token create-account <TOKEN_A_MINT>
spl-token create-account <TOKEN_B_MINT>

# Mint some tokens for testing
spl-token mint <TOKEN_A_MINT> 1000000
spl-token mint <TOKEN_B_MINT> 1000000
```

### Step 4.2: Create Integration Tests
Create `anchor/tests/dex.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Dex } from "../target/types/dex";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { assert } from "chai";

describe("dex", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Dex as Program<Dex>;
  const payer = provider.wallet as anchor.Wallet;

  let tokenAMint: anchor.web3.PublicKey;
  let tokenBMint: anchor.web3.PublicKey;
  let userTokenA: anchor.web3.PublicKey;
  let userTokenB: anchor.web3.PublicKey;
  let poolPda: anchor.web3.PublicKey;

  const POOL_SEED = Buffer.from("pool");
  const VAULT_SEED = Buffer.from("vault");
  const LP_MINT_SEED = Buffer.from("lp_mint");

  before(async () => {
    // Create test tokens
    tokenAMint = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      9
    );

    tokenBMint = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      9
    );

    // Create user token accounts
    userTokenA = await createAccount(
      provider.connection,
      payer.payer,
      tokenAMint,
      payer.publicKey
    );

    userTokenB = await createAccount(
      provider.connection,
      payer.payer,
      tokenBMint,
      payer.publicKey
    );

    // Mint tokens
    await mintTo(
      provider.connection,
      payer.payer,
      tokenAMint,
      userTokenA,
      payer.publicKey,
      1_000_000_000_000 // 1000 tokens
    );

    await mintTo(
      provider.connection,
      payer.payer,
      tokenBMint,
      userTokenB,
      payer.publicKey,
      1_000_000_000_000 // 1000 tokens
    );

    // Derive pool PDA
    [poolPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [POOL_SEED, tokenAMint.toBuffer(), tokenBMint.toBuffer()],
      program.programId
    );
  });

  it("Initialize pool", async () => {
    const [tokenAVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [VAULT_SEED, poolPda.toBuffer(), tokenAMint.toBuffer()],
      program.programId
    );

    const [tokenBVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [VAULT_SEED, poolPda.toBuffer(), tokenBMint.toBuffer()],
      program.programId
    );

    const [lpMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [LP_MINT_SEED, poolPda.toBuffer()],
      program.programId
    );

    await program.methods
      .initializePool(30) // 0.3% fee
      .accounts({
        payer: payer.publicKey,
        pool: poolPda,
        tokenAMint,
        tokenBMint,
        tokenAVault,
        tokenBVault,
        lpMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const pool = await program.account.pool.fetch(poolPda);
    assert.equal(pool.feeRateBps, 30);
  });

  it("Add liquidity", async () => {
    // Implementation follows same pattern
    // Add liquidity test here
  });

  it("Swap tokens", async () => {
    // Swap test here
  });

  it("Remove liquidity", async () => {
    // Remove liquidity test here
  });
});
```

### Step 4.3: Run Tests
```bash
cd anchor
anchor test
```

---

## Phase 5: Deployment

### Step 5.1: Deploy Program to Mainnet
```bash
# Switch to mainnet
solana config set --url mainnet-beta

# Check balance (need ~2-3 SOL for deployment)
solana balance

# Update Anchor.toml for mainnet
# Change [programs.devnet] to [programs.mainnet]
# Change cluster = "devnet" to cluster = "mainnet"

# Deploy
anchor deploy --provider.cluster mainnet
```

### Step 5.2: Deploy Frontend
```bash
cd frontend

# Build for production
yarn build

# Deploy to Vercel (free)
npx vercel --prod

# Or deploy to Netlify
npx netlify deploy --prod --dir=dist
```

### Step 5.3: Update Environment for Production
Update `.env` with mainnet values:
- `SOLANA_NETWORK=mainnet-beta`
- `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`
- `VITE_SOLANA_NETWORK=mainnet-beta`
- `VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`
- Update `PROGRAM_ID` with mainnet program ID

---

## Phase 6: Post-Deployment

### Step 6.1: Create Initial Pool
Use the scripts to create the first liquidity pool.

### Step 6.2: Verify Functionality
- Test wallet connection (Phantom and Solflare)
- Test adding liquidity
- Test swapping tokens
- Test removing liquidity

### Step 6.3: Document for Client
Provide client with:
- Admin wallet setup instructions
- How to create new pools
- How to monitor pools
- Fee collection information

---

## Checklist Summary

### Phase 0: Environment Setup
- [ ] Install Rust
- [ ] Install Solana CLI
- [ ] Install Anchor
- [ ] Install Node.js and Yarn
- [ ] Configure Solana for Devnet

### Phase 1: Project Initialization
- [ ] Create project directory
- [ ] Create .env configuration file
- [ ] Initialize Anchor project
- [ ] Initialize React frontend

### Phase 2: Smart Contract
- [ ] Create constants.rs
- [ ] Create errors.rs
- [ ] Create state.rs
- [ ] Create initialize_pool instruction
- [ ] Create add_liquidity instruction
- [ ] Create remove_liquidity instruction
- [ ] Create swap instruction
- [ ] Build program
- [ ] Update program ID
- [ ] Deploy to Devnet

### Phase 3: Frontend
- [ ] Configure Tailwind
- [ ] Create env config
- [ ] Create WalletProvider
- [ ] Copy IDL from Anchor build
- [ ] Create useProgram hook
- [ ] Create usePool hook
- [ ] Create Header component
- [ ] Create SwapCard component
- [ ] Create LiquidityCard component
- [ ] Update App.tsx
- [ ] Build frontend

### Phase 4: Testing
- [ ] Create test tokens
- [ ] Write integration tests
- [ ] Run all tests
- [ ] Test frontend manually

### Phase 5: Deployment
- [ ] Deploy to Mainnet
- [ ] Deploy frontend
- [ ] Update production env

### Phase 6: Post-Deployment
- [ ] Create initial pool
- [ ] Verify all functionality
- [ ] Document for client
