# Solana DEX AMM - Program Logic Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Account Structure](#account-structure)
4. [Instructions](#instructions)
5. [AMM Formula](#amm-formula)
6. [Security Considerations](#security-considerations)
7. [Gas Optimization](#gas-optimization)

---

## Overview

This is a **Constant Product Automated Market Maker (AMM)** DEX built on Solana using the Anchor framework. It implements the same core algorithm as Uniswap V2 (`x * y = k`), but adapted for Solana's account-based model.

**Key Features:**
- Constant product AMM (x * y = k)
- Configurable fee rates (0-10%, default 0.3%)
- Two-step pool initialization (to avoid stack overflow)
- LP tokens to represent liquidity shares
- Slippage protection on all operations

**Program ID:** `EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T`

---

## Architecture

### Solana vs EVM Comparison

| Concept | EVM (Uniswap V2) | Solana (This DEX) |
|---------|------------------|-------------------|
| State Storage | Contract variables | Separate accounts |
| Pool | Smart contract | Pool account (PDA) |
| Reserves | Contract balance | Token vaults (PDAs) |
| LP Token | Contract IS the token | Separate mint account |
| Authority | Contract owner | PDA with bump seed |

### Account Model

```
Pool (PDA)
├── Contains pool configuration
├── Controls 2 vaults (PDAs)
└── Controls LP mint (PDA)

Vault A (PDA) ──> Holds Token A reserves
Vault B (PDA) ──> Holds Token B reserves
LP Mint (PDA) ──> Mints/burns LP tokens
```

---

## Account Structure

### Pool Account (180 bytes)

```rust
pub struct Pool {
    pub token_a_mint: Pubkey,      // 32 bytes - Token A mint address
    pub token_b_mint: Pubkey,      // 32 bytes - Token B mint address
    pub token_a_vault: Pubkey,     // 32 bytes - Vault A address
    pub token_b_vault: Pubkey,     // 32 bytes - Vault B address
    pub lp_mint: Pubkey,           // 32 bytes - LP token mint
    pub fee_rate_bps: u16,         // 2 bytes  - Fee in basis points
    pub bump: u8,                  // 1 byte   - Pool PDA bump
    pub lp_mint_bump: u8,          // 1 byte   - LP mint PDA bump
    pub total_lp_supply: u64,      // 8 bytes  - Total LP tokens
}
```

**PDA Derivation:**
```
Pool:    seeds = [b"pool", token_a_mint, token_b_mint]
Vault A: seeds = [b"vault", pool, token_a_mint]
Vault B: seeds = [b"vault", pool, token_b_mint]
LP Mint: seeds = [b"lp_mint", pool]
```

**Cost:** ~0.00124 SOL (~$0.22 @ $180/SOL) vs Uniswap V2 ~$50-200

---

## Instructions

### 1. Initialize Pool (Step 1)

**Purpose:** Create pool account and Token A vault

**Accounts:**
- `payer` (signer, mut) - Pays for account creation
- `pool` (init, mut) - Pool account being created
- `token_a_mint` - Token A mint (validated manually)
- `token_b_mint` - Token B mint (validated manually)
- `token_a_vault` (init, mut) - Vault for Token A
- `token_program` - SPL Token program
- `system_program` - System program

**Arguments:**
- `fee_rate_bps: u16` - Fee rate (0-1000 = 0-10%)

**Logic:**
1. Validate fee rate ≤ 1000 bps (10%)
2. Validate token mints are owned by SPL Token program
3. Create pool account (PDA)
4. Create Token A vault (PDA)
5. Store pool configuration:
   - Token mints
   - Vault A address
   - Fee rate
   - Pool bump seed
6. Set Vault B and LP mint to default (will be set in step 2)

**Cost:** ~0.005 SOL

**Why Two Steps?**
Solana has a 4096-byte stack limit per instruction. Initializing 4 accounts (pool + 2 vaults + LP mint) generated 6104 bytes of stack code, causing stack overflow. By splitting into 2 steps (2 inits each), we stay under the limit.

---

### 2. Initialize LP Mint (Step 2)

**Purpose:** Create Token B vault and LP mint

**Accounts:**
- `payer` (signer, mut)
- `pool` (mut) - Existing pool account
- `token_b_mint` - Token B mint
- `token_b_vault` (init, mut) - Vault for Token B
- `lp_mint` (init, mut) - LP token mint
- `token_program`
- `system_program`

**Arguments:** None

**Logic:**
1. Create Token B vault (PDA)
2. Create LP mint with 9 decimals (PDA)
3. Set pool's mint authority to pool PDA
4. Update pool state:
   - Vault B address
   - LP mint address
   - LP mint bump seed

**Cost:** ~0.002 SOL

**Total Pool Creation Cost:** ~0.007 SOL (both steps combined)

---

### 3. Add Liquidity

**Purpose:** Deposit tokens and receive LP tokens

**Accounts:**
- `user` (signer, mut)
- `pool` (mut)
- `user_token_a` (mut) - User's Token A account
- `user_token_b` (mut) - User's Token B account
- `token_a_vault` (mut) - Pool's Token A vault
- `token_b_vault` (mut) - Pool's Token B vault
- `lp_mint` (mut) - LP token mint
- `user_lp_token` (mut) - User's LP token account
- `token_program`

**Arguments:**
- `amount_a: u64` - Token A amount to deposit
- `amount_b: u64` - Token B amount to deposit
- `min_lp_tokens: u64` - Minimum LP tokens (slippage protection)

**Logic:**

**First Deposit (pool empty):**
```rust
lp_tokens = sqrt(amount_a × amount_b)
require(lp_tokens >= MIN_LIQUIDITY)  // Prevent dust attacks
```

**Subsequent Deposits:**
```rust
lp_from_a = (amount_a × total_lp) / reserve_a
lp_from_b = (amount_b × total_lp) / reserve_b
lp_tokens = min(lp_from_a, lp_from_b)  // Maintain pool ratio
```

**Steps:**
1. Validate amounts > 0
2. Get current reserves from vaults
3. Calculate LP tokens to mint
4. Check slippage: `lp_tokens >= min_lp_tokens`
5. Transfer Token A from user to vault
6. Transfer Token B from user to vault
7. Mint LP tokens to user (pool PDA signs)
8. Update `total_lp_supply`

**Example:**
```
Pool has: 1000 Token A, 2000 Token B, 1000 LP tokens
User deposits: 100 Token A, 200 Token B

lp_from_a = (100 × 1000) / 1000 = 100
lp_from_b = (200 × 1000) / 2000 = 100
lp_tokens = min(100, 100) = 100 LP tokens minted
```

---

### 4. Remove Liquidity

**Purpose:** Burn LP tokens and withdraw underlying tokens

**Accounts:**
- `user` (signer, mut)
- `pool` (mut)
- `user_token_a` (mut)
- `user_token_b` (mut)
- `token_a_vault` (mut)
- `token_b_vault` (mut)
- `lp_mint` (mut)
- `user_lp_token` (mut)
- `token_program`

**Arguments:**
- `lp_tokens: u64` - LP tokens to burn
- `min_amount_a: u64` - Minimum Token A (slippage)
- `min_amount_b: u64` - Minimum Token B (slippage)

**Formula:**
```rust
share = lp_tokens / total_lp_supply
amount_a = reserve_a × share
amount_b = reserve_b × share
```

**Steps:**
1. Validate lp_tokens > 0
2. Calculate proportional amounts
3. Check slippage protection
4. Burn LP tokens from user
5. Transfer Token A from vault to user (pool PDA signs)
6. Transfer Token B from vault to user (pool PDA signs)
7. Update `total_lp_supply`

**Example:**
```
Pool has: 1000 Token A, 2000 Token B, 1000 LP tokens
User burns: 100 LP tokens

share = 100 / 1000 = 0.1 (10%)
amount_a = 1000 × 0.1 = 100 Token A
amount_b = 2000 × 0.1 = 200 Token B
```

---

### 5. Swap

**Purpose:** Exchange one token for another using AMM

**Accounts:**
- `user` (signer, mut)
- `pool` (mut)
- `user_token_in` (mut)
- `user_token_out` (mut)
- `vault_in` (mut)
- `vault_out` (mut)
- `token_program`

**Arguments:**
- `amount_in: u64` - Input token amount
- `min_amount_out: u64` - Minimum output (slippage)

**Constant Product Formula:**
```
x × y = k  (constant product)

where:
x = reserve_in
y = reserve_out
k = constant product (must remain constant after fees)
```

**With Fees:**
```rust
fee_factor = 10000 - fee_bps  // e.g., 10000 - 30 = 9970 for 0.3%
amount_in_with_fee = amount_in × fee_factor

numerator = amount_in_with_fee × reserve_out
denominator = (reserve_in × 10000) + amount_in_with_fee

amount_out = numerator / denominator
```

**Steps:**
1. Validate amount_in > 0
2. Get reserves from vaults
3. Validate pool has liquidity
4. Calculate output using formula
5. Check slippage: `amount_out >= min_amount_out`
6. Transfer input tokens from user to vault
7. Transfer output tokens from vault to user (pool PDA signs)

**Example (0.3% fee):**
```
Pool: 1000 Token A, 2000 Token B
Swap: 100 Token A → ? Token B

fee_factor = 10000 - 30 = 9970
amount_in_with_fee = 100 × 9970 = 997000

numerator = 997000 × 2000 = 1994000000
denominator = (1000 × 10000) + 997000 = 10997000

amount_out = 1994000000 / 10997000 ≈ 181.34 Token B

Final reserves: 1100 Token A, 1818.66 Token B
Product: 1100 × 1818.66 ≈ 2000526 (slightly higher due to fee)
```

**Fee Distribution:**
The 0.3% fee stays in the pool, automatically benefiting all LP holders proportionally.

---

## AMM Formula

### Constant Product

The core invariant is:
```
reserve_in × reserve_out = k
```

After a swap:
```
(reserve_in + amount_in_after_fee) × (reserve_out - amount_out) ≈ k
```

The product slightly increases due to fees, which benefits liquidity providers.

### Price Impact

```rust
price_impact = (amount_out / reserve_out) × 100
```

Larger trades relative to pool size = higher price impact.

### Slippage

**Definition:** Difference between expected and actual execution price.

**Protection Mechanisms:**
- `min_lp_tokens` (add liquidity)
- `min_amount_a`, `min_amount_b` (remove liquidity)
- `min_amount_out` (swap)

---

## Security Considerations

### 1. Reentrancy Protection

**Not needed on Solana** - Solana's runtime prevents reentrancy by design. An account can only be borrowed once per instruction.

### 2. Integer Overflow

All arithmetic uses checked operations:
```rust
.checked_mul()
.checked_div()
.checked_add()
.checked_sub()
.ok_or(DexError::MathOverflow)?
```

### 3. PDA Authority

Pool controls all vaults and LP mint using PDA signing:
```rust
let seeds = &[
    POOL_SEED,
    token_a_mint.as_ref(),
    token_b_mint.as_ref(),
    &[bump],
];
let signer_seeds = &[&seeds[..]];

// Use signer_seeds in CPI calls
```

### 4. Account Validation

**Manual validation** for token mints (using `AccountInfo` to reduce stack usage):
```rust
require!(
    token_mint.owner == &spl_token::ID,
    DexError::InvalidTokenMint
);
```

**Anchor validation** for other accounts:
- PDA seeds verification
- Owner checks
- Signer checks

### 5. Dust Attack Prevention

First liquidity deposit requires:
```rust
const MIN_LIQUIDITY: u64 = 1000;
require!(initial_lp >= MIN_LIQUIDITY, InsufficientLiquidity);
```

### 6. Zero Amount Protection

All operations validate:
```rust
require!(amount > 0, DexError::ZeroAmount);
```

---

## Gas Optimization

### 1. Two-Step Initialization

**Problem:** Initializing 4 accounts exceeded 4096-byte stack limit.

**Solution:** Split into 2 instructions:
- Step 1: Pool + Vault A (2 inits)
- Step 2: Vault B + LP Mint (2 inits)

**Stack Usage:**
- Before: 6104 bytes ❌
- After: ~3800 bytes each ✅

### 2. AccountInfo for Mints

Using `AccountInfo` instead of `Account<Mint>`:
```rust
// Instead of:
pub token_a_mint: Account<'info, Mint>,

// Use:
/// CHECK: Validated manually
pub token_a_mint: AccountInfo<'info>,
```

**Savings:** ~256 bytes per mint × 2 = ~512 bytes

### 3. Removed Rent Sysvar

Modern Anchor doesn't need the Rent sysvar for `init` constraints:
```rust
// Removed:
pub rent: Sysvar<'info, Rent>,
```

**Savings:** ~100 bytes

### 4. Efficient Math

Using u128 for intermediate calculations to prevent overflow, then converting back to u64:
```rust
let result = (amount_a as u128)
    .checked_mul(amount_b as u128)
    .ok_or(MathOverflow)?
    as u64;
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | InvalidFeeRate | Fee must be ≤ 1000 bps (10%) |
| 6001 | InvalidTokenMint | Invalid token mint account |
| 6002 | InvalidPoolState | Pool state validation failed |
| 6003 | ZeroAmount | Amount must be > 0 |
| 6004 | InsufficientLiquidity | Not enough liquidity in pool |
| 6005 | SlippageExceeded | Output below minimum |
| 6006 | MathOverflow | Arithmetic overflow |

---

## Constants

```rust
// Seed prefixes
POOL_SEED = b"pool"
VAULT_SEED = b"vault"
LP_MINT_SEED = b"lp_mint"

// Constraints
MAX_FEE_BPS: u16 = 1000        // 10%
FEE_DENOMINATOR: u64 = 10000   // Basis points
MIN_LIQUIDITY: u64 = 1000      // Minimum first deposit

// Decimals
LP_DECIMALS: u8 = 9
```

---

## Testing Checklist

- [ ] Pool creation (both steps)
- [ ] First liquidity deposit
- [ ] Subsequent liquidity deposits
- [ ] Remove partial liquidity
- [ ] Remove all liquidity
- [ ] Swap A → B
- [ ] Swap B → A
- [ ] Slippage protection (all ops)
- [ ] Fee calculation accuracy
- [ ] Zero amount rejection
- [ ] Invalid mint rejection
- [ ] Overflow handling
- [ ] PDA signing works correctly

---

## Deployment

**Network:** Devnet
**Program ID:** `EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T`

**Build:**
```bash
anchor build
```

**Deploy:**
```bash
solana program deploy target/deploy/dex.so
```

**Verify:**
```bash
solana program show EZDyb8s4DgMksN6aPx7gbeZ8B7SjWms3YuXu3VgUT11T
```

---

## Future Enhancements

1. **Multi-hop swaps** - Route through multiple pools
2. **Concentrated liquidity** - Uniswap V3 style
3. **Flash loans** - Borrow without collateral within single transaction
4. **Governance** - DAO for fee changes
5. **Farming rewards** - Incentivize liquidity providers
6. **Jupiter integration** - Route finding and aggregation
7. **Oracle integration** - TWAP (Time-Weighted Average Price)

---

## References

- [Uniswap V2 Whitepaper](https://uniswap.org/whitepaper.pdf)
- [Anchor Book](https://book.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [SPL Token Program](https://spl.solana.com/token)

---

*Generated: December 2024*
*Version: 0.1.0*
