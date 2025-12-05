//! Program Constants

/// PDA (Program Derived Address) seed prefixes
/// Used to derive deterministic addresses owned by the program
/// No EVM equivalent (similar to CREATE2 but no private key possible)
pub const POOL_SEED: &[u8] = b"pool";          // Derives pool account address
pub const LP_MINT_SEED: &[u8] = b"lp_mint";    // Derives LP token mint address
pub const VAULT_SEED: &[u8] = b"vault";        // Derives vault account addresses

/// Fee calculation denominator (basis points)
/// 10000 bps = 100%, so 30 bps = 0.3%
/// EVM: Often use 10000 or 1000000 as denominator
pub const FEE_DENOMINATOR: u64 = 10000;

/// Maximum fee rate allowed (10%)
/// Pools with fee > 1000 bps will be rejected
/// Prevents exploitative fees
pub const MAX_FEE_BPS: u16 = 1000;

/// Minimum initial liquidity (prevents dust attacks)
/// First LP deposit must mint at least this many LP tokens
/// Like: Uniswap V2's MINIMUM_LIQUIDITY (1000 wei)
pub const MIN_LIQUIDITY: u64 = 1000;
