use std::vec;

use anchor_lang::{
    prelude::*,
    solana_program::program::{invoke, invoke_signed},
};
use anchor_spl::token::{Mint, Token, TokenAccount};
use mpl_token_metadata::{
    instruction::{
        builders::{DelegateBuilder, LockBuilder},
        DelegateArgs, InstructionBuilder, LockArgs,
    },
    state::TokenStandard,
};

use crate::{
    constants::*,
    error::*,
    states::*,
    utils::{assert_decode_metadata, bump},
};

/// Add prize PNFT by creator
pub fn add_prize_pnft(ctx: Context<AddPrizePnftCtx>, idx: u32) -> Result<()> {
    let global_account = &ctx.accounts.global_account;
    let raffle_account = &mut ctx.accounts.raffle_account;
    let metadata_info = &ctx.accounts.metadata.to_account_info();

    require!(
        !raffle_account.is_deposited,
        RaffleError::PrizeAlreadyDeposited
    );

    // Check collection is whitelisted
    let metadata = assert_decode_metadata(&ctx.accounts.mint, metadata_info)?;
    require!(
        metadata.token_standard == Some(TokenStandard::ProgrammableNonFungible),
        RaffleError::InvalidTokenStandard
    );
    require!(
        metadata.collection.is_some(),
        RaffleError::InvalidCollection
    );

    let collection = metadata.collection.unwrap();
    require!(collection.verified, RaffleError::InvalidCollection);

    let collection_idx = global_account
        .wl_collections
        .iter()
        .position(|&_collection| _collection == collection.key);
    require!(collection_idx.is_some(), RaffleError::InvalidCollection);

    // Delegate transfer authority to escrow account
    let delegate_ix = DelegateBuilder::new()
        .authority(ctx.accounts.authority.key())
        .mint(ctx.accounts.mint.key())
        .metadata(ctx.accounts.metadata.key())
        .master_edition(ctx.accounts.edition.key())
        .token(ctx.accounts.token_account.key())
        .token_record(ctx.accounts.token_record.key())
        .delegate(ctx.accounts.escrow_account.key())
        .delegate_record(ctx.accounts.delegate_record.key())
        .system_program(ctx.accounts.system_program.key())
        .sysvar_instructions(ctx.accounts.sysvar_instructions.key())
        .spl_token_program(ctx.accounts.token_program.key())
        .authorization_rules(ctx.accounts.authorization_rules.key())
        .authorization_rules_program(ctx.accounts.authorization_rules_program.key())
        .payer(ctx.accounts.authority.key())
        .build(DelegateArgs::LockedTransferV1 {
            amount: 1,
            locked_address: ctx.accounts.escrow_account.key(),
            authorization_data: None,
        })
        .unwrap()
        .instruction();

    let delegate_accounts = [
        ctx.accounts.metadata_program.to_account_info(),
        ctx.accounts.escrow_account.to_account_info(),
        ctx.accounts.token_record.to_account_info(),
        ctx.accounts.delegate_record.to_account_info(),
        ctx.accounts.token_account.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.edition.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.authorization_rules_program.to_account_info(),
        ctx.accounts.authorization_rules.to_account_info(),
        ctx.accounts.sysvar_instructions.to_account_info(),
    ];

    invoke(&delegate_ix, &delegate_accounts)?;

    // Lock nft while delegate
    let raffle_account_key = raffle_account.key();
    let seeds = &[
        PREFIX,
        raffle_account_key.as_ref(),
        ESCROW,
        &[bump(
            &[PREFIX, raffle_account_key.as_ref(), ESCROW],
            ctx.program_id,
        )],
    ];

    let lock_ix = LockBuilder::new()
        .authority(ctx.accounts.escrow_account.key())
        .mint(ctx.accounts.mint.key())
        .metadata(ctx.accounts.metadata.key())
        .edition(ctx.accounts.edition.key())
        .token(ctx.accounts.token_account.key())
        .token_record(ctx.accounts.token_record.key())
        .system_program(ctx.accounts.system_program.key())
        .sysvar_instructions(ctx.accounts.sysvar_instructions.key())
        .spl_token_program(ctx.accounts.token_program.key())
        .authorization_rules(ctx.accounts.authorization_rules.key())
        .authorization_rules_program(ctx.accounts.authorization_rules_program.key())
        .payer(ctx.accounts.authority.key())
        .build(LockArgs::V1 {
            authorization_data: None,
        })
        .unwrap()
        .instruction();

    let lock_accounts = [
        ctx.accounts.metadata_program.to_account_info(),
        ctx.accounts.escrow_account.to_account_info(),
        ctx.accounts.token_record.to_account_info(),
        ctx.accounts.token_account.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.edition.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.authorization_rules_program.to_account_info(),
        ctx.accounts.authorization_rules.to_account_info(),
        ctx.accounts.sysvar_instructions.to_account_info(),
    ];

    invoke_signed(&lock_ix, &lock_accounts, &[seeds])?;

    // Update raffle account
    raffle_account.mint = ctx.accounts.mint.key();
    raffle_account.is_deposited = true;

    Ok(())
}

#[derive(Accounts)]
#[instruction(idx: u32)]
pub struct AddPrizePnftCtx<'info> {
    #[account(mut)]
    authority: Signer<'info>,

    #[account(
        seeds=[PREFIX], 
        bump,
    )]
    global_account: Box<Account<'info, GlobalAccount>>,

    #[account(
        mut, 
        seeds=[PREFIX, RAFFLE, &idx.to_be_bytes()], 
        bump,
        has_one = authority,
    )]
    raffle_account: Box<Account<'info, RaffleAccount>>,

    mint: Box<Account<'info, Mint>>,

    /// CHECK: validate whitelist collection
    #[account(mut)]
    metadata: UncheckedAccount<'info>,

    /// CHECK: validate nft edition account
    edition: UncheckedAccount<'info>,

    /// CHECK: validate token record account
    #[account(mut)]
    token_record: UncheckedAccount<'info>,

    /// CHECK: validate token record account
    #[account(mut)]
    delegate_record: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = token_account.mint == mint.key()
        && token_account.owner == authority.key()
        && token_account.amount == 1
        @ RaffleError::InvalidTokenAccount
    )]
    token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: token account for escrow
    #[account(
        mut,
        seeds = [PREFIX, raffle_account.key().as_ref(), ESCROW],
        bump
    )]
    pub escrow_account: UncheckedAccount<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    authorization_rules: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    sysvar_instructions: UncheckedAccount<'info>,

    token_program: Program<'info, Token>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(address = mpl_token_metadata::id())]
    metadata_program: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    authorization_rules_program: UncheckedAccount<'info>,
    system_program: Program<'info, System>,
}
