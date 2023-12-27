import * as anchor from "@coral-xyz/anchor";

import AUTHORITY_WALLET from './keypairs/authority.json';
import VAULT_WALLET from './keypairs/vault.json';
import PAYER_WALLET from './keypairs/payer.json';
import USDC_MINT from './keypairs/usdc-mint.json';
import { addPrizePnft, addWhitelist, buyTicket, byteArrayToHexString, claimPrize, claimPrizePnft, createRaffle, delay, findEscrowPda, findGlobalPda, findRafflePda, findUserPda, hexStringToNumArray, mintNft, revealWinner, safeAirdrop, transferNft } from "../utils";
import { SolanaRaffle } from "../../target/types/solana_raffle";
import { NATIVE_MINT, getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { assert } from "chai";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";


describe("support pnft", () => {

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaRaffle as anchor.Program<SolanaRaffle>;

  const vault = anchor.web3.Keypair.fromSecretKey(Buffer.from(VAULT_WALLET));
  const authority = anchor.web3.Keypair.fromSecretKey(Buffer.from(AUTHORITY_WALLET));
  const payer = anchor.web3.Keypair.fromSecretKey(Buffer.from(PAYER_WALLET));
  const usdcMint = anchor.web3.Keypair.fromSecretKey(Buffer.from(USDC_MINT)).publicKey;

  const totalUsers = 5;
  let userIds: string[] = [];
  let userSigners: Keypair[] = [];

  const getUserSigner = (uid: string): Keypair => {
    for (let i = 0; i < totalUsers; i++) {
      if (userIds[i] == uid) {
        return userSigners[i];
      }
    }
  }

  let collection;
  before(async () => {
    collection = await mintNft(provider.connection, authority, true);
    await addWhitelist(program, authority, collection);

    // Create users for select winner
    for (let i = 1; i <= totalUsers; i++) {
      userIds.push(`63efe02f54d5460081a366${i.toString().padEnd(2, '0')}`);

      const signer = Keypair.generate();
      await safeAirdrop(provider.connection, signer.publicKey, 1);
      userSigners.push(signer);
    }
  })

  it('Create raffle with pnft', async () => {

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

    // Register raffle
    const splMint = NATIVE_MINT;
    await createRaffle(program, raffleIdx, payer, splMint, totalSupply, price, startDate, endDate);

    // Add prize to raffle
    const nft = await mintNft(provider.connection, payer, false, collection, authority, TokenStandard.ProgrammableNonFungible);
    await addPrizePnft(program, raffleIdx, payer, nft);

    // Test if transfer work after lock
    try {
      await transferNft(provider.connection, payer, userSigners[0].publicKey, nft, TokenStandard.ProgrammableNonFungible);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("Token is locked"), "Transaction should be reverted with TokenLocked.");
    }

    await delay(3)
    for (let i = 0; i < 3; i++) {
      await buyTicket(program, userIds[i], 3, raffleIdx, userSigners[i], authority, vault.publicKey, splMint);
    }

    // Reveal winner
    await revealWinner(program, authority, raffleIdx);

    // Check winner
    const raffleAccount = await program.account.raffleAccount.fetch(rafflePda);
    assert(raffleAccount.winnerIdx > 0, "Winner not revealed");
    console.log('Winner idx:', raffleAccount.winnerIdx);

    const winnerUid = byteArrayToHexString(raffleAccount.tickets[raffleAccount.winnerIdx - 1].uid);
    const winner = getUserSigner(winnerUid);

    // Claim prize
    try {
      await claimPrizePnft(program, raffleIdx, winnerUid, winner);
    }
    catch (ex) {
      console.log(ex);
    }

    // Check creator ata
    const creatorAta = getAssociatedTokenAddressSync(raffleAccount.mint, raffleAccount.authority);
    const creatorAtaAcc = await getAccount(provider.connection, creatorAta);
    assert(creatorAtaAcc.amount == 0n, "Nft not transferred");

    // Check winner ata
    const winnerAta = getAssociatedTokenAddressSync(raffleAccount.mint, winner.publicKey);
    const winnerAtaAcc = await getAccount(provider.connection, winnerAta);
    assert(winnerAtaAcc.amount == 1n, "Nft not claimed");

  });

});
