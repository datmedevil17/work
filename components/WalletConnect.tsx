"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useNetwork } from "./AppWalletProvider";
import dynamic from "next/dynamic";
import { Copy, LogOut, Wallet, CloudRain, Check, Loader2 } from "lucide-react";

// Dynamically import the standard button for fallback/initial connect
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const WalletConnect = () => {
    const { publicKey, disconnect, connected } = useWallet();
    const { connection } = useConnection();
    const { network } = useNetwork();
    
    const [balance, setBalance] = useState<number | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [airdropStatus, setAirdropStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch balance
    useEffect(() => {
        if (!publicKey) return;
        
        const fetchBalance = async () => {
            try {
                const bal = await connection.getBalance(publicKey);
                setBalance(bal / LAMPORTS_PER_SOL);
            } catch (e: any) {
                // Handle common network errors gracefully
                 const msg = e?.message || e?.toString();
                 if (msg.includes('403') || msg.includes('Failed to fetch') || msg.includes('Network request failed')) {
                     // 403: Rate limited / Blocked
                     // Failed to fetch: Network error / RPC down
                     // Don't spam console
                 } else {
                    console.error("Balance fetch failed", e);
                 }
                 setBalance(null);
            }
        };

        fetchBalance();
        const id = setInterval(fetchBalance, 5000); // Poll balance
        return () => clearInterval(id);
    }, [publicKey, connection, airdropStatus]); // Refetch after airdrop

    // Handle outside click to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const copyAddress = () => {
        if (publicKey) {
            navigator.clipboard.writeText(publicKey.toBase58());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const requestAirdrop = async () => {
        if (!publicKey) return;
        setAirdropStatus("loading");
        try {
            const sig = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(sig);
            setAirdropStatus("success");
            setTimeout(() => setAirdropStatus("idle"), 3000);
        } catch (e) {
            console.error(e);
            setAirdropStatus("error");
            setTimeout(() => setAirdropStatus("idle"), 3000);
        }
    };

    if (!connected) {
        return <WalletMultiButton style={{ height: '32px', fontSize: '13px', padding: '0 16px', borderRadius: '6px' }} />;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Custom Connected Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-[#252526] hover:bg-[#2d2d2d] border border-zinc-700 rounded-md px-3 py-1.5 transition-colors"
            >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {publicKey?.toBase58().slice(0, 1)}
                </div>
                <div className="text-xs text-zinc-300 font-medium">
                    {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
                </div>
                {balance !== null && (
                    <div className="ml-1 pl-2 border-l border-zinc-700 text-xs text-zinc-400 font-mono">
                        {balance.toFixed(2)} SOL
                    </div>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[#1e1e1e] border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
                        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                            <span>Active Wallet</span>
                            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded">{network}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800">
                             <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0" />
                             <div className="truncate text-xs font-mono text-zinc-300 flex-1">
                                 {publicKey?.toBase58()}
                             </div>
                             <button onClick={copyAddress} className="text-zinc-500 hover:text-white transition-colors">
                                 {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                             </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2 space-y-1">
                        <button 
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                            onClick={requestAirdrop}
                            disabled={airdropStatus === 'loading'}
                        >
                            {airdropStatus === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 
                             airdropStatus === 'success' ? <Check className="w-3.5 h-3.5 text-green-500" /> :
                             airdropStatus === 'error' ? <LogOut className="w-3.5 h-3.5 text-red-500" /> :
                             <CloudRain className="w-3.5 h-3.5" />}
                            <span>
                                {airdropStatus === 'loading' ? 'Requesting...' : 
                                 airdropStatus === 'success' ? 'Airdropped 2 SOL!' : 
                                 airdropStatus === 'error' ? 'Airdrop Failed' :
                                 'Airdrop 2 SOL'}
                            </span>
                        </button>

                        <button 
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            onClick={() => {
                                disconnect();
                                setIsOpen(false);
                            }}
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Disconnect</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletConnect;
