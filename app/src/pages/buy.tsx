import { Header } from "@/components/Header"
import { useRaffleProgram } from "@/hooks/useRaffleProgram";
import { findEscrowPda, findGlobalPda, findRafflePda, findUserPda, hexStringToNumArray, shortenPublicKey } from "@/utils";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, SYSVAR_RENT_PUBKEY, SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import axios from "axios";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { NATIVE_MINT, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

type InputField = {
  raffle: number;
  uid: string;
  amount: number;
};

export default function Home() {

  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const program = useRaffleProgram();

  const [raffleAccounts, setRaffleAccounts] = useState<any[]>();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<InputField>();

  const raffleId = watch('raffle');
  const amount = watch('amount');

  const fetchRaffles = async () => {

    if (program) {
      const raffleAccounts = await program.account.raffleAccount.all();
      const now = Math.floor(Date.now() / 1000);
      const validAccounts = raffleAccounts.filter(m => m.account.endDate.toNumber() > now);
      console.log(validAccounts)
      setRaffleAccounts(validAccounts);
    }
    else {
      setRaffleAccounts([]);
    }

  }

  useEffect(() => {
    fetchRaffles();
  }, [
    program
  ])

  const onSubmit = async (input: InputField) => {
    if (!publicKey || !program || !signTransaction) {
      toast.error("You need to connect wallet");
      return;
    }

    const toastId = toast.loading("Process buy...");

    try {
      const globalPda = findGlobalPda();
      const globalAccount = await program.account.globalAccount.fetch(globalPda);

      const uid = input.uid;
      const rafflePda = findRafflePda(new BN(raffleId));
      const raffleAccount = await program.account.raffleAccount.fetch(rafflePda);
      if (!raffleAccount.isDeposited) {
        toast.error("Prize not deposited yet.", {
          id: toastId
        });
        return;
      }

      const splMint = raffleAccount.splMint || NATIVE_MINT;
      const isNative = splMint.equals(NATIVE_MINT);

      const userPda = findUserPda(uid, rafflePda);
      const escrowPda = findEscrowPda(rafflePda);

      const tx = await program.methods.buyTicket(raffleId, hexStringToNumArray(uid), amount)
        .accounts({
          authority: globalAccount.authority,
          buyer: publicKey,
          globalAccount: globalPda,
          raffleAccount: rafflePda,
          userAccount: userPda,
          splMint,
          userTokenAccount: isNative ? publicKey : getAssociatedTokenAddressSync(splMint, publicKey),
          escrowAccount: escrowPda,
          vaultTokenAccount: isNative ? globalAccount.vault : getAssociatedTokenAddressSync(splMint, globalAccount.vault),
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .transaction();

      const latestestBlockhash = await connection.getLatestBlockhash();
      tx.recentBlockhash = latestestBlockhash.blockhash;
      tx.feePayer = publicKey;

      const serializedTx = tx.serialize({
        requireAllSignatures: false
      });
      const { data } = await axios.post('/api/sign-buy-tx', {
        serializedTx: bs58.encode(serializedTx)
      })
      const signedTx = Transaction.from(bs58.decode(data.tx));
      const walletSignedTx = await signTransaction(signedTx);
      const signature = await connection.sendRawTransaction(walletSignedTx.serialize(), {
        preflightCommitment: 'confirmed',
        maxRetries: 10
      })

      toast.success(`Buy ticket successed - ${shortenPublicKey(signature)}`, {
        id: toastId
      });
      reset();
      fetchRaffles();
    }
    catch (ex: any) {
      console.log(ex);
      toast.error(`Buy ticket failed - ${ex.toString()}`, {
        id: toastId
      });
    }

  }

  return (
    <div className="flex min-h-screen flex-col items-center p-8">

      <Header />

      <div className='flex-1 flex flex-col mx-auto my-8'>

        <h1 className="text-xl text-center mb-16 text-white">
          Buy Ticket
        </h1>

        <form className="flex flex-col gap-4 items-center justify-center w-96 text-black"
          onSubmit={handleSubmit(onSubmit)}>

          <div className='flex flex-col gap-2 w-full'>
            <label className="text-white">Raffle</label>
            <select className='w-full p-2' {...register('raffle')}>
              <option value="-">-- Select --</option>
              {
                raffleAccounts && raffleAccounts.map((pre, idx) =>
                  <option key={idx} value={pre.account.idx}>
                    #{pre.account.idx + 1} - {shortenPublicKey(pre.account.authority.toBase58())} - {pre.account.price.toNumber() / LAMPORTS_PER_SOL} SOL ({pre.account.totalSales} / {pre.account.totalSupply})
                  </option>
                )
              }

            </select>
          </div>

          <div className='flex flex-col gap-2 w-full'>
            <label className="text-white">UserId</label>
            <input type="text" className='w-full p-2' {...register("uid")} />
          </div>

          <div className='flex flex-col gap-2 w-full'>
            <label className="text-white">Amount</label>
            <input type="number" className='w-full p-2' {...register("amount")} />
          </div>

          <button type="submit" className="w-full bg-green-500 p-2 mt-4">
            Purchase
          </button>

        </form>

      </div>

    </div>
  )
}
