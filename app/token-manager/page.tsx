"use client";

import React, { useState } from "react";
import ToolsLayout from "@/components/ToolsLayout";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { 
    TOKEN_PROGRAM_ID, 
    createInitializeMintInstruction, 
    getAssociatedTokenAddress, 
    createAssociatedTokenAccountInstruction, 
    createMintToInstruction, 
    MINT_SIZE 
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { Loader2, Coins, Plus, Copy, Check, ArrowRight } from "lucide-react";
import WalletConnect from "@/components/WalletConnect";

export default function TokenManagerPage() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    
    // Create Token State
    const [decimals, setDecimals] = useState(9);
    const [initialSupply, setInitialSupply] = useState(1000000);
    const [createStatus, setCreateStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [createdTokenMint, setCreatedTokenMint] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const handleCreateToken = async () => {
        if (!publicKey) return;
        setCreateStatus("loading");
        setLogs([]);
        setCreatedTokenMint(null);
        
        try {
            const mintKeypair = Keypair.generate();
            const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

            setLogs(prev => [...prev, "Preparing transaction..."]);

            const transaction = new Transaction();

            // 1. Create Account for Mint
            transaction.add(
                SystemProgram.createAccount({
                    fromPubkey: publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: MINT_SIZE,
                    lamports,
                    programId: TOKEN_PROGRAM_ID,
                })
            );

            // 2. Initialize Mint
            transaction.add(
                createInitializeMintInstruction(
                    mintKeypair.publicKey,
                    decimals,
                    publicKey, // Mint Authority
                    publicKey, // Freeze Authority
                    TOKEN_PROGRAM_ID
                )
            );

            // 3. Create ATA for user
            const associatedToken = await getAssociatedTokenAddress(
                mintKeypair.publicKey,
                publicKey
            );

            transaction.add(
                createAssociatedTokenAccountInstruction(
                    publicKey,
                    associatedToken,
                    publicKey,
                    mintKeypair.publicKey
                )
            );

            // 4. Mint Initial Supply
            if (initialSupply > 0) {
                const amount = BigInt(initialSupply) * BigInt(10 ** decimals);
                transaction.add(
                    createMintToInstruction(
                        mintKeypair.publicKey,
                        associatedToken,
                        publicKey,
                        amount
                    )
                );
            }

            setLogs(prev => [...prev, `Mint Address generated: ${mintKeypair.publicKey.toBase58()}`]);
            setLogs(prev => [...prev, "Sending transaction..."]);

            // Sign with Wallet AND Mint Keypair
            const signature = await sendTransaction(transaction, connection, {
                signers: [mintKeypair]
            });

            setLogs(prev => [...prev, `Tx Sent: ${signature}`]);
            await connection.confirmTransaction(signature, "confirmed");

            setCreateStatus("success");
            setCreatedTokenMint(mintKeypair.publicKey.toBase58());
            setLogs(prev => [...prev, "Token Created Successfully!"]);

        } catch (e: any) {
            console.error(e);
            setCreateStatus("error");
            setLogs(prev => [...prev, `Error: ${e.message}`]);
        }
    };

    return (
        <ToolsLayout>
            <div className="p-8 max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Token Manager</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">Create and manage SPL Tokens.</p>
                    </div>
                    <WalletConnect />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Creator Panel */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-semibold">Create New Token</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Decimals
                                    </label>
                                    <input 
                                        type="number"
                                        min="0"
                                        max="9"
                                        value={decimals}
                                        onChange={(e) => setDecimals(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Standard is 9 (like SOL), USDC is 6.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Initial Supply
                                    </label>
                                    <input 
                                        type="number"
                                        min="0"
                                        value={initialSupply}
                                        onChange={(e) => setInitialSupply(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={handleCreateToken}
                                        disabled={createStatus === "loading" || !publicKey}
                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {createStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                                        Create Token
                                    </button>
                                    {!publicKey && <p className="text-xs text-red-500 mt-2 text-center">Connect wallet to create tokens</p>}
                                </div>
                            </div>
                        </div>

                         {/* Results / Status */}
                         {(createStatus === "success" || logs.length > 0) && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 font-mono text-xs overflow-hidden">
                                <div className="flex items-center gap-2 text-zinc-400 border-b border-zinc-800 pb-2 mb-2">
                                    <ArrowRight className="w-3 h-3" /> Process Log
                                </div>
                                <div className="space-y-1 text-zinc-300 max-h-40 overflow-y-auto">
                                    {logs.map((log, i) => (
                                        <div key={i} className="break-all">{log}</div>
                                    ))}
                                </div>
                                {createdTokenMint && (
                                    <div className="mt-4 pt-4 border-t border-zinc-800">
                                        <div className="text-zinc-500 mb-1">New Token Mint Address:</div>
                                        <div className="flex items-center justify-between bg-black/30 p-2 rounded border border-zinc-800">
                                            <code className="text-green-400">{createdTokenMint}</code>
                                            <button className="text-zinc-500 hover:text-white" onClick={() => navigator.clipboard.writeText(createdTokenMint)}>
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Info Panel / Future List */}
                    <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6">
                             <h3 className="text-blue-800 dark:text-blue-300 font-semibold mb-2">About SPL Tokens</h3>
                             <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                                 SPL (Solana Program Library) Tokens are the standard for fungible (currencies) and non-fungible (NFTs) assets on Solana.
                             </p>
                             <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400 list-disc list-inside">
                                <li>Mint Authority: Control who can mint new tokens.</li>
                                <li>Freeze Authority: Control who can freeze accounts.</li>
                                <li>Decimals: Precision of the token.</li>
                             </ul>
                        </div>
                    </div>
                </div>
            </div>
        </ToolsLayout>
    );
}
