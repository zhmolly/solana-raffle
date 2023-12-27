use anchor_lang::{
    prelude::*,
    solana_program::{keccak, sysvar::slot_hashes},
};
use arrayref::array_ref;

use crate::{constants::*, error::*, states::*};

/// Reveal winner after raffle ends
pub fn reveal_winner(ctx: Context<RevealWinnerCtx>, idx: u32) -> Result<()> {
    let raffle_account = &mut ctx.accounts.raffle_account;
    require!(raffle_account.is_deposited, RaffleError::PrizeNotDeposited);

    let now = (Clock::get().unwrap().unix_timestamp) as u64;
    require!(
        raffle_account.end_date >= now || raffle_account.total_supply == raffle_account.total_sales,
        RaffleError::RaffleNotEnded
    );

    let recent_slothashes = &ctx.accounts.recent_slothashes;
    let hash_data = recent_slothashes.data.try_borrow().unwrap();

    let mut hasher = keccak::Hasher::default();
    hasher.hash(array_ref![hash_data, 12, 8]);
    hasher.hash(&now.to_le_bytes());
    hasher.hash(&raffle_account.key().to_bytes());

    let prng_seed = u32::from_le_bytes(
        hasher.result().to_bytes()[0..4]
            .try_into()
            .expect("Incorrect hash value"),
    );

    raffle_account.winner_idx = prng_seed % raffle_account.total_sales + 1;
    raffle_account.end_date = now;

    Ok(())
}

#[derive(Accounts)]
#[instruction(idx: u32)]
pub struct RevealWinnerCtx<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds=[PREFIX], 
        bump, 
        has_one = authority,
    )]
    pub global_account: Box<Account<'info, GlobalAccount>>,

    #[account(
        mut, 
        seeds=[PREFIX, RAFFLE, &idx.to_be_bytes()], 
        bump,
    )]
    pub raffle_account: Box<Account<'info, RaffleAccount>>,

    /// CHECK: account constraints checked in account trait
    #[account(address = slot_hashes::id())]
    recent_slothashes: UncheckedAccount<'info>,
}
