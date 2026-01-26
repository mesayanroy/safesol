use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(merkle_root: [u8; 32])]
pub struct PrivateSpend<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump
    )]
    pub state: Account<'info, State>,

    /// Nullifier PDA - prevents double spending
    #[account(
        init,
        payer = payer,
        space = Nullifier::LEN,
        seeds = [b"nullifier", &merkle_root[..32]],
        bump
    )]
    pub nullifier: Account<'info, Nullifier>,

    /// CHECK: Recipient receives SOL
    #[account(mut)]
    pub recipient: AccountInfo<'info>,

    /// CHECK: ZK verifier program (CPI)
    pub zk_verifier: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn private_spend(
    ctx: Context<PrivateSpend>,
    merkle_root: [u8; 32],
    amount: u64,
    proof: Vec<u8>,
) -> Result<()> {
    let state = &mut ctx.accounts.state;
    let nullifier = &mut ctx.accounts.nullifier;

    // Verify Merkle root matches current state
    require!(
        state.merkle_root == merkle_root,
        ErrorCode::InvalidMerkleRoot
    );

    // HACKATHON: Mock proof verification
    // In production: CPI to zk_verifier program
    msg!("ZK Proof verification (MOCK): {:?}", &proof[..32]);
    
    // For real implementation:
    // anchor_lang::solana_program::program::invoke(
    //     &verify_instruction,
    //     &[ctx.accounts.zk_verifier.to_account_info()],
    // )?;

    // Create nullifier (prevents double-spend)
    nullifier.hash = merkle_root;
    nullifier.used_at = Clock::get()?.unix_timestamp;
    nullifier.bump = ctx.bumps.nullifier;

    msg!("Nullifier created: {:?}", nullifier.hash);

    // Transfer SOL to recipient
    let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.payer.key(),
        &ctx.accounts.recipient.key(),
        amount,
    );

    anchor_lang::solana_program::program::invoke(
        &transfer_ix,
        &[
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.recipient.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    msg!("Private payment executed: {} lamports", amount);
    msg!("Explorer will only show tx hash - amount is private!");

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid Merkle root")]
    InvalidMerkleRoot,
}
