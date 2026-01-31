"use client";

import React, { useState, useEffect } from "react";
import { Package, Plus, Check, Loader2, X } from "lucide-react";

interface Library {
    name: string;
    description: string;
    category: "Tokens" | "Oracles" | "Scaling" | "Cross-Chain" | "Automation" | "Testing" | "Utils" | "Security/Compression";
    crate: string;
    features?: string;
}

const LIBRARIES: Library[] = [
    // Tokens
    { name: "SPL Token", description: "Standard token logic", category: "Tokens", crate: "spl-token" },
    { name: "SPL Token 2022", description: "Extensions (hooks, fees)", category: "Tokens", crate: "spl-token-2022" },
    { name: "SPL Assoc. Account", description: "ATA management", category: "Tokens", crate: "spl-associated-token-account" },
    { name: "Metaplex Metadata", description: "NFT Metadata", category: "Tokens", crate: "mpl-token-metadata" },
    { name: "Metaplex Core", description: "Next-gen NFT Standard", category: "Tokens", crate: "mpl-core" },
    
    // Oracles
    { name: "Pyth Solana", description: "Hi-fi price feeds", category: "Oracles", crate: "pyth-sdk-solana" },
    { name: "Switchboard", description: "Oracles + VRF", category: "Oracles", crate: "switchboard-solana" },

    // Scaling
    { name: "MagicBlock", description: "Ephemeral Rollups", category: "Scaling", crate: "magicblock-sdk" },

    // Cross-Chain
    { name: "Wormhole", description: "Cross-chain VAAs", category: "Cross-Chain", crate: "wormhole-sdk" },
    { name: "LayerZero", description: "Omnichain messaging", category: "Cross-Chain", crate: "layerzero-sdk" },
    
    // Automation
    { name: "Clockwork", description: "On-chain crons", category: "Automation", crate: "clockwork-sdk" },

    // Testing
    { name: "Bankrun", description: "Fastest local validator", category: "Testing", crate: "bankrun" },
    { name: "Program Test", description: "Official test framework", category: "Testing", crate: "solana-program-test" },

    // Security/Compression
    { name: "Light Protocol", description: "ZK & Compression", category: "Security/Compression", crate: "light-protocol" },
    { name: "Account Compression", description: "Merkle trees", category: "Security/Compression", crate: "solana-account-compression" },

    // Utils
    { name: "Borsh", description: "Serialization", category: "Utils", crate: "borsh" },
    { name: "Bytemuck", description: "Zero-copy structs", category: "Utils", crate: "bytemuck" },
    { name: "Anyhow", description: "Error handling", category: "Utils", crate: "anyhow" },
    { name: "ThisError", description: "Error derivation", category: "Utils", crate: "thiserror" },
];

const CATEGORIES = Array.from(new Set(LIBRARIES.map(l => l.category)));

interface LibraryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const LibraryDrawer: React.FC<LibraryDrawerProps> = ({ isOpen, onClose }) => {
    const [installed, setInstalled] = useState<string[]>([]);
    const [installing, setInstalling] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("Tokens");

    useEffect(() => {
        if (isOpen) {
            fetchDependencies();
        }
    }, [isOpen]);

    const fetchDependencies = async () => {
        try {
            const res = await fetch("/api/dependency");
            const data = await res.json();
            if (data.dependencies) {
                setInstalled(data.dependencies);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const installLibrary = async (lib: Library) => {
        setInstalling(lib.crate);
        try {
            const res = await fetch("/api/dependency", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ crate: lib.crate, features: lib.features })
            });
            const data = await res.json();
            if (data.status === "success") {
                await fetchDependencies(); // Refresh list
            } else {
                alert("Failed to install: " + data.message);
            }
        } catch (e) {
             console.error("Install failed", e);
        } finally {
            setInstalling(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="w-[500px] h-full bg-[#1e1e1e] border-l border-zinc-800 shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#252526]">
                    <div className="flex items-center gap-2 text-zinc-100 font-semibold">
                        <Package className="w-5 h-5 text-blue-500" />
                        <span>Library Marketplace</span>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar Categories */}
                    <div className="w-40 bg-[#1e1e1e] border-r border-zinc-800 overflow-y-auto">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`w-full text-left px-4 py-3 text-xs font-medium border-l-2 transition-colors
                                    ${activeCategory === cat 
                                        ? "bg-zinc-800/50 text-blue-400 border-blue-500" 
                                        : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 bg-[#1e1e1e]">
                        <div className="space-y-3">
                            {LIBRARIES.filter(l => l.category === activeCategory).map(lib => {
                                const isInstalled = installed.includes(lib.crate);
                                const isBusy = installing === lib.crate;

                                return (
                                    <div key={lib.crate} className="flex items-center justify-between p-3 rounded border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors">
                                        <div>
                                            <div className="text-sm font-semibold text-zinc-200">{lib.name}</div>
                                            <div className="text-xs text-zinc-500 mt-0.5">{lib.description}</div>
                                            <div className="text-[10px] font-mono text-zinc-600 mt-1">{lib.crate}</div>
                                        </div>

                                        <button
                                            onClick={() => !isInstalled && installLibrary(lib)}
                                            disabled={isInstalled || isBusy}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all
                                                ${isInstalled 
                                                    ? "bg-green-900/20 text-green-500 border border-green-900/50 cursor-default" 
                                                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                                                }
                                                ${isBusy ? "opacity-70 cursor-wait" : ""}
                                            `}
                                        >
                                            {isBusy ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : isInstalled ? (
                                                <>
                                                    <Check className="w-3 h-3" /> Installed
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-3 h-3" /> Add
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibraryDrawer;
