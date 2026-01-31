import React from "react";
import { Trash2, GripVertical, Layers } from "lucide-react";

interface QueuedInstruction {
    id: string;
    name: string;
    args: any[];
    accounts: Record<string, string>;
}

interface InstructionQueueProps {
    queue: QueuedInstruction[];
    onRemove: (id: string) => void;
}

const InstructionQueue: React.FC<InstructionQueueProps> = ({ queue, onRemove }) => {
    if (queue.length === 0) return null;

    return (
        <div className="space-y-2 mb-4">
            <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1 uppercase tracking-wider">
                <Layers className="w-3 h-3" /> Transaction Queue ({queue.length})
            </div>
            
            <div className="space-y-2">
                {queue.map((ix, index) => (
                    <div key={ix.id} className="bg-zinc-900 border border-zinc-700/50 rounded-md p-3 flex gap-3 group hover:border-zinc-600 transition-colors">
                        <div className="flex flex-col items-center justify-center text-zinc-600">
                             <span className="text-[10px] font-mono">{index + 1}</span>
                             <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-100 cursor-grab" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-zinc-200">{ix.name}</span>
                                <button 
                                    onClick={() => onRemove(ix.id)}
                                    className="p-1 hover:bg-red-900/30 text-zinc-500 hover:text-red-400 rounded transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            
                            {/* Args Summary */}
                            {ix.args.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {ix.args.slice(0, 3).map((arg: any, i) => (
                                        <span key={i} className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                                            {String(arg)}
                                        </span>
                                    ))}
                                    {ix.args.length > 3 && (
                                        <span className="text-[10px] text-zinc-500">+{ix.args.length - 3} more</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InstructionQueue;
