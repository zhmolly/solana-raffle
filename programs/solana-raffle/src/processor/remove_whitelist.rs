use anchor_lang::prelude::*;

use crate::{constants::*, error::RaffleError, states::*};

/// Remove collection from whitelist
pub fn remove_whitelist(ctx: Context<RemoveWhitelistCtx>, collection: Pubkey) -> Result<()> {
    let global_account = &mut ctx.accounts.global_account;

    if let Some(idx) = global_account
        .wl_collections
        .iter_mut()
        .position(|&mut _collection| _collection == collection)
    {
        global_account.wl_collections[idx] = Pubkey::default();
    } else {
        return err!(RaffleError::InvalidCollection);
    }

    Ok(())
}

#[derive(Accounts)]
pub struct RemoveWhitelistCtx<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut, 
        seeds=[PREFIX], 
        bump, 
        has_one = authority
    )]
    pub global_account: Box<Account<'info, GlobalAccount>>,

    pub system_program: Program<'info, System>,
}
