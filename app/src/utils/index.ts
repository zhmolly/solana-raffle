import { Connection, PublicKey } from "@solana/web3.js";
import { RAFFLE_PROGRAM_ID } from "./constants";
import * as anchor from "@coral-xyz/anchor";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { MPL_TOKEN_AUTH_RULES_PROGRAM_ID } from "@metaplex-foundation/mpl-token-auth-rules";

export const METADATA_PROGRAM_ID = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
export const AUTHRULE_PROGRAM_ID = new PublicKey(MPL_TOKEN_AUTH_RULES_PROGRAM_ID);

const PREFIX = "solana-raffle";
const ESCROW_SEED = "escrow";
const RAFFLE_SEED = "raffle";
const USER_SEED = "user";

export const shortenPublicKey = (publicKey: string | undefined) => {
  return `${publicKey?.slice(0, 4)}...${publicKey?.slice(-4)}`;
};

export function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ')
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

export const findRafflePda = (idx: anchor.BN): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync([
    Buffer.from(PREFIX),
    Buffer.from(RAFFLE_SEED),
    idx.toArray('be', 4)
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
