use anchor_lang::prelude::*;

use crate::constants::{ID_LENGTH, MAX_COLLECTIONS};

#[account]
pub struct GlobalAccount {
    pub authority: Pubkey,
    pub vault: Pubkey,

    pub total_raffles: u32,

    pub wl_collections: [Pubkey; MAX_COLLECTIONS],

    pub reserved0: u128,
    pub reserved1: u128,
    pub reserved2: u128,
    pub reserved3: u128,
}

#[account]
#[derive(Default)]
pub struct RaffleAccount {
    pub idx: u32,
    pub authority: Pubkey,
    pub spl_mint: Pubkey,
    pub mint: Pubkey,

    pub price: u64,
    pub total_supply: u32,
    pub total_sales: u32,
    pub winner_idx: u32,

    pub start_date: u64,
    pub end_date: u64,

    pub is_deposited: bool,
    pub is_claimed: bool,
    pub is_withdrawn: bool,

    pub reserved0: u128,
    pub reserved1: u128,
    pub reserved2: u128,
    pub reserved3: u128,

    pub tickets: Vec<RaffleTicket>,
}

impl RaffleAccount {
    pub fn size(total_supply: u32) -> usize {
        4 + 32 * 3 + 8 + 4 * 3 + 8 * 2 + 1 * 3 + 16 * 4 + (4 + (12) * (total_supply as usize))
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Eq, PartialEq)]
pub struct RaffleTicket {
    pub uid: [u8; ID_LENGTH],
}

#[account]
#[derive(Default)]
pub struct UserAccount {
    pub raffle_idx: u32,
    pub authority: Pubkey,
    pub uid: [u8; ID_LENGTH],
    pub amount: u32,

    pub reserved0: u128,
    pub reserved1: u128,
    pub reserved2: u128,
    pub reserved3: u128,
}
