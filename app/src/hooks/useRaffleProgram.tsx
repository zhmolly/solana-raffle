import { RAFFLE_PROGRAM_ID } from "@/utils/constants";
import { IDL, SolanaRaffle } from "@/utils/solana_raffle";
import { Wallet, AnchorProvider, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair } from "@solana/web3.js";

import { useMemo } from "react";

export const useRaffleProgram = () => {

  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const program = useMemo(() => {
    if (anchorWallet) {
      const provider = new AnchorProvider(
        connection,
        anchorWallet,
        {
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          maxRetries: 10
        }
      );
      return new Program<SolanaRaffle>(IDL, RAFFLE_PROGRAM_ID, provider);
    }

    return undefined;
  }, [connection, anchorWallet]);

  return program;
};
