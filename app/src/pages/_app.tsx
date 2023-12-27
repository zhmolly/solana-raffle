import Head from "next/head";
import type { AppProps } from "next/app";
import "../styles/globals.css";
import { SolanaWalletProvider } from "@/contexts/SolanaWalletProvider";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps: { ...pageProps } }: AppProps<{}>) {

  return (
    <>
      <Head>
        <title>Solana Raffle</title>
        <meta
          name="description"
          content="Solana Raffle website."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="">
        <SolanaWalletProvider>
          <Component {...pageProps} />
        </SolanaWalletProvider>

        <Toaster />
      </main>

    </>
  );
}
