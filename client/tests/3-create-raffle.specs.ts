import * as anchor from "@coral-xyz/anchor";

import AUTHORITY_WALLET from './keypairs/authority.json';
import VAULT_WALLET from './keypairs/vault.json';
import PAYER_WALLET from './keypairs/payer.json';
import USDC_MINT from './keypairs/usdc-mint.json';
import USER1_WALLET from './keypairs/user1.json';
import USER2_WALLET from './keypairs/user2.json';
import { addPrize, addWhitelist, createRaffle, findGlobalPda, findRafflePda, mintNft } from "../utils";
import { SolanaRaffle } from "../../target/types/solana_raffle";
import { assert } from "chai";
import { NATIVE_MINT } from "@solana/spl-token";
import { createNft } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from "@solana/web3.js";

describe("create raffle", () => {

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaRaffle as anchor.Program<SolanaRaffle>;

  const vault = anchor.web3.Keypair.fromSecretKey(Buffer.from(VAULT_WALLET));
  const authority = anchor.web3.Keypair.fromSecretKey(Buffer.from(AUTHORITY_WALLET));
  const payer = anchor.web3.Keypair.fromSecretKey(Buffer.from(PAYER_WALLET));
  const usdcMint = anchor.web3.Keypair.fromSecretKey(Buffer.from(USDC_MINT));
  const user1 = anchor.web3.Keypair.fromSecretKey(Buffer.from(USER1_WALLET));
  const user2 = anchor.web3.Keypair.fromSecretKey(Buffer.from(USER2_WALLET));

  it('Success create raffle', async () => {
    const totalSupply = 10;
    const now = Math.floor(Date.now() / 1000);
    const startDate = new anchor.BN(now);
    const endDate = new anchor.BN(now + 10);
    const price = new anchor.BN(1_000_000_000);

    await createRaffle(program, 0, user1, NATIVE_MINT, totalSupply, price, startDate, endDate);
  });

  it('Failed create raffle as same index', async () => {
    const totalSupply = 10;
    const now = Math.floor(Date.now() / 1000);
    const startDate = new anchor.BN(now);
    const endDate = new anchor.BN(now + 10);
    const price = new anchor.BN(1_000_000_000);

    try {
      await createRaffle(program, 0, user1, NATIVE_MINT, totalSupply, price, startDate, endDate);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      // console.log(ex)
    }
  });

  it('Failed create raffle as wrong index', async () => {
    const totalSupply = 10;
    const now = Math.floor(Date.now() / 1000);
    const startDate = new anchor.BN(now);
    const endDate = new anchor.BN(now + 10);
    const price = new anchor.BN(1_000_000_000);

    try {
      await createRaffle(program, 5, user1, NATIVE_MINT, totalSupply, price, startDate, endDate);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("InvalidRaffleIdx"), "Transaction should be reverted with InvalidRaffleIdx");
    }
  });

  it('Failed create raffle as invalid date', async () => {
    const totalSupply = 10;
    const now = Math.floor(Date.now() / 1000);
    const startDate = new anchor.BN(now - 10);
    const endDate = new anchor.BN(now - 5);
    const price = new anchor.BN(1_000_000_000);

    try {
      await createRaffle(program, 1, user1, NATIVE_MINT, totalSupply, price, startDate, endDate);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("InvalidDate"), "Transaction should be reverted with InvalidDate");
    }
  });

  it('Failed create raffle as invalid total supply', async () => {
    const totalSupply = 0;
    const now = Math.floor(Date.now() / 1000);
    const startDate = new anchor.BN(now);
    const endDate = new anchor.BN(now + 10);
    const price = new anchor.BN(1_000_000_000);

    try {
      await createRaffle(program, 1, user1, NATIVE_MINT, totalSupply, price, startDate, endDate);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("InvalidAmount"), "Transaction should be reverted with InvalidAmount.");
    }
  });

  it('Success create raffle with USDC', async () => {
    const totalSupply = 10;
    const now = Math.floor(Date.now() / 1000);
    const startDate = new anchor.BN(now);
    const endDate = new anchor.BN(now + 10);
    const price = new anchor.BN(1_000_000_000);

    await createRaffle(program, 1, user1, usdcMint.publicKey, totalSupply, price, startDate, endDate);
  });

  it('Success add prize after create raffle', async () => {
    const totalSupply = 10;
    const now = Math.floor(Date.now() / 1000);
    const startDate = new anchor.BN(now);
    const endDate = new anchor.BN(now + 10);
    const price = new anchor.BN(1_000_000_000);
    await createRaffle(program, 2, user1, usdcMint.publicKey, totalSupply, price, startDate, endDate);

    // Try with incorrect mint
    try {
      const nft = PublicKey.default;
      await addPrize(program, 2, user1, nft);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      // console.log(ex)
    }

    // Try with with uncollection nft
    try {
      let nft = await mintNft(provider.connection, authority, false);
      await addPrize(program, 2, user1, nft);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("AccountNotInitialized"), "Transaction should be reverted with AccountNotInitialized.");
    }

    // Try with with collection not whitelisted
    let collection = await mintNft(provider.connection, authority, true);
    let nft = await mintNft(provider.connection, user1, false, collection, authority);

    try {
      await addPrize(program, 2, user1, nft);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("InvalidCollection"), "Transaction should be reverted with InvalidCollection.");
    }

    await addWhitelist(program, authority, collection);
    await addPrize(program, 2, user1, nft);
  });

});
