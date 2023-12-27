use std::vec;

use anchor_lang::{
    prelude::*,
    solana_program::program::{invoke, invoke_signed},
};
use anchor_spl::token::{self, Approve, Mint, Token, TokenAccount, Transfer};
use mpl_token_metadata::instruction::{freeze_delegated_account, thaw_delegated_account};

use crate::{
    constants::*,
    error::*,
    states::*,
    utils::{assert_decode_metadata, bump},
};

/// Claim prize NFT by winner
pub fn claim_prize(ctx: Context<ClaimPrizeCtx>, idx: u32, uid: [u8; ID_LENGTH]) -> Result<()> {
    let raffle_account = &mut ctx.accounts.raffle_account;
    require!(
        raffle_account.winner_idx > 0,
        RaffleError::WinnerNotRevealed
    );
    require!(!raffle_account.is_claimed, RaffleError::PrizeAlreadyClaimed);

    // Get winner
    let winner_idx = raffle_account
        .winner_idx
        .checked_sub(1)
        .ok_or(RaffleError::NumericOverflow)?;

    let winner_uid = raffle_account.tickets[winner_idx as usize].uid;
    require!(winner_uid == uid, RaffleError::WinnerNotMatched);

    // Thaw token account
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
        &thaw_delegated_account(
            mpl_token_metadata::id(),
            ctx.accounts.escrow_account.key(),
            ctx.accounts.creator_token_account.key(),
            *ctx.accounts.edition.key,
            ctx.accounts.mint.key(),
        ),
        &[
            ctx.accounts.escrow_account.to_account_info(),
            ctx.accounts.creator_token_account.to_account_info(),
            ctx.accounts.edition.to_account_info(),
            ctx.accounts.mint.to_account_info(),
        ],
        &[seeds],
    )?;

    // Transfer nft to winner
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.creator_token_account.to_account_info(),
                to: ctx.accounts.winner_token_account.to_account_info(),
                authority: ctx.accounts.escrow_account.to_account_info(),
            },
            &[seeds],
        ),
        1,
    )?;

    // Update status
    raffle_account.is_claimed = true;

    Ok(())
}

#[derive(Accounts)]
#[instruction(idx: u32, uid: [u8; ID_LENGTH])]
pub struct ClaimPrizeCtx<'info> {
    #[account(mut)]
    authority: Signer<'info>,

    #[account(
        mut, 
        seeds=[PREFIX, RAFFLE, &idx.to_be_bytes()], 
        has_one = mint,
        bump,
    )]
    raffle_account: Box<Account<'info, RaffleAccount>>,

    #[account(
        mut,
        seeds=[USER, raffle_account.key().as_ref(), uid.as_ref()], 
        has_one = authority,
        bump,
    )]
    user_account: Box<Account<'info, UserAccount>>,

    mint: Box<Account<'info, Mint>>,

    /// CHECK: validate whitelist collection
    metadata: UncheckedAccount<'info>,

    /// CHECK: validate nft edition account
    edition: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = creator_token_account.mint == mint.key()
        && creator_token_account.owner == raffle_account.authority
        @ RaffleError::InvalidTokenAccount
    )]
    creator_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = winner_token_account.mint == mint.key()
        && winner_token_account.owner == authority.key()
        @ RaffleError::InvalidTokenAccount
    )]
    winner_token_account: Box<Account<'info, TokenAccount>>,

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
