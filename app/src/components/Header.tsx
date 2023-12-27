import { shortenPublicKey } from "@/utils";
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Link from "next/link"

export const Header = () => {

    const { disconnect, publicKey } = useWallet();
    const { setVisible } = useWalletModal();

    return (

        <div className="flex justify-between gap-8 w-full text-white">

            <div className="flex w-full gap-4">

                <Link href="/">
                    Create Raffle
                </Link>

                <Link href="/buy">
                    Buy Ticket
                </Link>

                <Link href="/manage">
                    Manage Raffle
                </Link>

                <Link href="/admin">
                    Admin Panel
                </Link>

            </div>

            {
                publicKey ?
                    <>
                        <button type="button" className="w-32"
                            onClick={() => setVisible(true)}>
                            {shortenPublicKey(publicKey.toBase58())}
                        </button>
                        <button type="button" className="w-32"
                            onClick={disconnect}>
                            Disconnect
                        </button>
                    </>
                    :
                    <button type="button" className="w-32"
                        onClick={() => setVisible(true)}>
                        Connect Wallet
                    </button>
            }

        </div>
    )

}