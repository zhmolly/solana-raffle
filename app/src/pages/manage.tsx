import { Header } from "@/components/Header"
import { useRaffleProgram } from "@/hooks/useRaffleProgram";
import { AUTHRULE_PROGRAM_ID, METADATA_PROGRAM_ID, byteArrayToHexString, findEditionPda, findEscrowPda, findGlobalPda, findMetadataPda, findRafflePda, findTokenRecordPda, findUserPda, hexStringToNumArray, shortenPublicKey } from "@/utils";
import { RAFFLE_PROGRAM_ID } from "@/utils/constants";
import { Metadata, Metaplex } from "@metaplex-foundation/js";
import { MPL_TOKEN_METADATA_PROGRAM_ID, TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, SYSVAR_RENT_PUBKEY, SYSVAR_SLOT_HASHES_PUBKEY, SystemProgram } from "@solana/web3.js";
import { BN } from "bn.js";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

type InputField = {
  raffle: number;
  prize: string;
};

type NftField = {
  mint: string;
  name: string;
  collection: string;
  tokenStandard: TokenStandard;
}

export default function Home() {

  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useRaffleProgram();

  const [raffleAccounts, setRaffleAccounts] = useState<any[]>();
  const [walletNfts, setWalletNfts] = useState<NftField[]>();
  const [globalState, setGlobalState] = useState<any>();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<InputField>();
  const raffleId = watch('raffle');
  const prizeNft = watch('prize');

  const fetchRaffles = async () => {
    if (program) {
      const raffleAccounts = await program.account.raffleAccount.all();
      setRaffleAccounts(raffleAccounts);
    }
    else {
      setRaffleAccounts([]);
    }

  }

  const fetchNfts = async () => {
    if (publicKey) {
      const mplex = new Metaplex(connection);
      const nfts = (await mplex.nfts().findAllByOwner({
        owner: publicKey
      })).filter(t => t.collection);

      console.log(nfts);

      const walletNfts = nfts.map(t => {
        return {
          collection: t.collection?.address.toBase58() ?? "",
          mint: (t as Metadata).mintAddress.toBase58(),
          name: t.name,
          tokenStandard: t.tokenStandard ?? TokenStandard.NonFungible
        }
      })

      setWalletNfts(walletNfts);
    }
  }

  const fetchGlobalState = async () => {

    if (program) {
      const globalPda = findGlobalPda();
      const globalAccount = await program.account.globalAccount.fetchNullable(globalPda, 'confirmed');
      setGlobalState(globalAccount);
    }
    else {
      setGlobalState(undefined);
    }

  }

  useEffect(() => {
    fetchGlobalState();
  }, [
    program
  ])

  useEffect(() => {
    fetchRaffles();
  }, [
    program,
  ])

  useEffect(() => {
    fetchNfts();
  }, [
    publicKey
  ])


  const handleWithdraw = async () => {
    if (!publicKey || !program) {
      toast.error("You need to connect wallet");
      return;
    }

    const toastId = toast.loading("Process withdraw...");

    try {
      const rafflePda = findRafflePda(new BN(raffleId));
      const raffleAccount = await program.account.raffleAccount.fetch(rafflePda);
      if (raffleAccount.isWithdrawn) {
        toast.error(`Funds already withdrawn.`, {
          id: toastId
        });
        return;
      }
      if (raffleAccount.endDate.toNumber() > Date.now()) {
        toast.error(`Reaffle not ends.`, {
          id: toastId
        });
        return;
      }
      if (!publicKey.equals(raffleAccount.authority)) {
        toast.error(`You need to connect ${shortenPublicKey(raffleAccount.authority.toBase58())}.`, {
          id: toastId
        });
        return;
      }

      const splMint = raffleAccount.splMint || NATIVE_MINT;

      const escrowPda = findEscrowPda(rafflePda);

      const tx = await program.methods.withdrawRaffle(raffleId)
        .accounts({
          authority: publicKey,
          raffleAccount: rafflePda,
          splMint,
          treasuryTokenAccount: splMint.equals(NATIVE_MINT) ? publicKey : getAssociatedTokenAddressSync(splMint, publicKey),
          escrowAccount: escrowPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          maxRetries: 10,
        });
      console.log(tx);

      fetchRaffles();
      toast.success("Withdraw successed.", {
        id: toastId
      });
    }
    catch (ex) {
      console.log(ex);
      toast.error("Withdraw failed.", {
        id: toastId
      });
    }
  }

  const handleAddPrize = async () => {
    if (!publicKey || !program) {
      toast.error("You need to connect wallet");
      return;
    }

    const toastId = toast.loading("Process add prize...");

    try {
      const mint = new PublicKey(prizeNft);

      const nftItem = walletNfts?.filter(t => t.mint == prizeNft)[0];

      const globalPda = findGlobalPda();
      const rafflePda = findRafflePda(new BN(raffleId));
      const raffleAccount = await program.account.raffleAccount.fetch(rafflePda);
      if (raffleAccount.isDeposited) {
        toast.error(`Prize already deposited.`, {
          id: toastId
        });
        return;
      }
      if (!publicKey.equals(raffleAccount.authority)) {
        toast.error(`You need to connect ${shortenPublicKey(raffleAccount.authority.toBase58())}.`, {
          id: toastId
        });
        return;
      }

      const escrowPda = findEscrowPda(rafflePda);
      const tokenAccount = getAssociatedTokenAddressSync(mint, publicKey);
      const metadata = findMetadataPda(mint);
      const edition = findEditionPda(mint);

      if (nftItem?.tokenStandard == TokenStandard.ProgrammableNonFungible) {
        const tokenRecord = findTokenRecordPda(mint, tokenAccount);
        const delegateRecord = findTokenRecordPda(mint, escrowPda);

        const tx = await program.methods.addPrizePnft(raffleId)
          .accounts({
            authority: publicKey,
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
            systemProgram: SystemProgram.programId,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            authorizationRules: RAFFLE_PROGRAM_ID,
            authorizationRulesProgram: AUTHRULE_PROGRAM_ID,
          })
          .rpc({
            commitment: 'confirmed',
            preflightCommitment: 'confirmed',
            maxRetries: 10,
          });
        console.log(tx);
      }
      else {
        const tx = await program.methods.addPrize(raffleId)
          .accounts({
            authority: publicKey,
            globalAccount: globalPda,
            raffleAccount: rafflePda,
            escrowAccount: escrowPda,
            mint,
            metadata,
            edition,
            tokenAccount,
            metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .rpc({
            commitment: 'confirmed',
            preflightCommitment: 'confirmed',
            maxRetries: 10,
          });
        console.log(tx);
      }

      fetchRaffles();
      toast.success("Add prize successed.", {
        id: toastId
      });
    }
    catch (ex) {
      console.log(ex);
      toast.error("Add prize failed.", {
        id: toastId
      });
    }
  }

  const handleRevealWinner = async () => {
    if (!publicKey || !program) {
      toast.error("You need to connect wallet");
      return;
    }

    const toastId = toast.loading("Process reveal winner...");

    try {
      const globalPda = findGlobalPda();
      const rafflePda = findRafflePda(new BN(raffleId));
      const raffleAccount = await program.account.raffleAccount.fetch(rafflePda);
      if (raffleAccount.winnerIdx > 0) {
        toast.error(`Already revealed winner.`, {
          id: toastId
        });
        return;
      }
      if (raffleAccount.endDate.toNumber() > Date.now()) {
        toast.error(`Reaffle not ends.`, {
          id: toastId
        });
        return;
      }
      if (!publicKey.equals(globalState.authority)) {
        toast.error(`You need to connect ${shortenPublicKey(globalState.authority.toBase58())}.`, {
          id: toastId
        });
        return;
      }

      const tx = await program.methods.revealWinner(raffleId)
        .accounts({
          authority: publicKey,
          globalAccount: globalPda,
          raffleAccount: rafflePda,
          recentSlothashes: SYSVAR_SLOT_HASHES_PUBKEY,
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          maxRetries: 10,
        });
      console.log(tx);

      fetchRaffles();
      toast.success("Reveal winner successed.", {
        id: toastId
      });
    }
    catch (ex) {
      console.log(ex);
      toast.error("Reveal winner failed.", {
        id: toastId
      });
    }
  }

  const handleClaimPrize = async () => {
    if (!publicKey || !program) {
      toast.error("You need to connect wallet");
      return;
    }

    const toastId = toast.loading("Process claim prize...");

    try {
      const rafflePda = findRafflePda(new BN(raffleId));
      const escrowPda = findEscrowPda(rafflePda);

      const raffleAccount = await program.account.raffleAccount.fetch(rafflePda);
      if (raffleAccount.winnerIdx == 0) {
        toast.error("Winner not revealed.", {
          id: toastId
        });
        return;
      }
      if (raffleAccount.isClaimed) {
        toast.error("Prize already claimed.", {
          id: toastId
        });
        return;
      }

      const winnerUid = byteArrayToHexString(raffleAccount.tickets[raffleAccount.winnerIdx - 1].uid);
      const userPda = findUserPda(winnerUid, rafflePda);
      const userAccount = await program.account.userAccount.fetch(userPda);
      if (!publicKey.equals(userAccount.authority)) {
        toast.error(`You need to connect ${shortenPublicKey(userAccount.authority.toBase58())}.`, {
          id: toastId
        });
        return;
      }

      const mint = raffleAccount.mint;

      const mplex = new Metaplex(connection);
      const nftItem = await mplex.nfts().findByMint({
        mintAddress: mint
      });

      const creatorAta = getAssociatedTokenAddressSync(mint, raffleAccount.authority);
      const metadata = findMetadataPda(mint);
      const edition = findEditionPda(mint);
      const owner = raffleAccount.authority;
      console.log(nftItem)
      if (nftItem.tokenStandard == TokenStandard.ProgrammableNonFungible) {
        const ownerTokenAccount = getAssociatedTokenAddressSync(mint, owner);
        const destTokenAta = getAssociatedTokenAddressSync(mint, publicKey);
        const ownerTokenRecord = findTokenRecordPda(mint, ownerTokenAccount);
        const destTokenRecord = findTokenRecordPda(mint, destTokenAta);

        const destTokenAccount = await connection.getAccountInfoAndContext(destTokenAta);
        const ataIxs = [];
        if (!destTokenAccount.value) {
          const createAtaIx = createAssociatedTokenAccountInstruction(publicKey, destTokenAta, publicKey, mint);
          ataIxs.push(createAtaIx);
        }

        const tx = await program.methods.claimPrizePnft(raffleId, hexStringToNumArray(winnerUid))
          .accounts({
            authority: publicKey,
            raffleAccount: rafflePda,
            escrowAccount: escrowPda,
            userAccount: userPda,
            mint,
            metadata,
            edition,
            owner,
            ownerTokenAccount,
            ownerTokenRecord,
            destTokenAccount: destTokenAta,
            destTokenRecord,
            metadataProgram: METADATA_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            authorizationRules: METADATA_PROGRAM_ID,
            authorizationRulesProgram: AUTHRULE_PROGRAM_ID,
          })
          .preInstructions(ataIxs)
          .rpc({
            commitment: 'confirmed',
            preflightCommitment: 'confirmed',
            maxRetries: 10,
          });
        console.log(tx);
      }
      else {
        const winnerAta = getAssociatedTokenAddressSync(mint, publicKey);
        const winnerAccount = await connection.getAccountInfoAndContext(winnerAta);
        const ataIxs = [];
        if (!winnerAccount.value) {
          const createAtaIx = createAssociatedTokenAccountInstruction(publicKey, winnerAta, publicKey, mint);
          ataIxs.push(createAtaIx);
        }

        const tx = await program.methods.claimPrize(raffleId, hexStringToNumArray(winnerUid))
          .accounts({
            authority: publicKey,
            raffleAccount: rafflePda,
            userAccount: userPda,
            escrowAccount: escrowPda,
            mint,
            metadata,
            edition,
            creatorTokenAccount: creatorAta,
            winnerTokenAccount: winnerAta,
            metadataProgram: METADATA_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .preInstructions(ataIxs)
          .rpc({
            commitment: 'confirmed',
            preflightCommitment: 'confirmed',
            maxRetries: 10,
          });
        console.log(tx);
      }

      fetchRaffles();
      toast.success("Claim prize successed.", {
        id: toastId
      });
    }
    catch (ex) {
      console.log(ex);
      toast.error("Claim prize failed.", {
        id: toastId
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-8">

      <Header />

      <div className='flex-1 flex flex-col mx-auto my-8'>

        <h1 className="text-xl text-center mb-16 text-white">
          Manage Raffle
        </h1>

        <form className="flex flex-col gap-4 items-center justify-center w-96 text-black">

          <div className='flex flex-col gap-2 w-full'>
            <label className="text-white">Raffle</label>
            <select className='w-full p-2' {...register('raffle')}>
              <option value="-">-- Select --</option>
              {
                raffleAccounts && raffleAccounts.map((pre, idx) =>
                  <option key={idx} value={pre.account.idx}>
                    #{pre.account.idx + 1} - {pre.account.price.toNumber() / LAMPORTS_PER_SOL} SOL ({pre.account.totalSales} / {pre.account.totalSupply}) - {shortenPublicKey(pre.account.authority.toBase58())}
                  </option>
                )
              }
            </select>
          </div>

          <div className='flex flex-col gap-2 w-full'>
            <label className="text-white">Prize NFT</label>
            <select className='w-full p-2' {...register('prize')}>
              <option value="-">-- Select --</option>
              {
                walletNfts && walletNfts.map((nft, idx) =>
                  <option key={idx} value={nft.mint}>
                    {nft.name} - {shortenPublicKey(nft.mint)}
                  </option>
                )
              }
            </select>
          </div>


          <button type="button" className="w-full bg-green-500 p-2 mt-4"
            onClick={handleAddPrize}>
            Add Prize
          </button>

          <button type="button" className="w-full bg-green-500 p-2 mt-4"
            onClick={handleRevealWinner}>
            Reveal Winner
          </button>

          <button type="button" className="w-full bg-green-500 p-2 mt-4"
            onClick={handleClaimPrize}>
            Claim Prize
          </button>

          <button type="button" className="w-full bg-green-500 p-2 mt-4"
            onClick={handleWithdraw}>
            Withdraw
          </button>

        </form>

      </div>

    </div>
  )
}
