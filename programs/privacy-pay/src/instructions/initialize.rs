use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = State::LEN,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, State>,

    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, initial_root: [u8; 32]) -> Result<()> {
    let state = &mut ctx.accounts.state;
    
    state.authority = ctx.accounts.payer.key();
    state.merkle_root = initial_root;
    state.next_index = 0;
    state.total_commitments = 0;
    state.bump = ctx.bumps.state;

    msg!("State initialized with root: {:?}", initial_root);
    
    Ok(())
}
