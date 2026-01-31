"use client";

import React from "react";
import { useNetwork } from "./AppWalletProvider";
import { Globe, Server } from "lucide-react";

const NetworkSwitcher = () => {
    const { network, setNetwork } = useNetwork();

    return (
        <button
            onClick={() => setNetwork(network === "devnet" ? "localnet" : "devnet")}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors
                ${network === "devnet" 
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20" 
                    : "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                }
            `}
        >
            {network === "devnet" ? <Globe className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />}
            {network === "devnet" ? "Devnet" : "Localnet"}
        </button>
    );
};

export default NetworkSwitcher;
