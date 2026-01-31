"use client";

import React, { useMemo, useState, createContext, useContext } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

type Network = "devnet" | "localnet";

interface NetworkContextType {
    network: Network;
    setNetwork: (n: Network) => void;
    endpoint: string;
}

const NetworkContext = createContext<NetworkContextType>({
    network: "devnet",
    setNetwork: () => {}, // No-op
    endpoint: clusterApiUrl("devnet")
});

export const useNetwork = () => useContext(NetworkContext);

export default function AppWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [network, setNetwork] = useState<Network>("devnet");

  const endpoint = useMemo(() => {
      if (network === "localnet") {
          return "http://127.0.0.1:8899";
      }
      return clusterApiUrl(WalletAdapterNetwork.Devnet);
  }, [network]);

  const wallets = useMemo(
    () => [],
    [],
  );

  return (
    <NetworkContext.Provider value={{ network, setNetwork, endpoint }}>
        <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
        </ConnectionProvider>
    </NetworkContext.Provider>
  );
}
