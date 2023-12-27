use anchor_lang::prelude::*;

#[error_code]
pub enum RaffleError {
    #[msg("Invalid Signer")]
    InvalidSigner,

    #[msg("Invalid Wallet")]
    InvalidWallet,

    #[msg("Invalid raffle index")]
    InvalidRaffleIdx,

    #[msg("Invalid UUID")]
    InvalidUUID,

    #[msg("Invalid date")]
    InvalidDate,

    #[msg("Token balance not enough")]
    InsufficientBalance,

    #[msg("Raffle not started")]
    RaffleNotStarted,

    #[msg("Raffle has been expired")]
    RaffleExpired,

    #[msg("Raffle not ended")]
    RaffleNotEnded,

    #[msg("Raffle already withdrawn")]
    RaffleAlreadyWithdrawn,

    #[msg("Prize not deposited")]
    PrizeNotDeposited,

    #[msg("Prize already deposited")]
    PrizeAlreadyDeposited,

    #[msg("Prize already claimed")]
    PrizeAlreadyClaimed,

    #[msg("Winner not revealed")]
    WinnerNotRevealed,

    #[msg("Winner not matched")]
    WinnerNotMatched,

    #[msg("Totaly supply limit exceed")]
    SupplyLimitExceed,

    #[msg("Wallet supply limit exceed")]
    WalletLimitExceed,

    #[msg("Total supply should be greater than total sales")]
    TotalSupplyLessTotalSales,

    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("Numeric Overflow Error")]
    NumericOverflow,

    #[msg("Invalid Mint")]
    InvalidMint,

    #[msg("Invalid Token Account")]
    InvalidTokenAccount,

    #[msg("Invalid Pubkey")]
    InvalidPubkey,

    #[msg("Invalid Owner")]
    InvalidOwner,

    #[msg("Uninitialized Account")]
    UninitializedAccount,

    #[msg("Invalid Collection")]
    InvalidCollection,

    #[msg("Invalid TokenStandard")]
    InvalidTokenStandard,

    #[msg("Bad Metadata")]
    BadMetadata,

    #[msg("Whitelist is full")]
    WhitelistFull,
}
