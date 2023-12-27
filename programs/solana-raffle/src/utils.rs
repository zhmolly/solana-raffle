use crate::error::RaffleError;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    program::invoke_signed,
    program_memory::sol_memcmp,
    program_pack::{IsInitialized, Pack},
    pubkey::PUBKEY_BYTES,
    system_instruction,
};
use anchor_spl::token::{
    spl_token::{
        id as spl_token_id, instruction::initialize_account2, state::Account as SplAccount,
    },
    Mint, Token,
};
use mpl_token_metadata::state::{Metadata, TokenMetadataAccount};

pub fn is_zero_account(account_info: &AccountInfo) -> bool {
    account_info.data.borrow().iter().all(|byte| byte.eq(&0))
}

pub fn bump(seeds: &[&[u8]], program_id: &Pubkey) -> u8 {
    let (_found_key, bump) = Pubkey::find_program_address(seeds, program_id);
    bump
}

pub fn assert_is_ata(ata: &AccountInfo, wallet: &Pubkey, mint: &Pubkey) -> Result<SplAccount> {
    assert_owned_by(ata, &spl_token_id())?;
    let ata_account: SplAccount = assert_initialized(ata)?;
    assert_keys_equal(ata_account.owner, *wallet)?;
    assert_keys_equal(ata_account.mint, *mint)?;

    Ok(ata_account)
}

pub fn assert_initialized<T: Pack + IsInitialized>(account_info: &AccountInfo) -> Result<T> {
    let account: T = T::unpack_unchecked(&account_info.data.borrow())?;
    if !account.is_initialized() {
        err!(RaffleError::UninitializedAccount)
    } else {
        Ok(account)
    }
}

pub fn assert_owned_by(account: &AccountInfo, owner: &Pubkey) -> Result<()> {
    if account.owner != owner {
        err!(RaffleError::InvalidOwner)
    } else {
        Ok(())
    }
}

pub fn assert_keys_equal(key1: Pubkey, key2: Pubkey) -> Result<()> {
    if sol_memcmp(key1.as_ref(), key2.as_ref(), PUBKEY_BYTES) != 0 {
        err!(RaffleError::InvalidPubkey)
    } else {
        Ok(())
    }
}

/// Create account almost from scratch, lifted from
/// <https://github.com/solana-labs/solana-program-library/blob/7d4873c61721aca25464d42cc5ef651a7923ca79/associated-token-account/program/src/processor.rs#L51-L98>
#[inline(always)]
pub fn create_or_allocate_account_raw<'a>(
    program_id: Pubkey,
    new_account_info: &AccountInfo<'a>,
    rent_sysvar_info: &AccountInfo<'a>,
    system_program_info: &AccountInfo<'a>,
    payer_info: &AccountInfo<'a>,
    size: usize,
    signer_seeds: &[&[u8]],
    new_acct_seeds: &[&[u8]],
) -> Result<()> {
    let rent = &Rent::from_account_info(rent_sysvar_info)?;
    let required_lamports = rent
        .minimum_balance(size)
        .max(1)
        .saturating_sub(new_account_info.lamports());

    if required_lamports > 0 {
        msg!("Transfer {} lamports to the new account", required_lamports);

        let as_arr = [signer_seeds];
        let seeds: &[&[&[u8]]] = if !signer_seeds.is_empty() {
            &as_arr
        } else {
            &[]
        };

        invoke_signed(
            &system_instruction::transfer(payer_info.key, new_account_info.key, required_lamports),
            &[
                payer_info.clone(),
                new_account_info.clone(),
                system_program_info.clone(),
            ],
            seeds,
        )?;
    }

    let accounts = &[new_account_info.clone(), system_program_info.clone()];

    msg!("Allocate space for the account {}", new_account_info.key);
    invoke_signed(
        &system_instruction::allocate(new_account_info.key, size.try_into().unwrap()),
        accounts,
        &[new_acct_seeds],
    )?;

    msg!("Assign the account to the owning program");
    invoke_signed(
        &system_instruction::assign(new_account_info.key, &program_id),
        accounts,
        &[new_acct_seeds],
    )?;
    msg!("Completed assignation!");

    Ok(())
}

pub fn create_program_token_account_if_not_present<'a>(
    payment_account: &UncheckedAccount<'a>,
    system_program: &Program<'a, System>,
    fee_payer: &AccountInfo<'a>,
    token_program: &Program<'a, Token>,
    treasury_mint: &anchor_lang::prelude::Account<'a, Mint>,
    owner: &AccountInfo<'a>,
    rent: &Sysvar<'a, Rent>,
    signer_seeds: &[&[u8]],
    fee_seeds: &[&[u8]],
    is_native: bool,
) -> Result<()> {
    if !is_native && payment_account.data_is_empty() {
        create_or_allocate_account_raw(
            *token_program.key,
            &payment_account.to_account_info(),
            &rent.to_account_info(),
            system_program,
            fee_payer,
            SplAccount::LEN,
            fee_seeds,
            signer_seeds,
        )?;
        invoke_signed(
            &initialize_account2(
                token_program.key,
                &payment_account.key(),
                &treasury_mint.key(),
                &owner.key(),
            )
            .unwrap(),
            &[
                token_program.to_account_info(),
                treasury_mint.to_account_info(),
                payment_account.to_account_info(),
                rent.to_account_info(),
                owner.clone(),
            ],
            &[signer_seeds],
        )?;
    }
    Ok(())
}

#[inline(never)]
pub fn assert_decode_metadata<'info>(
    nft_mint: &Account<'info, Mint>,
    metadata_account: &AccountInfo<'info>,
) -> Result<Metadata> {
    assert_keys_equal(*metadata_account.owner, mpl_token_metadata::ID)?;

    let metadata = Metadata::from_account_info(metadata_account)?;
    assert_keys_equal(metadata.mint, nft_mint.key())?;

    Ok(metadata)
}
