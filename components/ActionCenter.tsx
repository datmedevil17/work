"use client";

import React from "react";
import { Hammer, Upload, Play, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

interface ActionCenterProps {
    onBuild: () => void;
    onDeploy: () => void;
    onInteract: () => void;
    isBuilding: boolean;
    isDeploying: boolean;
    isBuilt: boolean;
    deployedProgramId: string | null;
    serverWalletAddress: string | null;
}

const ActionCenter: React.FC<ActionCenterProps> = ({ 
    onBuild, 
    onDeploy, 
    onInteract, 
    isBuilding, 
    isDeploying, 
    isBuilt,
    deployedProgramId,
    serverWalletAddress 
}) => {
    
    // Determine current active step
    const getStepStatus = (step: 'build' | 'deploy' | 'interact') => {
        if (step === 'build') {
            if (isBuilding) return 'loading';
            if (isBuilt) return 'success';
            return 'idle'; // or error if we tracked it
        }
        if (step === 'deploy') {
            if (!isBuilt) return 'disabled';
            if (isDeploying) return 'loading';
            if (deployedProgramId) return 'success';
            return 'idle';
        }
        if (step === 'interact') {
            if (!deployedProgramId) return 'disabled';
            return 'idle';
        }
        return 'idle';
    };

    const StepIcon = ({ status, icon: Icon }: { status: string, icon: any }) => {
        if (status === 'loading') return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
        if (status === 'success') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        if (status === 'disabled') return <Icon className="w-4 h-4 text-zinc-600" />;
        return <Icon className="w-4 h-4 text-zinc-400 group-hover:text-blue-400 transition-colors" />;
    };

    return (
        <div className="flex flex-col gap-2 bg-[#1e1e1e] p-3 rounded-lg border border-zinc-800">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Workflow
            </div>

            {/* Step 1: Build */}
            <div className="relative">
                <button
                    onClick={onBuild}
                    disabled={isBuilding}
                    className="w-full flex items-center justify-between p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-all group text-left disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full bg-zinc-950 border border-zinc-800 ${isBuilding ? 'border-blue-500/50' : ''}`}>
                            <StepIcon status={getStepStatus('build')} icon={Hammer} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-zinc-200 group-hover:text-white">Build Program</div>
                            <div className="text-[10px] text-zinc-500">Compiles Rust to BPF</div>
                        </div>
                    </div>
                </button>
                {/* Connector Line */}
                <div className={`absolute left-[1.65rem] top-full h-2 w-px bg-zinc-800 z-0`} />
            </div>

            {/* Step 2: Deploy */}
            <div className="relative mt-2">
                <div className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-md group text-left">
                     <div className="flex items-center gap-3 w-full mb-2">
                        <div className={`p-2 rounded-full bg-zinc-950 border border-zinc-800 ${isDeploying ? 'border-blue-500/50' : ''}`}>
                             <StepIcon status={getStepStatus('deploy')} icon={Upload} />
                        </div>
                        <div className="flex-1">
                            <div className={`text-sm font-medium ${!isBuilt ? 'text-zinc-600' : 'text-zinc-200'}`}>Deploy</div>
                             <div className="text-[10px] text-zinc-500">Upload to Devnet</div>
                        </div>
                    </div>
                    
                    {/* Deploy Actions */}
                    {isBuilt && !deployedProgramId && (
                        <div className="pl-11">
                            {serverWalletAddress && (
                                <div className="mb-2 p-2 bg-zinc-950 rounded border border-zinc-800 flex flex-col gap-1">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Server Wallet</span>
                                    <div className="flex items-center gap-2">
                                        <code className="text-[10px] text-zinc-300 font-mono break-all bg-zinc-900 p-0.5 rounded">
                                            {serverWalletAddress}
                                        </code>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(serverWalletAddress);
                                            }}
                                            className="text-zinc-500 hover:text-white"
                                            title="Copy Address"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                        </button>
                                    </div>
                                    <div className="text-[9px] text-zinc-600">
                                        Must hold ~2 SOL for deploy.
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeploy(); }}
                                className="w-full py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded shadow-sm transition-colors font-medium flex items-center justify-center gap-2"
                                title="Deploy to Devnet"
                            >
                                {isDeploying ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3"/>}
                                Deploy to Devnet
                            </button>
                        </div>
                    )}
                </div>
                 {/* Connector Line */}
                 <div className={`absolute left-[1.65rem] top-full h-2 w-px bg-zinc-800 z-0`} />
            </div>

             {/* Step 3: Interact */}
             <div className="mt-2">
                <button
                    onClick={onInteract}
                    disabled={!deployedProgramId}
                    className="w-full flex items-center justify-between p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-zinc-950 border border-zinc-800">
                             <StepIcon status={getStepStatus('interact')} icon={Play} />
                        </div>
                        <div>
                            <div className={`text-sm font-medium ${!deployedProgramId ? 'text-zinc-600' : 'text-zinc-200 group-hover:text-white'}`}>Interact</div>
                            <div className="text-[10px] text-zinc-500">Run Instructions</div>
                        </div>
                    </div>
                     {deployedProgramId && <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white" />}
                </button>
            </div>

        </div>
    );
};

export default ActionCenter;
