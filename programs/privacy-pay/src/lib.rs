use anchor_lang::prelude::*;
use light_sdk::{derive_light_cpi_signer, CpiSigner};

pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("HPnAch9XaLsvKdtHtqEq4o5SAoDThCHd4zt9NCbmPKBw");

// Light Protocol CPI Signer for compressed account operations
pub const LIGHT_CPI_SIGNER: CpiSigner =
    derive_light_cpi_signer!("HPnAch9XaLsvKdtHtqEq4o5SAoDThCHd4zt9NCbmPKBw");

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

    // ========== Light Protocol Compressed PDA Instructions ==========

    /// Create a compressed Merkle root account (75% storage savings)
    /// Uses Light Protocol's state compression
    pub fn create_compressed_merkle_root<'info>(
        ctx: Context<'_, '_, '_, 'info, CompressedMerkleRootAccounts<'info>>,
        proof: light_sdk::instruction::ValidityProof,
        address_tree_info: light_sdk::instruction::PackedAddressTreeInfo,
        merkle_root: [u8; 32],
    ) -> Result<()> {
        msg!("📦 Creating compressed merkle root via Light Protocol");
        create_compressed_merkle_root(ctx, proof, address_tree_info, merkle_root)
    }

    /// Update compressed Merkle root with new commitment
    pub fn update_compressed_merkle_root<'info>(
        ctx: Context<'_, '_, '_, 'info, CompressedMerkleRootAccounts<'info>>,
        proof: light_sdk::instruction::ValidityProof,
        new_root: [u8; 32],
        account_meta: light_sdk::instruction::account_meta::CompressedAccountMeta,
    ) -> Result<()> {
        msg!("🔄 Updating compressed merkle root");
        update_compressed_merkle_root(ctx, proof, new_root, account_meta)
    }
}
