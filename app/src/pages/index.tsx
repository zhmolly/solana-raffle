import { Header } from "@/components/Header"
import { useRaffleProgram } from "@/hooks/useRaffleProgram";
import { findGlobalPda, findRafflePda } from "@/utils";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import moment from "moment";
import { NATIVE_MINT } from "@solana/spl-token";

type InputField = {
  totalSupply: number;
  price: number;
  splMint: string;
  startDate: string;
  endDate: string;
};

export default function Home() {

  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useRaffleProgram();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InputField>({
    defaultValues: {
      splMint: NATIVE_MINT.toBase58(),
    }
  });

  const onSubmit = async (data: InputField) => {
    if (!publicKey || !program) {
      toast.error("You need to connect wallet");
      return;
    }

    const toastId = toast.loading("Process regster...");

    const globalPda = findGlobalPda();
    const globalAccount = await program.account.globalAccount.fetchNullable(globalPda, 'confirmed');
    if (!globalAccount) {
      toast.error("Admin needs to initialize", {
        id: toastId
      });
      return;
    }

    const raffleIdx = globalAccount.totalRaffles;
    console.log(raffleIdx)
    const rafflePda = findRafflePda(new BN(raffleIdx));
    const splMint = new PublicKey(data.splMint);

    try {
      const startDate = Math.floor(moment(data.startDate).toDate().getTime() / 1000);
      const endDate = Math.floor(moment(data.endDate).toDate().getTime() / 1000);
      const price = new BN(data.price * LAMPORTS_PER_SOL);

      const tx = await program.methods.createRaffle(raffleIdx, data.totalSupply, price, new BN(startDate), new BN(endDate))
        .accounts({
          authority: publicKey,
          globalAccount: globalPda,
          raffleAccount: rafflePda,
          splMint,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          maxRetries: 10,
        });
      console.log(tx);

      toast.success("Raffle register successed.", {
        id: toastId
      });
      reset();
    }
    catch (ex) {
      console.log(ex);
      toast.error("Raffle register failed.", {
        id: toastId
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-8">

      <Header />

      <div className='flex-1 flex flex-col mx-auto my-8'>

        <h1 className="text-xl text-center mb-16 text-white">
          Create Raffle
        </h1>

        <form className="flex flex-col gap-4 items-center justify-center w-96 text-black"
          onSubmit={handleSubmit(onSubmit)}>

          <div className='flex flex-col gap-2 w-full'>
            <label className="text-white">Total Supply</label>
            <input type="number" className='w-full p-2' {...register("totalSupply")} />
          </div>

          <div className='flex flex-col gap-2 w-full'>
            <label className="text-white">Price</label>
            <input type="text" className='w-full p-2' {...register("price")} />
          </div>

          <div className='flex flex-col gap-2 w-full'>
            <label className="text-white">Token Mint</label>
            <input type="text" className='w-full p-2' {...register("splMint")} />
          </div>

          <div className='flex flex-col gap-2 w-full'>
            <label className="text-white">Start Date</label>
            <input type="text" className='w-full p-2' {...register("startDate")} />
          </div>

          <div className='flex flex-col gap-2 w-full'>
            <label className="text-white">End Date</label>
            <input type="text" className='w-full p-2' {...register("endDate")} />
          </div>

          <button type="submit" className="w-full bg-green-500 p-2 mt-4">
            Register
          </button>

        </form>

      </div>

    </div>
  )
}
