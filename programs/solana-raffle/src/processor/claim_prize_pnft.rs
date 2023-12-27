use std::vec;

use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use mpl_token_metadata::instruction::{
    builders::{TransferBuilder, UnlockBuilder},
    InstructionBuilder, TransferArgs, UnlockArgs,
};

use crate::{constants::*, error::*, states::*, utils::bump};

/// Claim prize PNFT by winner
pub fn claim_prize_pnft(
    ctx: Context<ClaimPrizePnftCtx>,
    idx: u32,
    uid: [u8; ID_LENGTH],
) -> Result<()> {
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

    // Unlock nft first
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

    let unlock_ix = UnlockBuilder::new()
        .authority(ctx.accounts.escrow_account.key())
        .mint(ctx.accounts.mint.key())
        .metadata(ctx.accounts.metadata.key())
        .edition(ctx.accounts.edition.key())
        .token(ctx.accounts.owner_token_account.key())
        .token_record(ctx.accounts.owner_token_record.key())
        .system_program(ctx.accounts.system_program.key())
        .sysvar_instructions(ctx.accounts.sysvar_instructions.key())
        .spl_token_program(ctx.accounts.token_program.key())
        .authorization_rules(ctx.accounts.authorization_rules.key())
        .authorization_rules_program(ctx.accounts.authorization_rules_program.key())
        .payer(ctx.accounts.authority.key())
        .build(UnlockArgs::V1 {
            authorization_data: None,
        })
        .unwrap()
        .instruction();

    let unlock_accounts = [
        ctx.accounts.metadata_program.to_account_info(),
        ctx.accounts.escrow_account.to_account_info(),
        ctx.accounts.owner_token_record.to_account_info(),
        ctx.accounts.owner_token_account.to_account_info(),
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

    invoke_signed(&unlock_ix, &unlock_accounts, &[seeds])?;

    // Transfer nft to winner using escrow account
    let transfer_ix = TransferBuilder::new()
        .authority(ctx.accounts.escrow_account.key())
        .mint(ctx.accounts.mint.key())
        .metadata(ctx.accounts.metadata.key())
        .edition(ctx.accounts.edition.key())
        .token(ctx.accounts.owner_token_account.key())
        .token_owner(ctx.accounts.owner.key())
        .owner_token_record(ctx.accounts.owner_token_record.key())
        .destination(ctx.accounts.dest_token_account.key())
        .destination_owner(ctx.accounts.authority.key())
        .destination_token_record(ctx.accounts.dest_token_record.key())
        .sysvar_instructions(ctx.accounts.sysvar_instructions.key())
        .spl_token_program(ctx.accounts.token_program.key())
        .spl_ata_program(ctx.accounts.ata_program.key())
        .authorization_rules(ctx.accounts.authorization_rules.key())
        .authorization_rules_program(ctx.accounts.authorization_rules_program.key())
        .payer(ctx.accounts.authority.key())
        .build(TransferArgs::V1 {
            amount: 1,
            authorization_data: None,
        })
        .unwrap()
        .instruction();

    let transfer_accounts = [
        ctx.accounts.metadata_program.to_account_info(),
        ctx.accounts.escrow_account.to_account_info(),
        ctx.accounts.owner.to_account_info(),
        ctx.accounts.dest_token_account.to_account_info(),
        ctx.accounts.dest_token_record.to_account_info(),
        ctx.accounts.owner_token_account.to_account_info(),
        ctx.accounts.owner_token_record.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.edition.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_program.to_account_info(),
        ctx.accounts.authorization_rules_program.to_account_info(),
        ctx.accounts.authorization_rules.to_account_info(),
        ctx.accounts.sysvar_instructions.to_account_info(),
    ];

    invoke_signed(&transfer_ix, &transfer_accounts, &[seeds])?;

    // Update raffle account
    raffle_account.mint = ctx.accounts.mint.key();
    raffle_account.is_deposited = true;

    Ok(())
}

#[derive(Accounts)]
#[instruction(idx: u32, uid: [u8; ID_LENGTH])]
pub struct ClaimPrizePnftCtx<'info> {
    #[account(mut)]
    authority: Signer<'info>,

    #[account(
        mut, 
        seeds=[PREFIX, RAFFLE, &idx.to_be_bytes()], 
        has_one = mint,
        constraint = raffle_account.authority == owner.key() @RaffleError::InvalidOwner,
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

    /// CHECK: validate nft edition account
    owner: UncheckedAccount<'info>,

    mint: Box<Account<'info, Mint>>,

    /// CHECK: validate whitelist collection
    #[account(mut)]
    metadata: UncheckedAccount<'info>,

    /// CHECK: validate nft edition account
    edition: UncheckedAccount<'info>,

    /// CHECK: validate token record account
    #[account(mut)]
    owner_token_record: UncheckedAccount<'info>,

    /// CHECK: validate owner token account
    #[account(
        mut,
        constraint = owner_token_account.mint == mint.key()
        && owner_token_account.owner == raffle_account.authority
        && owner_token_account.amount == 1
        @ RaffleError::InvalidTokenAccount
    )]
    owner_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: validate token record account
    #[account(mut)]
    dest_token_record: UncheckedAccount<'info>,

    /// CHECK: validate destination token account
    #[account(
        mut,
        constraint = dest_token_account.mint == mint.key()
        && dest_token_account.owner == authority.key()
        @ RaffleError::InvalidTokenAccount
    )]
    dest_token_account: Box<Account<'info, TokenAccount>>,

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
    ata_program: Program<'info, AssociatedToken>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(address = mpl_token_metadata::id())]
    metadata_program: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    authorization_rules_program: UncheckedAccount<'info>,
    system_program: Program<'info, System>,
}
