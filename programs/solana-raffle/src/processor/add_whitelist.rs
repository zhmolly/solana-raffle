use anchor_lang::prelude::*;

use crate::{constants::*, error::RaffleError, states::*};

/// Add collection to whitelist
pub fn add_whitelist(ctx: Context<AddWhitelistCtx>, collection: Pubkey) -> Result<()> {
    let global_account = &mut ctx.accounts.global_account;

    if let Some(_) = global_account
        .wl_collections
        .iter()
        .position(|&_collection| _collection == collection)
    {
        return err!(RaffleError::InvalidCollection);
    }

    if let Some(idx) = global_account
        .wl_collections
        .iter_mut()
        .position(|&mut _collection| _collection == Pubkey::default())
    {
        global_account.wl_collections[idx] = collection;
    } else {
        return err!(RaffleError::WhitelistFull);
    }

    Ok(())
}

#[derive(Accounts)]
pub struct AddWhitelistCtx<'info> {
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
