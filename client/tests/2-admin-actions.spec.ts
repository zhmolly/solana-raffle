import * as anchor from "@coral-xyz/anchor";

import AUTHORITY_WALLET from './keypairs/authority.json';
import VAULT_WALLET from './keypairs/vault.json';
import PAYER_WALLET from './keypairs/payer.json';
import USER1_WALLET from './keypairs/user1.json';
import USER2_WALLET from './keypairs/user2.json';
import { addWhitelist, findGlobalPda, removeWhitelist } from "../utils";
import { SolanaRaffle } from "../../target/types/solana_raffle";
import { assert } from "chai";
import { Keypair, PublicKey } from "@solana/web3.js";
import { MAX_COLLECTIONS } from "..";

describe("admin actions", () => {

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaRaffle as anchor.Program<SolanaRaffle>;

  const vault = anchor.web3.Keypair.fromSecretKey(Buffer.from(VAULT_WALLET));
  const authority = anchor.web3.Keypair.fromSecretKey(Buffer.from(AUTHORITY_WALLET));
  const payer = anchor.web3.Keypair.fromSecretKey(Buffer.from(PAYER_WALLET));
  const user1 = anchor.web3.Keypair.fromSecretKey(Buffer.from(USER1_WALLET));
  const user2 = anchor.web3.Keypair.fromSecretKey(Buffer.from(USER2_WALLET));

  it('Initialize admin authority', async () => {
    const globalPda = findGlobalPda();

    try {
      const tx = await program.methods.initialize()
        .accounts({
          authority: user1.publicKey,
          vault: vault.publicKey,
          globalAccount: globalPda,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY
        })
        .signers([user1])
        .rpc();
    }
    catch (ex) {
      // console.log(ex)
    }
  });

  it('Update admin authority', async () => {
    const globalPda = findGlobalPda();

    const tx = await program.methods.updateSetting()
      .accounts({
        authority: user1.publicKey,
        newAuthority: authority.publicKey,
        vault: vault.publicKey,
        globalAccount: globalPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    const globalAccount = await program.account.globalAccount.fetch(globalPda);
    assert.equal(globalAccount.authority.toBase58(), authority.publicKey.toBase58(), "Authority not updated");
  });

  it('Add/remove whitelist collection', async () => {
    const globalPda = findGlobalPda();

    const collection1 = Keypair.generate();
    await addWhitelist(program, authority, collection1.publicKey);

    let globalAccount = await program.account.globalAccount.fetch(globalPda);
    assert.equal(globalAccount.wlCollections[0].toBase58(), collection1.publicKey.toBase58(), "WL not added");

    try {
      await addWhitelist(program, authority, collection1.publicKey);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("InvalidCollection"), "Transaction should be reverted with InvalidCollection.");
    }

    try {
      const collection2 = Keypair.generate();
      await removeWhitelist(program, authority, collection2.publicKey);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("InvalidCollection"), "Transaction should be reverted with InvalidCollection.");
    }

    await removeWhitelist(program, authority, collection1.publicKey);

    globalAccount = await program.account.globalAccount.fetch(globalPda);
    assert.equal(globalAccount.wlCollections[0].toBase58(), PublicKey.default.toBase58(), "WL not removed");
  });

  /*
  it('Max whitelist collection', async () => {
    const globalPda = findGlobalPda();

    let collection = Keypair.generate();
    for (let i = 0; i < MAX_COLLECTIONS; i++) {
      collection = Keypair.generate();
      await addWhitelist(program, authority, collection.publicKey);
    }

    try {
      const collection = Keypair.generate();
      await addWhitelist(program, authority, collection.publicKey);
      assert(false, "Transaction should be reverted");
    }
    catch (ex) {
      assert(ex.toString().includes("WhitelistFull"), "Transaction should be reverted with WhitelistFull.");
    }
  });
  */

});
