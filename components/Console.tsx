"use client";

import React, { useEffect, useRef } from "react";

interface ConsoleProps {
  logs: string[];
}

const Console: React.FC<ConsoleProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-zinc-300 font-mono text-sm rounded-md border border-zinc-800 shadow-sm">
      <div className="px-4 py-2 border-b border-zinc-700 bg-[#252526] text-xs font-semibold tracking-wide uppercase text-zinc-400">
        Console Output
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {logs.length === 0 ? (
          <span className="text-zinc-600 italic">No logs yet...</span>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap break-all">
              <span className="text-zinc-500 mr-2">[{index + 1}]</span>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Console;
