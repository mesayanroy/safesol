use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct AddCommitment<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump
    )]
    pub state: Account<'info, State>,
}

pub fn add_commitment(
    ctx: Context<AddCommitment>,
    commitment: [u8; 32],
) -> Result<()> {
    let state = &mut ctx.accounts.state;

    // In production: Update Merkle tree via Light Protocol
    // For hackathon: Just log the commitment
    msg!("Commitment added: {:?}", commitment);
    
    state.total_commitments += 1;
    state.next_index += 1;

    // Mock root update (in production, compute new Merkle root)
    // state.merkle_root = new_root;

    Ok(())
}
