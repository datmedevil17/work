"use client";

import React from "react";
import ToolsNav from "./ToolsNav";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-zinc-50 dark:bg-black overflow-hidden font-sans text-zinc-900 dark:text-zinc-100">
            <ToolsNav />
            <main className="flex-1 overflow-y-auto h-full">
                {children}
            </main>
        </div>
    );
}
