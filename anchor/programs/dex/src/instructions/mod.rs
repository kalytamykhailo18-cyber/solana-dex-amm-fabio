//! Instructions module
//! Exports all instruction handlers for the DEX program

// Instruction modules
pub mod initialize_pool;   // Create new liquidity pool
pub mod add_liquidity;     // Deposit tokens, receive LP tokens
pub mod remove_liquidity;  // Burn LP tokens, withdraw tokens
pub mod swap;              // Exchange tokens using AMM

// Re-export all instruction structs and handlers
pub use initialize_pool::*;
pub use add_liquidity::*;
pub use remove_liquidity::*;
pub use swap::*;
