"use client";

import React, { useState, useEffect } from "react";
import { Play, Square, RefreshCw, Activity } from "lucide-react";

import { useNetwork } from "@/components/AppWalletProvider";

const ValidatorControl: React.FC = () => {
    const { network } = useNetwork();
    const [status, setStatus] = useState<"stopped" | "running" | "starting" | "stopping">("stopped");
    
    // Poll status
    useEffect(() => {
        if (network !== "localnet") {
            return;
        }

        const checkStatus = async () => {
            try {
                const res = await fetch("/api/validator");
                const data = await res.json();
                if (data.status === "running") setStatus("running");
                else if (data.status === "stopped") setStatus("stopped");
            } catch (e) {
                // error
            }
        };
        
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const toggleValidator = async () => {
        if (status === "running") {
            setStatus("stopping");
            await fetch("/api/validator", { 
                method: "POST", 
                body: JSON.stringify({ action: "stop" }) 
            });
            setTimeout(() => setStatus("stopped"), 1000); // Optimistic UI
        } else {
            setStatus("starting");
            await fetch("/api/validator", { 
                method: "POST", 
                body: JSON.stringify({ action: "start" }) 
            });
            setTimeout(() => setStatus("running"), 2000); // Optimistic UI
        }
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border border-zinc-700 rounded-md">
            <div className="flex items-center gap-2 mr-2">
                 <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                 <span className="text-xs text-zinc-300 font-medium hidden md:inline">
                    Localnet
                 </span>
            </div>
            
            <button 
                onClick={toggleValidator}
                disabled={status === "starting" || status === "stopping"}
                className="p-1 hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-white disabled:opacity-50"
                title={status === "running" ? "Stop Validator" : "Start Validator"}
            >
                {status === "running" ? <Square className="w-3.5 h-3.5" fill="currentColor" /> : <Play className="w-3.5 h-3.5" fill="currentColor" />}
            </button>
            
             <button 
                onClick={() => {
                     // TODO: Implement Reset
                }}
                disabled={status !== "running"}
                className="p-1 hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-white disabled:opacity-50"
                title="Reset Ledger (Coming Soon)"
            >
                <RefreshCw className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};

export default ValidatorControl;
