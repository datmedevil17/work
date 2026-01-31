import React from 'react';
import { Coins, ArrowRightLeft, Database, Calculator, Box, Server } from 'lucide-react';

export const Sidebar = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/label', label);
        event.dataTransfer.setData('application/nodeType', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="w-64 bg-white dark:bg-[#1e1e1e] border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full overflow-y-auto">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase text-zinc-500">
                Nodes Library
            </div>
            
            <div className="p-4 space-y-6">
                <div>
                    <div className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Blockchain</div>
                    <div className="space-y-2">
                         <div 
                            className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded cursor-move hover:ring-2 ring-blue-500/50 transition-all border border-transparent hover:border-blue-500" 
                            draggable 
                            onDragStart={(event) => onDragStart(event, 'blockchain', 'Mint Token')}
                        >
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm">Mint Token</span>
                        </div>
                        <div 
                            className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded cursor-move hover:ring-2 ring-blue-500/50 transition-all border border-transparent hover:border-blue-500" 
                            draggable 
                            onDragStart={(event) => onDragStart(event, 'blockchain', 'Transfer SOL')}
                        >
                            <ArrowRightLeft className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Transfer SOL</span>
                        </div>
                        <div 
                            className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded cursor-move hover:ring-2 ring-blue-500/50 transition-all border border-transparent hover:border-blue-500" 
                            draggable 
                            onDragStart={(event) => onDragStart(event, 'blockchain', 'Get Balance')}
                        >
                            <Database className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">Get Balance</span>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Providers</div>
                    <div className="space-y-2">
                         <div 
                            className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded cursor-move hover:ring-2 ring-orange-500/50 transition-all border border-transparent hover:border-orange-500" 
                            draggable 
                            onDragStart={(event) => onDragStart(event, 'provider', 'Helius RPC')}
                        >
                            <Server className="w-4 h-4 text-orange-500" />
                            <span className="text-sm">Helius RPC</span>
                        </div>
                        <div 
                            className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded cursor-move hover:ring-2 ring-green-500/50 transition-all border border-transparent hover:border-green-500" 
                            draggable 
                            onDragStart={(event) => onDragStart(event, 'provider', 'Birdeye Data')}
                        >
                            <Box className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Birdeye Data</span>
                        </div>
                    </div>
                </div>
                
                 <div>
                    <div className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Logic</div>
                    <div className="space-y-2">
                         <div 
                            className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded cursor-move hover:ring-2 ring-purple-500/50 transition-all border border-transparent hover:border-purple-500" 
                            draggable 
                            onDragStart={(event) => onDragStart(event, 'logic', 'Math Op')}
                        >
                            <Calculator className="w-4 h-4 text-purple-500" />
                            <span className="text-sm">Math Op</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-auto p-4 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 text-center">
                Drag nodes to canvas to build flow
            </div>
        </div>
    );
};
