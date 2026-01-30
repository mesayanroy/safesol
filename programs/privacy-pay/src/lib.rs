use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("HPnAch9XaLsvKdtHtqEq4o5SAoDThCHd4zt9NCbmPKBw");

#[program]
pub mod privacy_pay {
    use super::*;

    /// Initialize state PDA with genesis Merkle root
    pub fn initialize(ctx: Context<Initialize>, initial_root: [u8; 32]) -> Result<()> {
        instructions::initialize(ctx, initial_root)
    }

    /// Execute private payment with ZK proof
    ///
    /// Verifies:
    /// - ZK proof is valid (via CPI to verifier)
    /// - Nullifier hasn't been used (no double-spend)
    /// - Updates Merkle root with new commitment
    pub fn private_spend(
        ctx: Context<PrivateSpend>,
        merkle_root: [u8; 32],
        amount: u64,
        proof: Vec<u8>,
        nullifier_seed: [u8; 32],
        public_signals: Vec<[u8; 32]>,
    ) -> Result<()> {
        instructions::private_spend(
            ctx,
            merkle_root,
            amount,
            proof,
            nullifier_seed,
            public_signals,
        )
    }

    /// Add commitment to state tree (for deposits)
    pub fn add_commitment(ctx: Context<AddCommitment>, commitment: [u8; 32]) -> Result<()> {
        instructions::add_commitment(ctx, commitment)
    }
}
