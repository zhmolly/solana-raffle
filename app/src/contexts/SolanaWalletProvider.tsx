import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ReactNode, useMemo } from "react";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { SOLANA_RPC } from "@/utils/constants";


require("@solana/wallet-adapter-react-ui/styles.css");

export const SolanaWalletProvider = ({ children }: { children: ReactNode }) => {
    const network = WalletAdapterNetwork.Mainnet;

    // You can also provide a custom RPC endpoint.
    const endpoint = SOLANA_RPC;

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint} config={{
            commitment: 'confirmed',
        }}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
