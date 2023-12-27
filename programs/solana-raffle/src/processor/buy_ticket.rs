use anchor_lang::{
    prelude::*,
    solana_program::{program::invoke, system_instruction},
};
use anchor_spl::token::{
    spl_token::{instruction::transfer, native_mint},
    Mint, Token,
};

use crate::{constants::*, error::*, states::*, utils::*};

/// Buy ticket by user
pub fn buy_ticket(
    ctx: Context<BuyTicketCtx>,
    idx: u32,
    uid: [u8; ID_LENGTH],
    amount: u32,
) -> Result<()> {
    let raffle_account = &mut ctx.accounts.raffle_account;
    let user_account = &mut ctx.accounts.user_account;
    let buyer = &ctx.accounts.buyer;
    let global_account = &ctx.accounts.global_account;
    let user_token_account = &ctx.accounts.user_token_account;
    let escrow_account = &ctx.accounts.escrow_account;
    let vault_token_account = &ctx.accounts.vault_token_account;

    let system_program = &ctx.accounts.system_program;
    let token_program = &ctx.accounts.token_program;
    let rent = &ctx.accounts.rent;

    require!(uid.len() == ID_LENGTH, RaffleError::InvalidUUID);

    let now = (Clock::get().unwrap().unix_timestamp) as u64;
    require!(
        now >= raffle_account.start_date,
        RaffleError::RaffleNotStarted
    );
    require!(raffle_account.end_date >= now, RaffleError::RaffleExpired);
    require!(raffle_account.is_deposited, RaffleError::PrizeNotDeposited);
    require!(amount > 0, RaffleError::InvalidAmount);

    // Check wallet supply
    let wallet_amount = user_account
        .amount
        .checked_add(amount)
        .ok_or(RaffleError::NumericOverflow)?;

    let wallet_limit = raffle_account
        .total_supply
        .checked_mul(MAX_TICKET_PERCENT as u32)
        .ok_or(RaffleError::NumericOverflow)?
        .checked_div(BASIS_POINTS as u32)
        .ok_or(RaffleError::NumericOverflow)?;
    require!(
        wallet_amount <= wallet_limit,
        RaffleError::WalletLimitExceed
    );

    // Create & update user account
    if is_zero_account(&user_account.to_account_info()) {
        user_account.uid = uid;
        user_account.raffle_idx = idx;
        user_account.authority = buyer.key();
        user_account.amount = amount;
    } else {
        require!(
            user_account.authority == buyer.key(),
            RaffleError::InvalidWallet
        );
        user_account.amount = wallet_amount;
    }

    // Check token mint
    let spl_mint = raffle_account.spl_mint;
    require!(
        ctx.accounts.spl_mint.key() == spl_mint,
        RaffleError::InvalidMint
    );

    let is_native = spl_mint == native_mint::id();

    // Create escrow pda if not created
    let escrow_signer_seeds = &[
        PREFIX,
        &raffle_account.key().to_bytes(),
        ESCROW,
        &[bump(
            &[PREFIX, &raffle_account.key().to_bytes(), ESCROW],
            ctx.program_id,
        )],
    ];
    create_program_token_account_if_not_present(
        escrow_account,
        system_program,
        &buyer,
        token_program,
        &ctx.accounts.spl_mint,
        &raffle_account.to_account_info(),
        rent,
        &escrow_signer_seeds[..],
        &[],
        is_native,
    )?;

    // Reach rental exemption and then add deposit amount.
    let total_amount = raffle_account
        .price
        .checked_mul(amount as u64)
        .ok_or(RaffleError::NumericOverflow)?;
    if is_native {
        assert_keys_equal(user_token_account.key(), buyer.key())?;
        require!(
            user_token_account.lamports() >= total_amount,
            RaffleError::InsufficientBalance
        );
    } else {
        let user_ata = assert_is_ata(&user_token_account.to_account_info(), buyer.key, &spl_mint)?;
        require!(
            user_ata.amount >= total_amount,
            RaffleError::InsufficientBalance
        );
    }

    // Transfer SOL/USDC to fee wallet
    let fee_amount = total_amount
        .checked_mul(FEE_PERCENT as u64)
        .ok_or(RaffleError::NumericOverflow)?
        .checked_div(BASIS_POINTS as u64)
        .ok_or(RaffleError::NumericOverflow)?;

    if is_native {
        assert_keys_equal(vault_token_account.key(), global_account.vault)?;
        invoke(
            &system_instruction::transfer(
                &user_token_account.key(),
                &vault_token_account.key(),
                fee_amount,
            ),
            &[
                user_token_account.to_account_info(),
                vault_token_account.to_account_info(),
                system_program.to_account_info(),
            ],
        )?;
    } else {
        assert_is_ata(
            &vault_token_account.to_account_info(),
            &global_account.vault,
            &spl_mint,
        )?;
        invoke(
            &transfer(
                &token_program.key(),
                &user_token_account.key(),
                &vault_token_account.key(),
                &buyer.key(),
                &[],
                fee_amount,
            )?,
            &[
                buyer.to_account_info(),
                user_token_account.to_account_info(),
                vault_token_account.to_account_info(),
                token_program.to_account_info(),
            ],
        )?;
    }

    // Transfer SOL/USDC to escrow wallet
    let remain_amount = total_amount
        .checked_sub(fee_amount)
        .ok_or(RaffleError::NumericOverflow)?;

    if is_native {
        invoke(
            &system_instruction::transfer(
                &user_token_account.key(),
                &escrow_account.key(),
                remain_amount,
            ),
            &[
                user_token_account.to_account_info(),
                escrow_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    } else {
        assert_is_ata(
            &escrow_account.to_account_info(),
            &raffle_account.key(),
            &spl_mint,
        )?;
        invoke(
            &transfer(
                &token_program.key(),
                &user_token_account.key(),
                &escrow_account.key(),
                &buyer.key(),
                &[],
                remain_amount,
            )?,
            &[
                buyer.to_account_info(),
                user_token_account.to_account_info(),
                escrow_account.to_account_info(),
                token_program.to_account_info(),
            ],
        )?;
    }

    // Validate total supply
    let total_sales = raffle_account
        .total_sales
        .checked_add(amount)
        .ok_or(RaffleError::NumericOverflow)?;
    require!(
        total_sales <= raffle_account.total_supply,
        RaffleError::SupplyLimitExceed
    );

    // Assign ticket slot
    for i in 0..amount {
        let idx = raffle_account
            .total_sales
            .checked_add(i)
            .ok_or(RaffleError::NumericOverflow)?;
        raffle_account.tickets[idx as usize].uid = uid;
    }

    raffle_account.total_sales = total_sales;

    Ok(())
}

#[derive(Accounts)]
#[instruction(idx: u32, uid: [u8; ID_LENGTH])]
pub struct BuyTicketCtx<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

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

    #[account(
        init_if_needed, 
        seeds=[USER, raffle_account.key().as_ref(), uid.as_ref()], 
        bump, 
        space=8+std::mem::size_of::<UserAccount>(),
        payer=buyer,
    )]
    pub user_account: Box<Account<'info, UserAccount>>,

    /// CHECK: token mint as SOL or USDC
    pub spl_mint: Box<Account<'info, Mint>>,

    /// CHECK: token account for user's payment
    #[account(mut)]
    pub user_token_account: UncheckedAccount<'info>,

    /// CHECK: token account for receive platform fee
    #[account(mut)]
    pub vault_token_account: UncheckedAccount<'info>,

    /// CHECK: token account for raffle escrow
    #[account(
        mut,
        seeds = [PREFIX, raffle_account.key().as_ref(), ESCROW],
        bump
    )]
    pub escrow_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
