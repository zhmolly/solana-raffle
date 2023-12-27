
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

import { RAFFLE_PROGRAM_ID } from ".";
import { SolanaRaffle } from "../target/types/solana_raffle";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { MPL_TOKEN_METADATA_PROGRAM_ID, TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { MPL_TOKEN_AUTH_RULES_PROGRAM_ID } from "@metaplex-foundation/mpl-token-auth-rules";

const METADATA_PROGRAM_ID = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
const AUTHRULE_PROGRAM_ID = new PublicKey(MPL_TOKEN_AUTH_RULES_PROGRAM_ID);

const PREFIX = "solana-raffle";
const ESCROW_SEED = "escrow";
const RAFFLE_SEED = "raffle";
const USER_SEED = "user";

export const delay = sec => new Promise(resolve => setTimeout(resolve, sec * 1000));

export async function safeAirdrop(connection: Connection, key: PublicKey, amount: number) {

  while (await connection.getBalance(key) < amount * LAMPORTS_PER_SOL) {
    try {
      await connection.confirmTransaction(
        await connection.requestAirdrop(key, LAMPORTS_PER_SOL),
        "confirmed",
      );
    } catch { }
  };
}

export function hexStringToByteArray(hex: string): Uint8Array {
  const byteArray = new Uint8Array(hex.length / 2);
  for (let i = 0; i < byteArray.length; i++) {
    byteArray[i] = parseInt(hex.substr(i * 2, 2), 16);
  }

  return byteArray;
}

export function hexStringToNumArray(hex: string): number[] {
  let byteArray: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    byteArray.push(parseInt(hex.substr(i, 2), 16));
  }

  return byteArray;
}

export function byteArrayToHexString(bytes: number[]): string {
  let uid = "";

  for (const b of bytes) {
    uid += b.toString(16).padStart(2, "0");
  }

  return uid;
}

export const findMetadataPda = (mint: PublicKey): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync([
    Buffer.from('metadata'),
    METADATA_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
  ], METADATA_PROGRAM_ID);

  return pda;
}

export const findEditionPda = (mint: PublicKey): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync([
    Buffer.from('metadata'),
    METADATA_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
    Buffer.from('edition'),
  ], METADATA_PROGRAM_ID);

  return pda;
}

export const findTokenRecordPda = (mint: PublicKey, tokenAccount: PublicKey): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync([
    Buffer.from('metadata'),
    METADATA_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
    Buffer.from('token_record'),
    tokenAccount.toBuffer(),
  ], METADATA_PROGRAM_ID);

  return pda;
}

export const findGlobalPda = (): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync([
    Buffer.from(PREFIX),
  ], RAFFLE_PROGRAM_ID);

  return pda;
};

export const findRafflePda = (idx: BN): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync([
    Buffer.from(PREFIX),
    Buffer.from(RAFFLE_SEED),
    idx.toBuffer('be', 4)
  ], RAFFLE_PROGRAM_ID);

  return pda;
};

export const findEscrowPda = (rafflePda: PublicKey): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync([
    Buffer.from(PREFIX),
    rafflePda.toBuffer(),
    Buffer.from(ESCROW_SEED)
  ], RAFFLE_PROGRAM_ID);

  return pda;
};

export const findUserPda = (uid: string, rafflePda: PublicKey): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync([
    Buffer.from(USER_SEED),
    rafflePda.toBuffer(),
    hexStringToByteArray(uid),
  ], RAFFLE_PROGRAM_ID);

  return pda;
};

export const buyTicket = async (
  program: anchor.Program<SolanaRaffle>,
  uid: string,
  amount: number,
  raffleIdx: number,
  buyer: Keypair,
  authority: Keypair,
  vault: PublicKey,
  splMint: PublicKey,
) => {
  const globalPda = findGlobalPda();
  const rafflePda = findRafflePda(new anchor.BN(raffleIdx));
  const userPda = findUserPda(uid, rafflePda);
  const escrowPda = findEscrowPda(rafflePda);

  const isNative = splMint == NATIVE_MINT;
  if (!isNative) {
    const userAta = getAssociatedTokenAddressSync(splMint, buyer.publicKey);
  }

  return program.methods.buyTicket(raffleIdx, hexStringToNumArray(uid), amount)
    .accounts({
      authority: authority.publicKey,
      buyer: buyer.publicKey,
      globalAccount: globalPda,
      raffleAccount: rafflePda,
      userAccount: userPda,
      splMint,
      userTokenAccount: isNative ? buyer.publicKey : getAssociatedTokenAddressSync(splMint, buyer.publicKey),
      escrowAccount: escrowPda,
      vaultTokenAccount: isNative ? vault : getAssociatedTokenAddressSync(splMint, vault),
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([buyer, authority])
    .rpc();
}

export const createRaffle = async (
  program: anchor.Program<SolanaRaffle>,
  raffleIdx: number,
  creator: Keypair,
  splMint: PublicKey,
  totalSupply: number,
  price: BN,
  startDate: BN,
  endDate: BN,
) => {
  const globalPda = findGlobalPda();
  const rafflePda = findRafflePda(new anchor.BN(raffleIdx));

  return program.methods.createRaffle(raffleIdx, totalSupply, price, startDate, endDate)
    .accounts({
      authority: creator.publicKey,
      globalAccount: globalPda,
      raffleAccount: rafflePda,
      splMint,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY
    })
    .signers([creator])
    .rpc();
}

export const addPrize = async (
  program: anchor.Program<SolanaRaffle>,
  raffleIdx: number,
  creator: Keypair,
  mint: PublicKey,
) => {
  const globalPda = findGlobalPda();
  const rafflePda = findRafflePda(new anchor.BN(raffleIdx));
  const escrowPda = findEscrowPda(rafflePda);
  const tokenAccount = getAssociatedTokenAddressSync(mint, creator.publicKey);
  const metadata = findMetadataPda(mint);
  const edition = findEditionPda(mint);

  return program.methods.addPrize(raffleIdx)
    .accounts({
      authority: creator.publicKey,
      globalAccount: globalPda,
      raffleAccount: rafflePda,
      escrowAccount: escrowPda,
      mint,
      metadata,
      edition,
      tokenAccount,
      metadataProgram: METADATA_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([creator])
    .rpc();
}

export const addPrizePnft = async (
  program: anchor.Program<SolanaRaffle>,
  raffleIdx: number,
  creator: Keypair,
  mint: PublicKey,
) => {
  const globalPda = findGlobalPda();
  const rafflePda = findRafflePda(new anchor.BN(raffleIdx));
  const escrowPda = findEscrowPda(rafflePda);
  const tokenAccount = getAssociatedTokenAddressSync(mint, creator.publicKey);
  const metadata = findMetadataPda(mint);
  const edition = findEditionPda(mint);
  const tokenRecord = findTokenRecordPda(mint, tokenAccount);
  const delegateRecord = findTokenRecordPda(mint, escrowPda);

  return program.methods.addPrizePnft(raffleIdx)
    .accounts({
      authority: creator.publicKey,
      globalAccount: globalPda,
      raffleAccount: rafflePda,
      escrowAccount: escrowPda,
      mint,
      metadata,
      edition,
      tokenAccount,
      tokenRecord,
      delegateRecord,
      metadataProgram: METADATA_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      authorizationRules: RAFFLE_PROGRAM_ID,
      authorizationRulesProgram: AUTHRULE_PROGRAM_ID,
    })
    .signers([creator])
    .rpc();
}

export const revealWinner = async (
  program: anchor.Program<SolanaRaffle>,
  authority: Keypair,
  raffleIdx: number,
) => {
  const globalPda = findGlobalPda();
  const rafflePda = findRafflePda(new anchor.BN(raffleIdx));

  return program.methods.revealWinner(raffleIdx)
    .accounts({
      authority: authority.publicKey,
      globalAccount: globalPda,
      raffleAccount: rafflePda,
      recentSlothashes: anchor.web3.SYSVAR_SLOT_HASHES_PUBKEY,
    })
    .signers([authority])
    .rpc();
}

export const claimPrize = async (
  program: anchor.Program<SolanaRaffle>,
  raffleIdx: number,
  winnerUid: string,
  winner: Keypair,
) => {
  const rafflePda = findRafflePda(new anchor.BN(raffleIdx));
  const userPda = findUserPda(winnerUid, rafflePda);
  const escrowPda = findEscrowPda(rafflePda);

  const raffleAccount = await program.account.raffleAccount.fetch(rafflePda);
  const mint = raffleAccount.mint;
  const creatorAta = getAssociatedTokenAddressSync(mint, raffleAccount.authority);
  const metadata = findMetadataPda(mint);
  const edition = findEditionPda(mint);

  const winnerAta = await getOrCreateAssociatedTokenAccount(program.provider.connection, winner, mint, winner.publicKey);

  return program.methods.claimPrize(raffleIdx, hexStringToNumArray(winnerUid))
    .accounts({
      authority: winner.publicKey,
      raffleAccount: rafflePda,
      userAccount: userPda,
      escrowAccount: escrowPda,
      mint,
      metadata,
      edition,
      creatorTokenAccount: creatorAta,
      winnerTokenAccount: winnerAta.address,
      metadataProgram: METADATA_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([winner])
    .rpc();
}

export const claimPrizePnft = async (
  program: anchor.Program<SolanaRaffle>,
  raffleIdx: number,
  winnerUid: string,
  winner: Keypair,
) => {
  const rafflePda = findRafflePda(new anchor.BN(raffleIdx));
  const escrowPda = findEscrowPda(rafflePda);
  const userPda = findUserPda(winnerUid, rafflePda);

  const raffleAccount = await program.account.raffleAccount.fetch(rafflePda);
  const mint = raffleAccount.mint;
  const metadata = findMetadataPda(mint);
  const edition = findEditionPda(mint);

  const owner = raffleAccount.authority;
  const ownerTokenAccount = getAssociatedTokenAddressSync(mint, owner);
  const destTokenAta = await getOrCreateAssociatedTokenAccount(program.provider.connection, winner, mint, winner.publicKey);
  const destTokenAccount = destTokenAta.address;
  const ownerTokenRecord = findTokenRecordPda(mint, ownerTokenAccount);
  const destTokenRecord = findTokenRecordPda(mint, destTokenAccount);

  return program.methods.claimPrizePnft(raffleIdx, hexStringToNumArray(winnerUid))
    .accounts({
      authority: winner.publicKey,
      raffleAccount: rafflePda,
      escrowAccount: escrowPda,
      userAccount: userPda,
      mint,
      metadata,
      edition,
      owner,
      ownerTokenAccount,
      ownerTokenRecord,
      destTokenAccount,
      destTokenRecord,
      metadataProgram: METADATA_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      authorizationRules: METADATA_PROGRAM_ID,
      authorizationRulesProgram: AUTHRULE_PROGRAM_ID,
    })
    .signers([winner])
    .rpc();
}

export const addWhitelist = async (
  program: anchor.Program<SolanaRaffle>,
  authority: Keypair,
  collection: PublicKey,
) => {
  const globalPda = findGlobalPda();

  return program.methods.addWhitelist(collection)
    .accounts({
      authority: authority.publicKey,
      globalAccount: globalPda,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([authority])
    .rpc();
}

export const removeWhitelist = async (
  program: anchor.Program<SolanaRaffle>,
  authority: Keypair,
  collection: PublicKey,
) => {
  const globalPda = findGlobalPda();

  return program.methods.removeWhitelist(collection)
    .accounts({
      authority: authority.publicKey,
      globalAccount: globalPda,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([authority])
    .rpc();
}

export const mintNft = async (
  connection: Connection,
  wallet: Keypair,
  isCollection: boolean,
  collection: PublicKey | undefined = undefined,
  collectionAuthority: Keypair | undefined = undefined,
  tokenStandard: TokenStandard = TokenStandard.NonFungible
): Promise<PublicKey> => {
  const mplex = new Metaplex(connection)
    .use(keypairIdentity(wallet));

  if (isCollection) {
    const nft = await mplex.nfts()
      .create({
        name: "Test",
        symbol: "TEST",
        uri: "",
        mintAuthority: wallet,
        sellerFeeBasisPoints: 0,
        isCollection: true,
      });
    return nft.mintAddress;
  }
  else {
    const nft = await mplex.nfts()
      .create({
        name: "Test",
        symbol: "TEST",
        uri: "",
        mintAuthority: wallet,
        sellerFeeBasisPoints: 0,
        collection,
        collectionAuthority,
        tokenStandard,
      });
    return nft.mintAddress;
  }
}

export const transferNft = async (
  connection: Connection,
  owner: Keypair,
  receiver: PublicKey,
  mint: PublicKey,
  tokenStandard: TokenStandard
) => {
  const mplex = new Metaplex(connection)
    .use(keypairIdentity(owner));

  await mplex.nfts().transfer({
    nftOrSft: {
      address: mint,
      tokenStandard,
    },
    authority: owner,
    toOwner: receiver,
  })
}