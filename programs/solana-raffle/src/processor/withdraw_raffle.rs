use anchor_lang::{
    prelude::*,
    solana_program::{program::invoke_signed, system_instruction},
};
use anchor_spl::token::{
    spl_token::{instruction::transfer, native_mint, state::Account as SplAccount},
    Mint, Token,
};

use crate::{
    constants::*,
    error::*,
    states::*,
    utils::{assert_initialized, assert_is_ata, assert_keys_equal, bump},
};

/// Withdraw raffle by creator
pub fn withdraw_raffle(ctx: Context<WithdrawRaffleCtx>, idx: u32) -> Result<()> {
    let authority = &ctx.accounts.authority;
    let raffle_account = &mut ctx.accounts.raffle_account;
    let escrow_account = &ctx.accounts.escrow_account;
    let treasury_token_account = &ctx.accounts.treasury_token_account;

    let now = (Clock::get().unwrap().unix_timestamp) as u64;
    require!(
        !raffle_account.is_withdrawn,
        RaffleError::RaffleAlreadyWithdrawn
    );

    require!(
        now >= raffle_account.end_date || raffle_account.total_sales == raffle_account.total_supply,
        RaffleError::RaffleNotEnded
    );

    // Check token mint
    let spl_mint = raffle_account.spl_mint;
    require!(
        ctx.accounts.spl_mint.key() == spl_mint,
        RaffleError::InvalidMint
    );

    let is_native = spl_mint == native_mint::id();

    if is_native {
        assert_keys_equal(treasury_token_account.key(), authority.key())?;
        let amount = escrow_account.lamports();

        let escrow_signer_seeds = &[
            PREFIX,
            &raffle_account.key().to_bytes(),
            ESCROW,
            &[bump(
                &[PREFIX, &raffle_account.key().to_bytes(), ESCROW],
                ctx.program_id,
            )],
        ];
        let escrow_signer = &[&escrow_signer_seeds[..]];

        invoke_signed(
            &system_instruction::transfer(
                &escrow_account.key(),
                &treasury_token_account.key(),
                amount,
            ),
            &[
                escrow_account.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            escrow_signer,
        )?;
    } else {
        assert_is_ata(
            &treasury_token_account.to_account_info(),
            &authority.key(),
            &spl_mint,
        )?;

        let escrow_token_account: SplAccount = assert_initialized(escrow_account)?;
        let escrow_signer_seeds = &[
            PREFIX,
            RAFFLE,
            &idx.to_be_bytes(),
            &[bump(&[PREFIX, RAFFLE, &idx.to_be_bytes()], ctx.program_id)],
        ];
        let escrow_signer = &[&escrow_signer_seeds[..]];

        invoke_signed(
            &transfer(
                &ctx.accounts.token_program.key(),
                &escrow_account.key(),
                &treasury_token_account.key(),
                &raffle_account.key(),
                &[],
                escrow_token_account.amount,
            )?,
            &[
                raffle_account.to_account_info(),
                escrow_account.to_account_info(),
                treasury_token_account.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
            ],
            escrow_signer,
        )?;
    }

    ctx.accounts.raffle_account.is_withdrawn = true;

    Ok(())
}

#[derive(Accounts)]
#[instruction(idx: u32)]
pub struct WithdrawRaffleCtx<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut, 
        seeds=[PREFIX, RAFFLE, &idx.to_be_bytes()], 
        bump,
        has_one = authority,
    )]
    pub raffle_account: Box<Account<'info, RaffleAccount>>,

    /// CHECK: token mint as SOL or USDC
    pub spl_mint: Box<Account<'info, Mint>>,

    /// CHECK: token account for receive funds
    #[account(mut)]
    pub treasury_token_account: UncheckedAccount<'info>,

    /// CHECK: token account for escrow
    #[account(
        mut,
        seeds = [PREFIX, raffle_account.key().as_ref(), ESCROW],
        bump
    )]
    pub escrow_account: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
