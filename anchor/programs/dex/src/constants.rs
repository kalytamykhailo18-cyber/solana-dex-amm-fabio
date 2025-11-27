// Seed prefixes for PDAs
pub const POOL_SEED: &[u8] = b"pool";
pub const LP_MINT_SEED: &[u8] = b"lp_mint";
pub const VAULT_SEED: &[u8] = b"vault";

// Fee constants
pub const FEE_DENOMINATOR: u64 = 10000; // Basis points denominator
pub const MAX_FEE_BPS: u16 = 1000;      // Max 10% fee
pub const MIN_LIQUIDITY: u64 = 1000;    // Minimum initial liquidity
