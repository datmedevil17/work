"use client";

import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, Idl, web3, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Play, Loader2, Database, Key } from "lucide-react";
import LogViewer from "@/components/LogViewer";
import InstructionQueue from "@/components/InstructionQueue";

interface InteractionPanelProps {
    programId: string | null;
}

const InteractionPanel: React.FC<InteractionPanelProps> = ({ programId }) => {
    const { connection } = useConnection();
    const wallet = useWallet();
    
    const [idl, setIdl] = useState<Idl | null>(null);
    const [selectedIx, setSelectedIx] = useState<any>(null);
    const [args, setArgs] = useState<Record<string, string>>({});
    const [accounts, setAccounts] = useState<Record<string, string>>({});
    const [logs, setLogs] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<"instruction" | "inspector" | "pda">("instruction");
    
    // PDA State
    const [pdaSeeds, setPdaSeeds] = useState<{type: "string" | "publicKey", value: string}[]>([{type: "string", value: ""}]);
    const [pdaResult, setPdaResult] = useState<{address: string, bump: number} | null>(null);
    const [pdaError, setPdaError] = useState<string | null>(null);

    // Inspector State
    const [inspectorType, setInspectorType] = useState<string>("");
    const [inspectorAddress, setInspectorAddress] = useState<string>("");
    const [inspectorData, setInspectorData] = useState<any>(null);
    const [inspectorLoading, setInspectorLoading] = useState(false);

    // Instruction State
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    // Transaction Builder State
    const [queue, setQueue] = useState<any[]>([]);
    const [txSettings, setTxSettings] = useState({
        priorityFee: 0, // micro-lamports
        computeUnits: 200000,
        skipPreflight: false
    });

    const addToQueue = () => {
        if (!selectedIx) return;
        
        // Serialize args for display
        const displayArgs = selectedIx.args.map((arg: any) => {
            return args[arg.name] || "";
        });

        const queuesIx = {
            id: Math.random().toString(36).substr(2, 9),
            name: selectedIx.name,
            ixDef: selectedIx,
            args: { ...args },
            accounts: { ...accounts },
            displayArgs
        };

        setQueue([...queue, queuesIx]);
    };

    const removeFromQueue = (id: string) => {
        setQueue(queue.filter(q => q.id !== id));
    };

    const executeTransaction = async () => {
        if (!idl || !wallet.publicKey || !programId) return;

        setStatus("loading");
        setLogs([]);

        try {
            const provider = new AnchorProvider(
                connection,
                wallet as any,
                { 
                    preflightCommitment: "confirmed",
                    skipPreflight: txSettings.skipPreflight
                }
            );

            const modifiedIdl = { ...idl, address: programId };
            const program = new Program(modifiedIdl as Idl, provider);
            
            const transaction = new web3.Transaction();

            // 1. Add Compute Budget Instructions if needed
            if (txSettings.priorityFee > 0 || txSettings.computeUnits !== 200000) {
                 transaction.add(
                    web3.ComputeBudgetProgram.setComputeUnitLimit({ units: txSettings.computeUnits })
                 );
                 if (txSettings.priorityFee > 0) {
                     transaction.add(
                        web3.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: txSettings.priorityFee })
                     );
                 }
            }

            // 2. Build Instructions
            const instructionsToProcess = queue.length > 0 ? queue : [{
                ixDef: selectedIx,
                args: args,
                accounts: accounts
            }];

            if (!instructionsToProcess[0].ixDef) return;

            for (const item of instructionsToProcess) {
                // Format args
                const methodArgs = item.ixDef.args.map((arg: any) => {
                    const val = item.args[arg.name];
                    if (arg.type === "u64" || arg.type === "u128" || arg.type === "i64") {
                        return new BN(val);
                    }
                    if (arg.type === "publicKey") {
                        return new PublicKey(val);
                    }
                    return val;
                });

                // Format accounts
                const accountPubkeys: Record<string, PublicKey> = {};
                item.ixDef.accounts.forEach((acc: any) => {
                    const accVal = item.accounts[acc.name];
                    if (accVal) {
                        accountPubkeys[acc.name] = new PublicKey(accVal);
                    } else if (acc.name === "user" || acc.name === "authority" || acc.name === "payer") {
                        if (wallet.publicKey) accountPubkeys[acc.name] = wallet.publicKey;
                    } else if (acc.name === "systemProgram") {
                        accountPubkeys[acc.name] = web3.SystemProgram.programId;
                    }
                });

                // Get Instruction
                // @ts-ignore
                const ix = await program.methods[item.ixDef.name](...methodArgs)
                    .accounts(accountPubkeys)
                    .instruction();
                
                transaction.add(ix);
            }

            // 3. Send and Confirm
            const tx = await provider.sendAndConfirm(transaction);

            setLogs(prev => [...prev, `Success! Tx: ${tx}`]);
            setStatus("success");
            if (queue.length > 0) setQueue([]); // Clear queue on success

        } catch (e: any) {
             console.error(e);
             setLogs(prev => [...prev, `Error: ${e.message}`]);
             setStatus("error");
        }
    };

    useEffect(() => {
        const fetchIdl = async () => {
            try {
                const res = await fetch("/api/idl");
                if (res.ok) {
                    const data = await res.json();
                    setIdl(data);
                }
            } catch (e) {
                console.error("Failed to fetch IDL", e);
            }
        };
        fetchIdl();
    }, []);

    const handleArgChange = (name: string, value: string) => {
        setArgs(prev => ({ ...prev, [name]: value }));
    };

    const handleAccountChange = (name: string, value: string) => {
        setAccounts(prev => ({ ...prev, [name]: value }));
    };



    const fetchAccountData = async () => {
        if (!idl || !inspectorType || !inspectorAddress || !programId || !wallet.publicKey) return;
        
        setInspectorLoading(true);
        setInspectorData(null);
        
        try {
             // Basic provider setup
             const provider = new AnchorProvider(
                connection,
                wallet as any,
                { preflightCommitment: "confirmed" }
            );
            const modifiedIdl = { ...idl, address: programId };
            const program = new Program(modifiedIdl as Idl, provider);

            // Fetch
            // @ts-ignore
            const accountData = await program.account[inspectorType].fetch(new PublicKey(inspectorAddress));
            
            // Format for display (handle BNs)
            const formatted = JSON.parse(JSON.stringify(accountData, (key, value) => {
                if (typeof value === 'object' && value !== null && 'bn' in value) {
                    return new BN(value.bn, 'hex').toString();
                }
                return value;
            }));

            setInspectorData(formatted);

        } catch (e: any) {
            console.error(e);
            setInspectorData({ error: e.message });
        } finally {
            setInspectorLoading(false);
        }
    };

    // ... (existing functions)

    const handleAddSeed = () => {
        setPdaSeeds([...pdaSeeds, {type: "string", value: ""}]);
    };

    const handleRemoveSeed = (index: number) => {
        setPdaSeeds(pdaSeeds.filter((_, i) => i !== index));
    };

    const handleSeedChange = (index: number, field: "type" | "value", val: string) => {
        const newSeeds = [...pdaSeeds];
        // @ts-ignore
        newSeeds[index][field] = val;
        setPdaSeeds(newSeeds);
    };

    const derivePda = async () => {
        if (!programId) return;
        setPdaError(null);
        setPdaResult(null);

        try {
            const seeds = pdaSeeds.map(s => {
                if (s.type === "publicKey") {
                    return new PublicKey(s.value).toBuffer();
                } else {
                    return Buffer.from(s.value);
                }
            });

            const [pda, bump] = await PublicKey.findProgramAddress(
                seeds,
                new PublicKey(programId)
            );

            setPdaResult({
                address: pda.toBase58(),
                bump: bump
            });

        } catch (e: any) {
             setPdaError(e.message);
        }
    };

    if (!idl) return <div className="p-4 text-zinc-500 text-xs text-center">Build the program to load the Interface.</div>;

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] border-l border-zinc-800 w-80">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
                <button 
                    onClick={() => setActiveTab("instruction")}
                    className={`flex-1 py-3 text-xs font-semibold tracking-wide uppercase ${activeTab === "instruction" ? "text-zinc-200 border-b-2 border-blue-500 bg-zinc-800/50" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Instruct
                </button>
                <button 
                    onClick={() => setActiveTab("inspector")}
                    className={`flex-1 py-3 text-xs font-semibold tracking-wide uppercase ${activeTab === "inspector" ? "text-zinc-200 border-b-2 border-blue-500 bg-zinc-800/50" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Inspect
                </button>
                <button 
                    onClick={() => setActiveTab("pda")}
                    className={`flex-1 py-3 text-xs font-semibold tracking-wide uppercase ${activeTab === "pda" ? "text-zinc-200 border-b-2 border-blue-500 bg-zinc-800/50" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    PDA
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === "instruction" ? (
                    // ... (Instruction View)
                    <>
                        {/* Instruction Selector */}
                        <div>
                            <label className="text-xs text-zinc-500 block mb-1">Select Instruction</label>
                            <select 
                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200 outline-none focus:border-blue-500"
                                onChange={(e) => {
                                    const ix = idl.instructions.find(i => i.name === e.target.value);
                                    setSelectedIx(ix);
                                    setArgs({});
                                    setAccounts({});
                                    setStatus("idle");
                                    setLogs([]);
                                }}
                            >
                                <option value="">-- Select --</option>
                                {idl.instructions.map(ix => (
                                    <option key={ix.name} value={ix.name}>{ix.name}</option>
                                ))}
                            </select>
                        </div>
                        {selectedIx && (
                            <>
                                {/* Arguments */}
                                {selectedIx.args.length > 0 && (
                                     <div className="space-y-2">
                                        <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                                            <Database className="w-3 h-3" /> Arguments
                                        </div>
                                        {selectedIx.args.map((arg: any) => (
                                            <div key={arg.name}>
                                                <label className="text-[10px] text-zinc-500 uppercase">{arg.name} ({arg.type})</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-300 focus:border-blue-500"
                                                    placeholder={`Value for ${arg.name}`}
                                                    onChange={(e) => handleArgChange(arg.name, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Accounts */}
                                <div className="space-y-2">
                                     <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                                        <Key className="w-3 h-3" /> Accounts
                                    </div>
                                    {selectedIx.accounts.map((acc: any) => (
                                        <div key={acc.name}>
                                            <label className="text-[10px] text-zinc-500 uppercase flex justify-between">
                                                <span>{acc.name}</span>
                                                {acc.isMut && <span className="text-orange-500">MUT</span>}
                                                {acc.isSigner && <span className="text-blue-500">SIGNER</span>}
                                            </label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-300 focus:border-blue-500"
                                                placeholder="Public Key"
                                                onChange={(e) => handleAccountChange(acc.name, e.target.value)}
                                                // Auto-suggest for some known ones?
                                                defaultValue={
                                                    (acc.name === "user" || acc.name === "authority") && wallet.publicKey ? wallet.publicKey.toBase58() : 
                                                    (acc.name === "systemProgram") ? "11111111111111111111111111111111" : ""
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>



    // ... (rest of render)
    
                                {/* Action */}
                                <div className="pt-2 space-y-3">
                                    {/* Queue UI */}
                                    <InstructionQueue 
                                        queue={queue.map(q => ({
                                            id: q.id,
                                            name: q.name,
                                            args: q.displayArgs,
                                            accounts: q.accounts
                                        }))} 
                                        onRemove={removeFromQueue} 
                                    />
                                    
                                    <div className="flex gap-2">
                                        <button
                                            onClick={addToQueue}
                                            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-sm font-medium transition-colors border border-zinc-700"
                                        >
                                            + Add to Queue
                                        </button>
                                        <button
                                            onClick={executeTransaction}
                                            disabled={status === "loading" || !wallet.connected || (!selectedIx && queue.length === 0)}
                                            className="flex-[2] py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                            {queue.length > 0 ? `Send Batch (${queue.length})` : "Run Instruction"}
                                        </button>
                                    </div>
                                    
                                    {/* Settings Toggle */}
                                    <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Priority Fee (µL)</label>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300"
                                                    value={txSettings.priorityFee}
                                                    onChange={e => setTxSettings({...txSettings, priorityFee: parseInt(e.target.value) || 0})}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                 <label className="text-[10px] text-zinc-500 uppercase block mb-1">Compute Units</label>
                                                 <input 
                                                    type="number"
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300"
                                                    value={txSettings.computeUnits}
                                                    onChange={e => setTxSettings({...txSettings, computeUnits: parseInt(e.target.value) || 200000})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {!wallet.connected && <p className="text-xs text-red-500 mt-1 text-center">Connect wallet first</p>}
                                </div>

import LogViewer from "@/components/LogViewer";

// ... (inside the render, replacing the logs section)

                                {/* Logs */}
                                <LogViewer logs={logs} />
                            </>
                        )}
                    </>
                ) : activeTab === "inspector" ? (
                    // INSPECTOR VIEW
                    <div className="space-y-4">
                        <div>
                             <label className="text-xs text-zinc-500 block mb-1">Account Type</label>
                             <select
                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200 outline-none focus:border-blue-500"
                                onChange={(e) => setInspectorType(e.target.value)}
                                value={inspectorType}
                             >
                                <option value="">-- Select Type --</option>
                                {idl.accounts?.map((acc: any) => (
                                    <option key={acc.name} value={acc.name.charAt(0).toLowerCase() + acc.name.slice(1)}>{acc.name}</option>
                                ))}
                             </select>
                        </div>
                        {/* ... (rest of inspector) */}
                         <div>
                            <label className="text-xs text-zinc-500 block mb-1">Account Address</label>
                            <input 
                                type="text" 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-2 text-sm text-zinc-300 focus:border-blue-500"
                                placeholder="Public Key"
                                value={inspectorAddress}
                                onChange={(e) => setInspectorAddress(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={fetchAccountData}
                            disabled={inspectorLoading || !inspectorType || !inspectorAddress}
                            className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {inspectorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch Data"}
                        </button>

                        {inspectorData && (
                            <div className="p-3 bg-zinc-900 rounded border border-zinc-800 overflow-x-auto">
                                <pre className="text-xs font-mono text-zinc-300">
                                    {JSON.stringify(inspectorData, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                ) : (
                    // PDA VIEW
                    <div className="space-y-4">
                        <div className="text-xs text-zinc-400 mb-2">
                             Derive addresses from seeds + program ID.
                        </div>

                        <div className="space-y-2">
                            {pdaSeeds.map((seed, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <select
                                        className="bg-zinc-800 border border-zinc-700 rounded p-1 text-xs text-zinc-300"
                                        value={seed.type}
                                        onChange={(e) => handleSeedChange(idx, "type", e.target.value)}
                                    >
                                        <option value="string">String</option>
                                        <option value="publicKey">PublicKey</option>
                                    </select>
                                    <input 
                                        type="text"
                                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300"
                                        placeholder="Value"
                                        value={seed.value}
                                        onChange={(e) => handleSeedChange(idx, "value", e.target.value)}
                                    />
                                    {idx > 0 && (
                                        <button onClick={() => handleRemoveSeed(idx)} className="text-zinc-500 hover:text-red-500">
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={handleAddSeed} className="text-xs text-blue-500 hover:text-blue-400">
                                + Add Seed
                            </button>
                        </div>

                         <button
                            onClick={derivePda}
                            className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                        >
                            Derive Address
                        </button>

                        {pdaError && (
                             <div className="p-2 bg-red-900/20 text-red-400 text-xs rounded border border-red-900/50">
                                {pdaError}
                             </div>
                        )}

                        {pdaResult && (
                             <div className="p-3 bg-zinc-900 rounded border border-zinc-800 space-y-2">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase">Address</label>
                                    <div className="text-xs text-green-400 font-mono break-all select-all">
                                        {pdaResult.address}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase">Bump</label>
                                    <div className="text-xs text-zinc-300 font-mono">
                                        {pdaResult.bump}
                                    </div>
                                </div>
                             </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InteractionPanel;
