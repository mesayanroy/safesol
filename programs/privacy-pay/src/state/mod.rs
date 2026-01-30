use anchor_lang::prelude::*;

pub mod transaction_limits;
pub use transaction_limits::*;

/// Main state account holding Merkle root
#[account]
pub struct State {
    pub authority: Pubkey,
    pub merkle_root: [u8; 32],
    pub next_index: u64,
    pub total_commitments: u64,
    pub bump: u8,
}

impl State {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1;
}

/// Nullifier PDA - prevents double spending
#[account]
pub struct Nullifier {
    pub hash: [u8; 32],
    pub used_at: i64,
    pub bump: u8,
}

impl Nullifier {
    pub const LEN: usize = 8 + 32 + 8 + 1;
}
