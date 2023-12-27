use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod processor;
pub mod states;
pub mod utils;

use crate::constants::ID_LENGTH;
use crate::processor::*;

declare_id!("GFkrs8CmUsviDmAgQRBuj9grwHe5jqKCGjmsuV8CBH7L");

#[program]
pub mod solana_raffle {

    use super::*;

    pub fn initialize(ctx: Context<InitializeCtx>) -> Result<()> {
        processor::initialize(ctx)
    }

    pub fn update_setting(ctx: Context<UpdateSettingCtx>) -> Result<()> {
        processor::update_setting(ctx)
    }

    pub fn add_whitelist(ctx: Context<AddWhitelistCtx>, collection: Pubkey) -> Result<()> {
        processor::add_whitelist(ctx, collection)
    }

    pub fn remove_whitelist(ctx: Context<RemoveWhitelistCtx>, collection: Pubkey) -> Result<()> {
        processor::remove_whitelist(ctx, collection)
    }

    pub fn create_raffle(
        ctx: Context<CreateRaffleCtx>,
        idx: u32,
        total_supply: u32,
        price: u64,
        start_date: u64,
        end_date: u64,
    ) -> Result<()> {
        processor::create_raffle(ctx, idx, total_supply, price, start_date, end_date)
    }

    pub fn add_prize(ctx: Context<AddPrizeCtx>, idx: u32) -> Result<()> {
        processor::add_prize(ctx, idx)
    }

    pub fn add_prize_pnft(ctx: Context<AddPrizePnftCtx>, idx: u32) -> Result<()> {
        processor::add_prize_pnft(ctx, idx)
    }

    pub fn buy_ticket(
        ctx: Context<BuyTicketCtx>,
        idx: u32,
        uid: [u8; ID_LENGTH],
        amount: u32,
    ) -> Result<()> {
        processor::buy_ticket(ctx, idx, uid, amount)
    }

    pub fn withdraw_raffle(ctx: Context<WithdrawRaffleCtx>, idx: u32) -> Result<()> {
        processor::withdraw_raffle(ctx, idx)
    }

    pub fn reveal_winner(ctx: Context<RevealWinnerCtx>, idx: u32) -> Result<()> {
        processor::reveal_winner(ctx, idx)
    }

    pub fn claim_prize(ctx: Context<ClaimPrizeCtx>, idx: u32, uid: [u8; ID_LENGTH]) -> Result<()> {
        processor::claim_prize(ctx, idx, uid)
    }

    pub fn claim_prize_pnft(
        ctx: Context<ClaimPrizePnftCtx>,
        idx: u32,
        uid: [u8; ID_LENGTH],
    ) -> Result<()> {
        processor::claim_prize_pnft(ctx, idx, uid)
    }
}
