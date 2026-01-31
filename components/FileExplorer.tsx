"use client";

import React from "react";
import { Folder, FileCode, ChevronRight, ChevronDown } from "lucide-react";

interface FileExplorerProps {
  files: Record<string, string>;
  activeFile: string;
  onSelectFile: (path: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFile,
  onSelectFile,
}) => {
  // Simple flat list view for now, grouped clearly
  const fileList = Object.keys(files).sort();

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-zinc-800">
      <div className="px-4 py-3 border-b border-zinc-800 text-xs font-semibold tracking-wide uppercase text-zinc-400">
        Explorer
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-2 pb-2">
          <div className="flex items-center gap-1 text-zinc-300 text-sm font-medium mb-1 px-2 py-1 bg-zinc-800/50 rounded">
            <Folder className="w-4 h-4 text-blue-400" />
            <span>src</span>
          </div>
          <div className="pl-4 space-y-0.5">
            {fileList.map((path) => (
              <button
                key={path}
                onClick={() => onSelectFile(path)}
                className={`flex items-center gap-2 w-full px-2 py-1 text-sm rounded transition-colors ${
                  activeFile === path
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                <FileCode className="w-4 h-4 shrink-0" />
                <span className="truncate">{path}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
