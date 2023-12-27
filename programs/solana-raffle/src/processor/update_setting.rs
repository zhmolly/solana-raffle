use anchor_lang::prelude::*;

use crate::{constants::*, states::*};

/// Update global setting
pub fn update_setting(ctx: Context<UpdateSettingCtx>) -> Result<()> {
    let global_account = &mut ctx.accounts.global_account;

    global_account.authority = ctx.accounts.new_authority.key();
    global_account.vault = ctx.accounts.vault.key();

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateSettingCtx<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: new authority key
    pub new_authority: UncheckedAccount<'info>,

    /// CHECK: vault account address
    pub vault: UncheckedAccount<'info>,

    #[account(
        mut, 
        seeds=[PREFIX], 
        bump, 
        has_one = authority
    )]
    pub global_account: Box<Account<'info, GlobalAccount>>,

    pub system_program: Program<'info, System>,
}
