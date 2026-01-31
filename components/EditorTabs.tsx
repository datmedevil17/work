"use client";

import React from "react";
import { X } from "lucide-react";

interface EditorTabsProps {
  openFiles: string[];
  activeFile: string;
  onSelectFile: (fileName: string) => void;
  onCloseFile: (fileName: string) => void;
}

const EditorTabs: React.FC<EditorTabsProps> = ({
  openFiles,
  activeFile,
  onSelectFile,
  onCloseFile,
}) => {
  return (
    <div className="flex items-center bg-[#1e1e1e] border-b border-zinc-800 overflow-x-auto no-scrollbar">
      {openFiles.map((fileName) => (
        <div
          key={fileName}
          className={`
            group flex items-center gap-2 px-3 py-2 text-sm border-r border-zinc-800 cursor-pointer min-w-[120px] max-w-[200px]
            ${
              activeFile === fileName
                ? "bg-[#1e1e1e] text-zinc-100 border-t-2 border-t-blue-500"
                : "bg-[#2d2d2d] text-zinc-400 hover:bg-[#252526]"
            }
          `}
          onClick={() => onSelectFile(fileName)}
        >
          <span className="truncate flex-1">{fileName}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCloseFile(fileName);
            }}
            className={`
              p-0.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-zinc-700
              ${activeFile === fileName ? "opacity-100" : ""}
            `}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default EditorTabs;
