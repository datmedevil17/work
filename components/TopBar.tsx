"use client";

import React from "react";
import { NetworkStatus } from "./NetworkStatus";
import WalletConnect from "./WalletConnect";
import { Box, Package } from "lucide-react";
import LibraryDrawer from "./LibraryDrawer";

const TopBar: React.FC = () => {
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

    return (
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1e1e1e] flex items-center justify-between px-4">
             {/* Left: Branding */}
             <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-md">
                    <Box className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Solana<span className="text-blue-500">Studio</span>
                </span>
             </div>

             {/* Right: Environment & Wallet */}
             <div className="flex items-center gap-3">
                 <button 
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded transition-colors"
                 >
                    <Package className="w-3.5 h-3.5" />
                    Libraries
                 </button>
                 
                 <NetworkStatus />
                 <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
                 <WalletConnect />
             </div>

             <LibraryDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
        </header>
    );
};

export default TopBar;
