"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { ArrowLeft, Box, Coins, Network, Workflow, Server } from "lucide-react";

export default function ToolsNav() {
    const pathname = usePathname();

    const links = [
        { href: "/token-manager", label: "Token Manager", icon: Coins },
        { href: "/visualizer", label: "Visualizer", icon: Workflow },
        { href: "/builder", label: "Flow Builder", icon: Network }, // Re-using Network for now or another icon
        { href: "/network-tools", label: "Network", icon: Server }, // Changed icon to distinguish
    ];

    return (
        <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1e1e1e] flex flex-col h-screen">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                 <div className="bg-blue-600 p-1.5 rounded-md">
                    <Box className="w-4 h-4 text-white" />
                </div>
                 <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Solana<span className="text-blue-500">Suite</span>
                </span>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                <Link
                    href="/editor"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Editor
                </Link>

                <div className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Tools
                </div>
                
                {links.map((link) => {
                    const Icon = link.icon;
                    // Active if pathname starts with link.href
                    const isActive = pathname?.startsWith(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive 
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {link.label}
                        </Link>
                    )
                })}
            </div>
            
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Devnet Active
                </div>
            </div>
        </div>
    );
}
