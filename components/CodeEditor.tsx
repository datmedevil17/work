"use client";

import React, { useState } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, readOnly = false }) => {
  return (
    <div className="h-full w-full rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <Editor
        height="100%"
        defaultLanguage="rust" // Solana contracts are usually Rust
        theme="vs-dark"
        value={code}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          readOnly: readOnly,
          renderValidationDecorations: "off"
        }}
      />
    </div>
  );
};

export default CodeEditor;
