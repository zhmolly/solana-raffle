import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { Keypair, PublicKey } from '@solana/web3.js';

import * as dotenv from 'dotenv';
dotenv.config();

export const RPC_URL = process.env.RPC_URL ?? "";
export const SIGNER = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVKEY ?? ""));
export const RAFFLE_PROGRAM_ID = new PublicKey(process.env.RAFFLE_PROGRAM_ID ?? "");

export const ID_LENGTH = 12;
export const FEE_PERCENTAGE = 100;
export const BASIS_POINTS = 10000;
export const MAX_TICKET_AMOUNT = 10000;
export const MAX_TICKET_PERCENT = 4000;
export const MAX_COLLECTIONS = 10;