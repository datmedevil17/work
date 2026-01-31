"use client";

import React, { useState } from "react";
import ToolsLayout from "@/components/ToolsLayout";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useNetwork } from "@/components/AppWalletProvider";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Loader2, Coins, Server, Activity, AlertCircle, CheckCircle } from "lucide-react";
import WalletConnect from "@/components/WalletConnect";

export default function NetworkToolsPage() {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { network, setNetwork, endpoint } = useNetwork();
    
    // Airdrop State
    const [airdropAmount, setAirdropAmount] = useState(1);
    const [airdropStatus, setAirdropStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [statusMsg, setStatusMsg] = useState("");

    const requestAirdrop = async () => {
        if (!publicKey) return;
        setAirdropStatus("loading");
        setStatusMsg("");
        
        try {
            const signature = await connection.requestAirdrop(publicKey, airdropAmount * LAMPORTS_PER_SOL);
            const latestBlockhash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({ signature, ...latestBlockhash });
            
            setAirdropStatus("success");
            setStatusMsg(`Successfully airdropped ${airdropAmount} SOL!`);
        } catch (e: any) {
            console.error(e);
            setAirdropStatus("error");
            setStatusMsg(e.message || "Airdrop failed");
        }
    };

    return (
        <ToolsLayout>
            <div className="p-8 max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Network Tools</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">Manage your connection and request test funds.</p>
                    </div>
                    <WalletConnect />
                </div>

                {/* Network Switcher */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Server className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg font-semibold">Connection Settings</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                Active Network
                            </label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setNetwork("devnet")}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors border ${network === "devnet" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}
                                >
                                    Devnet
                                </button>
                                <button 
                                    onClick={() => setNetwork("localnet")}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors border ${network === "localnet" ? "bg-purple-600 text-white border-purple-600" : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}
                                >
                                    Localnet
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                RPC Endpoint
                            </label>
                            <div className="flex items-center px-3 py-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md">
                                <Activity className="w-4 h-4 text-zinc-400 mr-2" />
                                <code className="text-sm text-zinc-900 dark:text-zinc-100 font-mono truncate">
                                    {endpoint}
                                </code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Airdrop Tool */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Coins className="w-5 h-5 text-green-500" />
                         <h2 className="text-lg font-semibold">Faucet / Airdrop</h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                             Request SOL to your connected wallet. Rate limits apply on Devnet.
                        </p>

                        {!publicKey ? (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-md text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Please connect your wallet using the button in the top right to request airdrops.
                            </div>
                        ) : (
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Amount (SOL)
                                    </label>
                                    <input 
                                        type="number"
                                        min="0.1"
                                        max="5"
                                        step="0.1"
                                        value={airdropAmount}
                                        onChange={(e) => setAirdropAmount(parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    />
                                </div>
                                <button
                                    onClick={requestAirdrop}
                                    disabled={airdropStatus === "loading"}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[42px] flex items-center gap-2"
                                >
                                    {airdropStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Request Airdrop
                                </button>
                            </div>
                        )}

                        {statusMsg && (
                            <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${airdropStatus === "success" ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"}`}>
                                {airdropStatus === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {statusMsg}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolsLayout>
    );
}
