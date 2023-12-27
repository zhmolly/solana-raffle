import * as anchor from "@coral-xyz/anchor";

import AUTHORITY_WALLET from './keypairs/authority.json';
import VAULT_WALLET from './keypairs/vault.json';
import USER1_WALLET from './keypairs/user1.json';
import USER2_WALLET from './keypairs/user2.json'
import USDC_MINT from './keypairs/usdc-mint.json';
import PAYER_WALLET from './keypairs/payer.json';
import { delay, safeAirdrop } from "../utils";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { NATIVE_MINT, mintToChecked, getOrCreateAssociatedTokenAccount, getAccount } from "@solana/spl-token";
import { MintLayout, TOKEN_PROGRAM_ID, createInitializeMintInstruction } from "@solana/spl-token";

describe("initialize environment", () => {

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const vault = anchor.web3.Keypair.fromSecretKey(Buffer.from(VAULT_WALLET));
  const authority = anchor.web3.Keypair.fromSecretKey(Buffer.from(AUTHORITY_WALLET));
  const payer = anchor.web3.Keypair.fromSecretKey(Buffer.from(PAYER_WALLET));
  const usdcMint = anchor.web3.Keypair.fromSecretKey(Buffer.from(USDC_MINT));
  const user1 = anchor.web3.Keypair.fromSecretKey(Buffer.from(USER1_WALLET));
  const user2 = anchor.web3.Keypair.fromSecretKey(Buffer.from(USER2_WALLET));

  it('Prepare test wallets', async () => {
    // Airdrop sol to the test users
    await safeAirdrop(provider.connection, vault.publicKey, 1);
    await safeAirdrop(provider.connection, authority.publicKey, 1);
    await safeAirdrop(provider.connection, payer.publicKey, 1);
    await safeAirdrop(provider.connection, user1.publicKey, 1);
    await safeAirdrop(provider.connection, user2.publicKey, 1);
  });

  it('Prepare mint tokens', async () => {
    let accountRentExempt = await provider.connection.getMinimumBalanceForRentExemption(
      MintLayout.span
    );

    const tx = new Transaction();
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: usdcMint.publicKey,
        lamports: accountRentExempt,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
      })
    );
    tx.add(
      createInitializeMintInstruction(
        usdcMint.publicKey,
        9,
        authority.publicKey,
        authority.publicKey
      )
    );

    const hash = await provider.sendAndConfirm(
      tx,
      [authority, usdcMint],
      { commitment: 'confirmed' }
    );

    const vaultAta = (await getOrCreateAssociatedTokenAccount(provider.connection, authority, usdcMint.publicKey, vault.publicKey)).address;
  });
});
