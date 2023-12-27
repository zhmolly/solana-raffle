import * as anchor from "@coral-xyz/anchor";

import AUTHORITY_WALLET from './keypairs/authority.json';
import VAULT_WALLET from './keypairs/vault.json';
import USER1_WALLET from './keypairs/user1.json';
import USER2_WALLET from './keypairs/user2.json';
import PAYER_WALLET from './keypairs/payer.json';
import USDC_MINT from './keypairs/usdc-mint.json';
import { addPrize, addWhitelist, buyTicket, byteArrayToHexString, delay, findEscrowPda, findGlobalPda, findRafflePda, findUserPda, mintNft, safeAirdrop } from "../utils";
import { SolanaRaffle } from "../../target/types/solana_raffle";
import { assert } from "chai";
import { BASIS_POINTS, FEE_PERCENTAGE } from "..";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { NATIVE_MINT, mintToChecked, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddressSync, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";


describe("buy ticket", () => {

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaRaffle as anchor.Program<SolanaRaffle>;

  const vault = anchor.web3.Keypair.fromSecretKey(Buffer.from(VAULT_WALLET));
  const authority = anchor.web3.Keypair.fromSecretKey(Buffer.from(AUTHORITY_WALLET));
  const usdcMint = anchor.web3.Keypair.fromSecretKey(Buffer.from(USDC_MINT)).publicKey;
  const user1 = anchor.web3.Keypair.fromSecretKey(Buffer.from(USER1_WALLET));
  const user2 = anchor.web3.Keypair.fromSecretKey(Buffer.from(USER2_WALLET));
  const payer = anchor.web3.Keypair.fromSecretKey(Buffer.from(PAYER_WALLET));

  const user1_uid = "63efe02f54d5460081a366a1";
  const user2_uid = "63efe02f54d5460081a366a2";
  const user3_uid = "63efe02f54d5460081a366a3";

  let collection;
  before(async () => {
    collection = await mintNft(provider.connection, authority, true);
    await addWhitelist(program, authority, collection);
  })

  it('Success buy raffle with SOL', async () => {

    const totalSupply = 10;

    const now = Math.floor(Date.now() / 1000);
    const startDate = new anchor.BN(now + 5);
    const endDate = new anchor.BN(now + 10);
    const price = new anchor.BN(1_000_000);

    const globalPda = findGlobalPda();
    const globalAccount = await program.account.globalAccount.fetch(globalPda);
    const raffleIdx = globalAccount.totalRaffles;

    const rafflePda = findRafflePda(new anchor.BN(raffleIdx));

    // Register raffle with user1
    const splMint = NATIVE_MINT;
    await program.methods.createRaffle(raffleIdx, totalSupply, price, startDate, endDate)
      .accounts({
        authority: user1.publicKey,
        globalAccount: globalPda,
        raffleAccount: rafflePda,
        splMint: splMint,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      })
      .signers([user1])
      .rpc();

    // Buy raffle with user2
    const userPda = findUserPda(user2_uid, rafflePda);

    try {
      await buyTicket(program, user2_uid, 1, raffleIdx, user2, authority, vault.publicKey, splMint);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("RaffleNotStarted"), "Transaction should be reverted with RaffleNotStarted.");
    }

    await delay(6);

    // Try to buy ticket before add prize
    try {
      await buyTicket(program, user2_uid, 1, raffleIdx, user2, authority, vault.publicKey, splMint);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("PrizeNotDeposited"), "Transaction should be reverted with PrizeNotDeposited.");
    }

    const nft = await mintNft(provider.connection, user1, false, collection, authority);
    await addPrize(program, raffleIdx, user1, nft);

    // Try to buy ticket more than max supply
    try {
      await buyTicket(program, user2_uid, 100, raffleIdx, user2, authority, vault.publicKey, splMint);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("WalletLimitExceed"), "Transaction should be reverted with WalletLimitExceed.");
    }

    for (let i = 0; i < 2; i++) {
      await buyTicket(program, user2_uid, 1, raffleIdx, user2, authority, vault.publicKey, splMint);
    }

    try {
      await buyTicket(program, user2_uid, 1, raffleIdx, user1, authority, vault.publicKey, splMint);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("InvalidWallet"), "Transaction should be reverted with InvalidWallet.");
    }

    await buyTicket(program, user2_uid, 1, raffleIdx, user2, authority, vault.publicKey, splMint);

    // Check user account
    const userAccount = await program.account.userAccount.fetch(userPda);
    assert(userAccount.amount == 3, "User amount not matched");

    // Check raffle account
    const raffleAccount = await program.account.raffleAccount.fetch(rafflePda);
    assert(raffleAccount.totalSales == 3, "Raffle sales not matched");

    // Check fee wallet
    const feeBalance = await provider.connection.getBalance(vault.publicKey);
    const totalAmount = price.muln(3);
    const expectedFeeAmount = totalAmount.muln(FEE_PERCENTAGE).divn(BASIS_POINTS);
    assert(feeBalance > expectedFeeAmount.toNumber(), "Fee balance not matched");

    // Check escrow wallet
    const escrowPda = findEscrowPda(rafflePda);
    const escrowBalance = await provider.connection.getBalance(escrowPda);
    const expectedEscrowBalance = totalAmount.sub(expectedFeeAmount).toNumber();
    assert(escrowBalance == expectedEscrowBalance, "Escrow balance not matched");

    const escrowAccount = findEscrowPda(rafflePda);

    // Try to withdraw funds before raffle ends
    try {
      await program.methods.withdrawRaffle(raffleIdx)
        .accounts({
          authority: user1.publicKey,
          raffleAccount: rafflePda,
          splMint,
          treasuryTokenAccount: user1.publicKey,
          escrowAccount: escrowAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([user1])
        .rpc();
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("RaffleNotEnded"), "Transaction should be reverted with RaffleNotEnded.");
    }

    // Try to buy with other user when raffle ends
    await delay(5);

    const user = Keypair.generate();
    await safeAirdrop(provider.connection, user.publicKey, 1);

    try {
      await buyTicket(program, user1_uid, 1, raffleIdx, user, authority, vault.publicKey, splMint);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("RaffleExpired"), "Transaction should be reverted with RaffleExpired.");
    }

    const user1BalanceBefore = await provider.connection.getBalance(user1.publicKey);

    await program.methods.withdrawRaffle(raffleIdx)
      .accounts({
        authority: user1.publicKey,
        raffleAccount: rafflePda,
        splMint,
        treasuryTokenAccount: user1.publicKey,
        escrowAccount: escrowAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user1])
      .rpc();

    // Check creator's token balance
    const escrowBalance2 = await provider.connection.getBalance(escrowAccount);
    assert(escrowBalance2 == 0, "Escrow balance not empty");

    const user1BalanceAfter = await provider.connection.getBalance(user1.publicKey);
    assert(user1BalanceAfter - user1BalanceBefore == escrowBalance, "Withdraw balance not matched");
  });

  it('Success buy raffle with USDC', async () => {

    const totalSupply = 10;

    const now = Math.floor(Date.now() / 1000);
    const startDate = new anchor.BN(now + 5);
    const endDate = new anchor.BN(now + 10);
    const price = new anchor.BN(1_000_000);

    const globalPda = findGlobalPda();
    const globalAccount = await program.account.globalAccount.fetch(globalPda);
    const raffleIdx = globalAccount.totalRaffles;

    const rafflePda = findRafflePda(new anchor.BN(raffleIdx));

    // Register raffle with user1
    const splMint = usdcMint;
    await program.methods.createRaffle(raffleIdx, totalSupply, price, startDate, endDate)
      .accounts({
        authority: user1.publicKey,
        globalAccount: globalPda,
        raffleAccount: rafflePda,
        splMint: splMint,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      })
      .signers([user1])
      .rpc();

    const nft = await mintNft(provider.connection, user1, false, collection, authority);
    await addPrize(program, raffleIdx, user1, nft);

    // Buy raffle with user2
    const userPda = findUserPda(user2_uid, rafflePda);

    await delay(6);

    // Mint some USDC for user2
    const userAta = (await getOrCreateAssociatedTokenAccount(provider.connection, authority, splMint, user2.publicKey)).address;
    await mintToChecked(provider.connection, authority, splMint, userAta, authority, LAMPORTS_PER_SOL, 9);

    for (let i = 0; i < 2; i++) {
      await buyTicket(program, user2_uid, 1, raffleIdx, user2, authority, vault.publicKey, splMint);
    }

    await buyTicket(program, user2_uid, 1, raffleIdx, user2, authority, vault.publicKey, splMint);

    // Check user account
    const userAccount = await program.account.userAccount.fetch(userPda);
    assert(userAccount.amount == 3, "User amount not matched");

    // Check raffle account
    const raffleAccount = await program.account.raffleAccount.fetch(rafflePda);
    assert(raffleAccount.totalSales == 3, "Raffle sales not matched");

    // Check user USDC balance
    const userInfo = await getAccount(provider.connection, getAssociatedTokenAddressSync(splMint, user2.publicKey));

    // Check escrow USDC balance
    const escrowPda = findEscrowPda(rafflePda);
    let escrowInfo = await getAccount(provider.connection, escrowPda);

    // Check vault USDC balance
    const vaultInfo = await getAccount(provider.connection, getAssociatedTokenAddressSync(splMint, vault.publicKey));

    assert(escrowInfo.amount > 0, "Escrow not updated");
    assert(vaultInfo.amount > 0, "Vault not updated");
    assert(Number(vaultInfo.amount) + Number(escrowInfo.amount) + Number(userInfo.amount) == LAMPORTS_PER_SOL, "Balance sum not matched");

    await delay(3);

    // Test withdraw raffle
    const treasuryAta = (await getOrCreateAssociatedTokenAccount(provider.connection, authority, splMint, user1.publicKey)).address;
    await program.methods.withdrawRaffle(raffleIdx)
      .accounts({
        authority: user1.publicKey,
        raffleAccount: rafflePda,
        escrowAccount: escrowPda,
        splMint,
        treasuryTokenAccount: treasuryAta,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user1])
      .rpc();


    // Check treasury USDC balance
    let treasuryInfo = await getAccount(provider.connection, treasuryAta);
    assert(treasuryInfo.amount == escrowInfo.amount, "Treasury balance not matched");

    // Check escrow USDC balance
    escrowInfo = await getAccount(provider.connection, escrowPda);
    assert(Number(escrowInfo.amount) == 0, "Escrow should be empty");
  });

  it('Validate total supply limit', async () => {

    const totalSupply = 10;

    const now = Math.floor(Date.now() / 1000);
    const startDate = new anchor.BN(now);
    const endDate = new anchor.BN(now + 10);
    const price = new anchor.BN(1_000_000);

    const globalPda = findGlobalPda();
    const globalAccount = await program.account.globalAccount.fetch(globalPda);
    const raffleIdx = globalAccount.totalRaffles;

    const rafflePda = findRafflePda(new anchor.BN(raffleIdx));
    const escrowPda = findEscrowPda(rafflePda);

    // Register raffle with user1
    const splMint = NATIVE_MINT;
    await program.methods.createRaffle(raffleIdx, totalSupply, price, startDate, endDate)
      .accounts({
        authority: user1.publicKey,
        globalAccount: globalPda,
        raffleAccount: rafflePda,
        splMint,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      })
      .signers([user1])
      .rpc();

    const nft = await mintNft(provider.connection, user1, false, collection, authority);
    await addPrize(program, raffleIdx, user1, nft);

    await delay(3)
    await buyTicket(program, user1_uid, 4, raffleIdx, user1, authority, vault.publicKey, splMint);
    await buyTicket(program, user2_uid, 4, raffleIdx, user2, authority, vault.publicKey, splMint);

    try {
      await buyTicket(program, user3_uid, 3, raffleIdx, payer, authority, vault.publicKey, splMint);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("SupplyLimitExceed"), "Transaction should be reverted with SupplyLimitExceed.");
    }

    await buyTicket(program, user3_uid, 2, raffleIdx, payer, authority, vault.publicKey, splMint);

    // Check user id stored in pda
    const raffleAccount = await program.account.raffleAccount.fetch(rafflePda);
    let ticketUid = byteArrayToHexString(raffleAccount.tickets[9].uid);
    assert(user3_uid == ticketUid, "Ticket uid not matched")
  });

});
