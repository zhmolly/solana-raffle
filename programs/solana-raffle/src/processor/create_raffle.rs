use std::vec;

use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::{constants::*, error::*, states::*};

/// Create raffle by creator
pub fn create_raffle(
    ctx: Context<CreateRaffleCtx>,
    idx: u32,
    total_supply: u32,
    price: u64,
    start_date: u64,
    end_date: u64,
) -> Result<()> {
    let global_account = &mut ctx.accounts.global_account;
    let raffle_account = &mut ctx.accounts.raffle_account;

    require!(total_supply > 0, RaffleError::InvalidAmount);
    require!(
        global_account.total_raffles == idx,
        RaffleError::InvalidRaffleIdx
    );

    let now = (Clock::get().unwrap().unix_timestamp) as u64;
    require!(start_date < end_date, RaffleError::InvalidDate);
    require!(end_date > now, RaffleError::InvalidDate);

    raffle_account.idx = global_account.total_raffles;
    raffle_account.authority = ctx.accounts.authority.key();
    raffle_account.total_supply = total_supply;
    raffle_account.price = price;
    raffle_account.start_date = start_date;
    raffle_account.end_date = end_date;
    raffle_account.total_sales = 0;
    raffle_account.is_deposited = false;
    raffle_account.is_withdrawn = false;
    raffle_account.spl_mint = ctx.accounts.spl_mint.key();

    // Initialize raffles vector
    for _ in 0..total_supply {
        raffle_account.tickets.push(RaffleTicket {
            uid: [0; ID_LENGTH],
        });
    }

    global_account.total_raffles = global_account
        .total_raffles
        .checked_add(1)
        .ok_or(RaffleError::NumericOverflow)?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(idx: u32, total_supply: u32)]
pub struct CreateRaffleCtx<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut, 
        seeds=[PREFIX], 
        bump, 
    )]
    pub global_account: Box<Account<'info, GlobalAccount>>,

    /// CHECK: token mint as SOL or USDC
    pub spl_mint: Box<Account<'info, Mint>>,

    #[account(
        init, 
        seeds=[PREFIX, RAFFLE, &idx.to_be_bytes()], 
        bump,
        space=8 + RaffleAccount::size(total_supply),
        payer=authority
    )]
    pub raffle_account: Box<Account<'info, RaffleAccount>>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
