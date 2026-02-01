use anchor_lang::prelude::*;
use light_sdk::account::LightAccount;

/// Compressed merkle root account (8 bytes on-chain vs 32 bytes standard)
/// Uses Light Protocol's compressed account model
#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct MerkleRootCompressed {
    /// The merkle root hash (32 bytes)
    pub root: [u8; 32],

    /// Timestamp of creation
    pub created_at: i64,

    /// Owner/signer
    pub owner: Pubkey,
}

/// Compressed nullifier account for double-spend prevention
/// Tracks used nullifiers with minimal storage
#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct NullifierCompressed {
    /// Hashed nullifier (32 bytes)
    pub nullifier_hash: [u8; 32],

    /// Block height when used
    pub used_at: u64,

    /// Transaction signature
    pub tx_signature: [u8; 64],
}

/// Compressed commitment account
/// Stores amount-revealing commitments in compressed form
#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct CommitmentCompressed {
    /// Poseidon(secret, amount)
    pub commitment: [u8; 32],

    /// Encrypted amount (compressed representation)
    pub encrypted_amount: [u8; 16],

    /// Block height when committed
    pub committed_at: u64,

    /// Account owner
    pub owner: Pubkey,
}

impl Default for MerkleRootCompressed {
    fn default() -> Self {
        Self {
            root: [0u8; 32],
            created_at: 0,
            owner: Pubkey::default(),
        }
    }
}

impl Default for NullifierCompressed {
    fn default() -> Self {
        Self {
            nullifier_hash: [0u8; 32],
            used_at: 0,
            tx_signature: [0u8; 64],
        }
    }
}

impl Default for CommitmentCompressed {
    fn default() -> Self {
        Self {
            commitment: [0u8; 32],
            encrypted_amount: [0u8; 16],
            committed_at: 0,
            owner: Pubkey::default(),
        }
    }
}

// Implement LightAccount marker traits
impl light_sdk::account::LightAccountData for MerkleRootCompressed {}
impl light_sdk::account::LightAccountData for NullifierCompressed {}
impl light_sdk::account::LightAccountData for CommitmentCompressed {}
