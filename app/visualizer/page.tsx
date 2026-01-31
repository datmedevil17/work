"use client";

import React, { useState } from "react";
import ToolsLayout from "@/components/ToolsLayout";
import { Upload, FileJson, FolderTree, Box, ArrowRight, Share2, Shield, AlertTriangle } from "lucide-react";

export default function VisualizerPage() {
    const [idlJson, setIdlJson] = useState("");
    const [parsedIdl, setParsedIdl] = useState<any>(null);
    const [error, setError] = useState("");

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                setParsedIdl(json);
                setIdlJson(JSON.stringify(json, null, 2));
                setError("");
            } catch (err) {
                setError("Invalid JSON file");
            }
        };
        reader.readAsText(file);
    };

    const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setIdlJson(val);
        try {
            if (val.trim() === "") {
                setParsedIdl(null);
                setError("");
                return;
            }
            const json = JSON.parse(val);
            setParsedIdl(json);
            setError("");
        } catch (err) {
            // Don't error immediately on paste, wait or just ignore until valid
            // But we can show a small warning
            // setParsedIdl(null);
        }
    };

    return (
        <ToolsLayout>
            <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Program Visualizer</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">Visualize Anchor IDL structure and relationships.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 h-full overflow-hidden">
                    {/* Input Column */}
                    <div className="flex flex-col gap-4 h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-300">
                            <FileJson className="w-5 h-5" />
                            Load IDL
                        </div>
                        
                        <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 text-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer relative">
                            <input 
                                type="file" 
                                accept=".json" 
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                            <p className="text-sm text-zinc-500">Upload IDL JSON</p>
                        </div>

                         <div className="flex-1 flex flex-col">
                            <label className="text-xs text-zinc-500 mb-1">Or paste JSON content:</label>
                            <textarea 
                                className="flex-1 w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-3 font-mono text-xs resize-none outline-none focus:ring-2 focus:ring-blue-500"
                                value={idlJson}
                                onChange={handlePaste}
                                placeholder="{ version: '0.1.0', name: ... }"
                            />
                        </div>
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>

                    {/* Visualization Column */}
                    <div className="lg:col-span-2 h-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-y-auto p-8 relative">
                        {!parsedIdl ? (
                            <div className="absolute inset-0 flex items-center justify-center text-zinc-400 flex-col gap-4">
                                <FolderTree className="w-16 h-16 opacity-20" />
                                <p>Load an IDL to visualize structure</p>
                            </div>
                        ) : (
                            <div className="space-y-12 animate-in fade-in duration-500">
                                {/* Program Header */}
                                <div className="text-center">
                                    <div className="inline-flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-6 py-3 rounded-full shadow-sm">
                                        <Box className="w-6 h-6 text-blue-500" />
                                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                                            {parsedIdl.name || "Unknown Program"}
                                        </h2>
                                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">
                                            v{parsedIdl.version || "0.0.0"}
                                        </span>
                                    </div>
                                    <div className="h-8 w-px bg-zinc-300 dark:bg-zinc-700 mx-auto" />
                                </div>

                                {/* Main Structure */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Instructions */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 justify-center text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                                            <Share2 className="w-4 h-4" /> Instructions ({parsedIdl.instructions?.length || 0})
                                        </div>
                                        {parsedIdl.instructions?.map((ix: any, idx: number) => (
                                            <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 shadow-sm hover:border-blue-500 transition-colors group">
                                                <div className="font-mono font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    {ix.name}
                                                </div>
                                                <div className="space-y-1 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800">
                                                    {ix.accounts?.map((acc: any, i: number) => (
                                                        <div key={i} className="text-xs flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                                                            <span>{acc.name}</span>
                                                            <div className="flex gap-1">
                                                                {acc.isMut && <span className="text-[10px] text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1 rounded">MUT</span>}
                                                                {acc.isSigner && <span className="text-[10px] text-green-500 bg-green-50 dark:bg-green-900/20 px-1 rounded">SIG</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Accounts */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 justify-center text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                                            <Shield className="w-4 h-4" /> State Accounts ({parsedIdl.accounts?.length || 0})
                                        </div>
                                        {parsedIdl.accounts?.map((acc: any, idx: number) => (
                                            <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 shadow-sm hover:border-purple-500 transition-colors">
                                                 <div className="font-mono font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                                    {acc.name}
                                                </div>
                                                <div className="text-xs text-zinc-500">
                                                    Size: <span className="font-mono text-zinc-700 dark:text-zinc-300">Dynamic</span>
                                                </div>
                                                {/* Fields preview could go here */}
                                                <div className="mt-2 text-[10px] text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-2 rounded">
                                                    Fields: {acc.type?.fields?.length || 0}
                                                </div>
                                            </div>
                                        ))}

                                        {parsedIdl.types && (
                                            <>
                                                <div className="flex items-center gap-2 justify-center text-sm font-semibold text-zinc-500 uppercase tracking-wider mt-8">
                                                    <AlertTriangle className="w-4 h-4" /> Custom Types ({parsedIdl.types?.length || 0})
                                                </div>
                                                {parsedIdl.types.map((type: any, idx: number) => (
                                                     <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 shadow-sm text-zinc-500 text-xs">
                                                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{type.name}</span>
                                                     </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolsLayout>
    );
}
