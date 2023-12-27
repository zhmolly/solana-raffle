use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::token::{self, Approve, Mint, Token, TokenAccount};
use mpl_token_metadata::instruction::freeze_delegated_account;

use crate::{
    constants::*,
    error::*,
    states::*,
    utils::{assert_decode_metadata, bump},
};

/// Add prize NFT by creator
pub fn add_prize(ctx: Context<AddPrizeCtx>, idx: u32) -> Result<()> {
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

    // Delegate owner authority to escrow account
    token::approve(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Approve {
                to: ctx.accounts.token_account.to_account_info(),
                delegate: ctx.accounts.escrow_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        1,
    )?;

    // Freeze nft token account to escrow account
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

    invoke_signed(
        &freeze_delegated_account(
            mpl_token_metadata::id(),
            ctx.accounts.escrow_account.key(),
            ctx.accounts.token_account.key(),
            *ctx.accounts.edition.key,
            ctx.accounts.mint.key(),
        ),
        &[
            ctx.accounts.escrow_account.to_account_info(),
            ctx.accounts.token_account.to_account_info(),
            ctx.accounts.edition.to_account_info(),
            ctx.accounts.mint.to_account_info(),
        ],
        &[seeds],
    )?;

    // Update raffle account
    raffle_account.mint = ctx.accounts.mint.key();
    raffle_account.is_deposited = true;

    Ok(())
}

#[derive(Accounts)]
#[instruction(idx: u32)]
pub struct AddPrizeCtx<'info> {
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
    metadata: UncheckedAccount<'info>,

    /// CHECK: validate nft edition account
    edition: UncheckedAccount<'info>,

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

    /// CHECK: No need to deserialize.
    #[account(address = mpl_token_metadata::id())]
    metadata_program: UncheckedAccount<'info>,

    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
}
