import { PublicKey } from "@solana/web3.js"
import BN from "bn.js";

export type StakeInfo = {
    authority: PublicKey;
    pda: PublicKey;
    amount: BN;
    stakedAt: number;
    claimedAt: number;
}