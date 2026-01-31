"use client";

import React, { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useNetwork } from "./AppWalletProvider";
import { Activity, Wifi, WifiOff, Clock } from "lucide-react";

export const NetworkStatus = () => {
    const { connection } = useConnection();
    const { network, endpoint } = useNetwork();
    const [slot, setSlot] = useState<number>(0);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [latency, setLatency] = useState<number>(0);

    useEffect(() => {
        let alive = true;
        const interval = setInterval(async () => {
            if (!alive) return;
            const start = performance.now();
            try {
                // Determine connection health and slot
                // We use getSlot for a lightweight check
                const currentSlot = await connection.getSlot();
                setSlot(currentSlot);
                setIsConnected(true);
                setLatency(Math.round(performance.now() - start));
            } catch (e) {
                setIsConnected(false);
            }
        }, 5000); // 5s polling for Devnet

        return () => {
             alive = false;
             clearInterval(interval);
        };
    }, [connection]);

    return (
        <div className="group relative flex items-center gap-2 px-3 py-1.5 bg-[#252526] border border-zinc-700 rounded-md cursor-help">
             {/* Status Dot */}
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? (network === 'localnet' ? 'bg-green-500' : 'bg-purple-500') : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`} />
            
            {/* Text Label */}
            <div className="flex flex-col leading-none">
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                    {isConnected ? network : "Disconnected"}
                </span>
                {isConnected && (
                    <span className="text-[10px] text-zinc-500 font-mono">
                         #{slot.toLocaleString()}
                    </span>
                )}
            </div>

            {/* Hover Tooltip */}
            <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-zinc-900 border border-zinc-700 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-300 border-b border-zinc-800 pb-1">
                    <Activity className="w-3 h-3" /> Environment Status
                </div>
                <div className="space-y-1.5 text-[10px] text-zinc-400 font-mono">
                    <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={isConnected ? "text-green-400" : "text-red-400"}>
                            {isConnected ? "Healthy" : "Unreachable"}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>RPC Endpoint:</span>
                        <span className="truncate max-w-[120px]" title={endpoint}>{endpoint}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Latency:</span>
                        <span>{latency}ms</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Current Slot:</span>
                        <span>{slot.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
