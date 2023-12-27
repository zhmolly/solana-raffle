use anchor_lang::prelude::*;

use crate::{constants::*, states::*};

/// Initialize global state
pub fn initialize(ctx: Context<InitializeCtx>) -> Result<()> {
    let global_account = &mut ctx.accounts.global_account;

    global_account.authority = ctx.accounts.authority.key();
    global_account.vault = ctx.accounts.vault.key();
    global_account.total_raffles = 0;
    global_account.wl_collections = [Pubkey::default(); MAX_COLLECTIONS];

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeCtx<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: vault account for receive payment fee
    pub vault: UncheckedAccount<'info>,

    #[account(
        init, 
        seeds=[PREFIX], 
        bump, 
        space=8+std::mem::size_of::<GlobalAccount>(),
        payer=authority,
    )]
    pub global_account: Box<Account<'info, GlobalAccount>>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
