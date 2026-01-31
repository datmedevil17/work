import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Coins, ArrowRightLeft, Database, Play, Server, Box, Calculator } from 'lucide-react';
import { cn } from '@/utils/cn';

const NodeIcon = ({ type, subType }: { type: string, subType: string }) => {
    if (subType.includes('Mint')) return <Coins className="w-4 h-4 text-yellow-400" />;
    if (subType.includes('Transfer')) return <ArrowRightLeft className="w-4 h-4 text-green-400" />;
    if (subType.includes('Balance')) return <Database className="w-4 h-4 text-blue-400" />;
    if (subType.includes('Helius')) return <Server className="w-4 h-4 text-orange-400" />;
    if (subType.includes('Birdeye')) return <Box className="w-4 h-4 text-green-400" />;
    if (type === 'trigger') return <Play className="w-4 h-4 text-white" />;
    return <Calculator className="w-4 h-4 text-zinc-400" />;
};

export const CustomNode = memo(({ data, selected }: any) => {
    const isTrigger = data.type === 'trigger';
    const type = data.type;
    const label = data.label;

    return (
        <div className={cn(
            "min-w-[180px] rounded-lg border-2 shadow-lg transition-all bg-zinc-900",
            selected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-zinc-700",
            isTrigger ? "bg-blue-600 border-blue-500" : ""
        )}>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700/50 bg-black/20">
                <NodeIcon type={data.type} subType={data.label} />
                <div className="text-xs font-bold text-zinc-100">{data.label}</div>
            </div>

            {/* Content */}
            <div className="p-3">
                <div className="space-y-2">
                    {!isTrigger && (
                         <div className="text-[10px] text-zinc-400 uppercase font-semibold">Inputs</div>
                    )}
                    {label.includes('Mint') && (
                        <div className="space-y-1">
                             <input className="w-full bg-black/30 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-300" placeholder="Name" />
                             <input className="w-full bg-black/30 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-300" placeholder="Symbol" />
                             <input className="w-full bg-black/30 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-300" placeholder="Supply" type="number"/>
                        </div>
                    )}
                    {label.includes('Transfer') && (
                        <div className="space-y-1">
                             <input className="w-full bg-black/30 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-300" placeholder="Recipient Addr" />
                             <input className="w-full bg-black/30 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-300" placeholder="Amount" type="number"/>
                        </div>
                    )}
                </div>
            </div>

            {/* Handles */}
            {!isTrigger && (
                <Handle type="target" position={Position.Left} className="w-3 h-3 bg-zinc-400 border-2 border-zinc-900" />
            )}
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-zinc-900" />
        </div>
    );
});

CustomNode.displayName = "CustomNode";
