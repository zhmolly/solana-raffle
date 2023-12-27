import { Header } from "@/components/Header"
import { useRaffleProgram } from "@/hooks/useRaffleProgram";
import { findGlobalPda, shortenPublicKey } from "@/utils";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { BN } from "bn.js";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

type InputField = {
  vault: string;
  collection: string;
  newAuthority: string;
};

export default function Home() {

  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useRaffleProgram();
  const [globalState, setGlobalState] = useState<any>();
  const [wlCollections, setWlCollections] = useState<string[]>();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InputField>();
  const vaultStr = watch('vault');
  const newAuthStr = watch('newAuthority');
  const collectionStr = watch('collection');

  const fetchGlobalState = async () => {

    if (program) {
      const globalPda = findGlobalPda();
      const globalAccount = await program.account.globalAccount.fetchNullable(globalPda, 'confirmed');
      setGlobalState(globalAccount);

      if (globalAccount) {
        setValue('newAuthority', globalAccount.authority.toBase58());
        setValue('vault', globalAccount.vault.toBase58());

        const collections = globalAccount.wlCollections
          .filter(t => !t.equals(PublicKey.default))
          .map(t => t.toBase58());
        setWlCollections(collections);
      }
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

  const handleInit = async () => {
    if (!publicKey || !program) {
      toast.error("You need to connect wallet");
      return;
    }

    const toastId = toast.loading("Process initialize...");

    const globalPda = findGlobalPda();

    try {
      const vault = new PublicKey(vaultStr);

      const tx = await program.methods.initialize()
        .accounts({
          authority: publicKey,
          globalAccount: globalPda,
          vault,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          maxRetries: 10,
        });
      console.log(tx);

      fetchGlobalState();
      toast.success("Initialize successed.", {
        id: toastId
      });
    }
    catch (ex) {
      console.log(ex);
      toast.error("Initialize failed.", {
        id: toastId
      });
    }
  }

  const handleUpdate = async () => {
    if (!publicKey || !program) {
      toast.error("You need to connect wallet");
      return;
    }

    const toastId = toast.loading("Process update...");

    const globalPda = findGlobalPda();

    try {
      const vault = new PublicKey(vaultStr);
      const newAuthority = new PublicKey(newAuthStr);

      const tx = await program.methods.updateSetting()
        .accounts({
          authority: publicKey,
          newAuthority,
          globalAccount: globalPda,
          vault,
          systemProgram: SystemProgram.programId,
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          maxRetries: 10,
        });
      console.log(tx);

      toast.success("Update successed.", {
        id: toastId
      });
      fetchGlobalState();
    }
    catch (ex) {
      console.log(ex);
      toast.error("Update failed.", {
        id: toastId
      });
    }
  }

  const handleAddWL = async () => {
    if (!publicKey || !program) {
      toast.error("You need to connect wallet");
      return;
    }

    if (!collectionStr) {
      toast.error("You need to input collection address");
      return;
    }

    const toastId = toast.loading("Process add WL...");

    const globalPda = findGlobalPda();

    try {
      const collection = new PublicKey(collectionStr);

      const tx = await program.methods.addWhitelist(collection)
        .accounts({
          authority: publicKey,
          globalAccount: globalPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          maxRetries: 10,
        });
      console.log(tx);

      setValue('collection', '');
      fetchGlobalState();
      toast.success("Add WL successed.", {
        id: toastId
      });
    }
    catch (ex) {
      console.log(ex);
      toast.error("Add WL failed.", {
        id: toastId
      });
    }
  }

  const handleRemoveWL = async (collectionStr: string) => {
    if (!publicKey || !program) {
      toast.error("You need to connect wallet");
      return;
    }

    if (!collectionStr) {
      toast.error("You need to input collection address");
      return;
    }

    const toastId = toast.loading("Process remove WL...");

    const globalPda = findGlobalPda();

    try {
      const collection = new PublicKey(collectionStr);

      const tx = await program.methods.removeWhitelist(collection)
        .accounts({
          authority: publicKey,
          globalAccount: globalPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc({
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          maxRetries: 10,
        });
      console.log(tx);

      fetchGlobalState();
      toast.success("Remove WL successed.", {
        id: toastId
      });
    }
    catch (ex) {
      console.log(ex);
      toast.error("Remove WL failed.", {
        id: toastId
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-8">

      <Header />

      <div className='flex-1 flex flex-col mx-auto my-8'>

        <h1 className="text-xl text-center mb-8 text-white">
          Admin Configuration
        </h1>

        <form className="flex flex-col gap-4 items-center justify-center w-96 text-black">

          <div className='flex flex-col gap-2 w-full'>
            <label className="text-white">Fee Wallet Address</label>
            <input type="text" className='w-full p-2' {...register("vault")} />
          </div>

          {
            globalState &&
            <div className='flex flex-col gap-2 w-full'>
              <label className="text-white">New Authority</label>
              <input type="text" className='w-full p-2' {...register("newAuthority")} />
            </div>
          }

          {
            globalState ?
              <button type="button" className="w-full bg-green-500 p-2 mt-4"
                onClick={handleUpdate}>
                Update Setting
              </button>
              :
              <button type="button" className="w-full bg-green-500 p-2 mt-4"
                onClick={handleInit}>
                Initialize
              </button>
          }

          {
            globalState &&
            <>

              <h1 className="text-lg text-center mt-8 mb-4 text-white">
                Whitelisted Collections
              </h1>

              {
                wlCollections && <div className="flex flex-col gap-2 w-full">
                  {
                    wlCollections.map(col => <div key={col} className="text-white flex items-center justify-between">

                      <p>
                        {shortenPublicKey(col)}
                      </p>

                      <button type="button" className="bg-red-500 p-2"
                        onClick={() => handleRemoveWL(col)}>
                        Remove WL
                      </button>

                    </div>)
                  }
                </div>
              }

              <div className='flex flex-col gap-2 w-full'>
                <label className="text-white">Collection Address</label>
                <input type="text" className='w-full p-2' {...register("collection")} />
              </div>

              <button type="button" className="w-full bg-green-500 p-2 mt-4"
                onClick={handleAddWL}>
                Add to whitelist
              </button>
            </>
          }

        </form>

      </div>

    </div >
  )
}
