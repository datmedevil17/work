import React from "react";
import { Terminal, CheckCircle2, XCircle, Activity, Box } from "lucide-react";

interface LogViewerProps {
    logs: string[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
    if (!logs || logs.length === 0) return null;

    return (
        <div className="mt-4 border border-zinc-800 rounded bg-[#1e1e1e] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border-b border-zinc-800">
                <Terminal className="w-3 h-3 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300">Transaction Logs</span>
            </div>
            <div className="p-3 font-mono text-xs overflow-x-auto max-h-60 overflow-y-auto space-y-1">
                {logs.map((log, i) => {
                    const isInvoke = log.includes("invoke");
                    const isSuccess = log.includes("success");
                    const isFailed = log.includes("failed") || log.includes("Error");
                    const isCompute = log.includes("consumed");
                    const isData = log.includes("Program data:");

                    let color = "text-zinc-400";
                    let Icon = null;

                    if (isInvoke) {
                        color = "text-blue-400";
                        Icon = Box;
                    } else if (isSuccess) {
                        color = "text-green-400";
                        Icon = CheckCircle2;
                    } else if (isFailed) {
                        color = "text-red-400";
                        Icon = XCircle;
                    } else if (isCompute) {
                         color = "text-yellow-500/80";
                         Icon = Activity;
                    } else if (isData) {
                        color = "text-zinc-300";
                    }

                    return (
                        <div key={i} className={`flex items-start gap-2 ${color}`}>
                           {Icon && <Icon className="w-3 h-3 mt-0.5 flex-none" />} 
                           <span className="flex-1 whitespace-pre-wrap break-all">{log}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LogViewer;
