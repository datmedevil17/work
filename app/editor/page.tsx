"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useNetwork } from "@/components/AppWalletProvider";
import { Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import CodeEditor from "@/components/CodeEditor";
import Console from "@/components/Console";
import ActionCenter from "@/components/ActionCenter";
import FileExplorer from "@/components/FileExplorer";
import EditorTabs from "@/components/EditorTabs";
import InteractionPanel from "@/components/InteractionPanel";
import TopBar from "@/components/TopBar";


export default function EditorPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;

  const [files, setFiles] = useState<Record<string, string>>({
    "lib.rs": `use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod solana_workspace {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        instructions::increment::handler(ctx)
    }
}`,
    "instructions/mod.rs": `pub mod initialize;
pub mod increment;

pub use initialize::*;
pub use increment::*;`,
    "instructions/initialize.rs": `use anchor_lang::prelude::*;
use crate::state::Counter;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = 0;
    msg!("Counter initialized!");
    Ok(())
}`,
    "instructions/increment.rs": `use anchor_lang::prelude::*;
use crate::state::Counter;

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

pub fn handler(ctx: Context<Increment>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count += 1;
    msg!("Counter incremented. Current count: {}", counter.count);
    Ok(())
}`,
    "state/mod.rs": `pub mod counter;
pub use counter::*;`,
    "state/counter.rs": `use anchor_lang::prelude::*;

#[account]
pub struct Counter {
    pub count: u64,
}`
  });
  

  const [activeFile, setActiveFile] = useState<string>("lib.rs");
  const [openFiles, setOpenFiles] = useState<string[]>(["lib.rs"]);

  const handleSelectFile = (fileName: string) => {
    if (!openFiles.includes(fileName)) {
        setOpenFiles((prev) => [...prev, fileName]);
    }
    setActiveFile(fileName);
  };

  const handleCloseFile = (fileName: string) => {
    setOpenFiles((prev) => {
        const newFiles = prev.filter((f) => f !== fileName);
        if (activeFile === fileName && newFiles.length > 0) {
            setActiveFile(newFiles[newFiles.length - 1]);
        } else if (newFiles.length === 0) {
            setActiveFile(""); // Handle empty state if needed
        }
        return newFiles;
    });
  };
  const [logs, setLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isBuilt, setIsBuilt] = useState(false);
  const [deployedProgramId, setDeployedProgramId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"deploy" | "interact">("deploy");

  // Server Wallet Address State
  const [serverWalletAddress, setServerWalletAddress] = useState<string | null>(null);

  useEffect(() => {
      fetch("/api/wallet")
        .then(res => res.json())
        .then(data => {
            if (data.address) setServerWalletAddress(data.address);
        })
        .catch(err => console.error("Failed to fetch server wallet", err));

      // Restore deployed program ID
      const cachedId = localStorage.getItem("solana-studio-deployed-id");
      if (cachedId) {
          setDeployedProgramId(cachedId);
          setIsBuilt(true); // Assume it's built if we have a deployed ID
          addLog(`Restored deployed program ID: ${cachedId}`);
      }
  }, []);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleFileChange = (newContent: string | undefined) => {
    if (newContent !== undefined) {
      setFiles((prev) => ({ ...prev, [activeFile]: newContent }));
    }
  };

  const handleBuild = async () => {
    setIsBuilding(true);
    setLogs([]); // Clear previous logs
    addLog("Starting build process...");

    try {
      const response = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });

      const data = await response.json();

      if (data.logs) {
        data.logs.forEach((log: string) => addLog(log));
      }

      if (data.status === "success" && data.binary) {
        addLog("Build successful! Artifact generated.");
        setIsBuilt(true);
        addLog(`Binary size: ${Math.ceil((data.binary.length * 3) / 4)} bytes`);
      } else {
        addLog("Build failed. See logs above.");
        setIsBuilt(false);
      }
    } catch (error: any) {
      addLog(`Build error: ${error.message}`);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    addLog("Initiating Server-Side Deployment...");

    try {
      const response = await fetch("/api/deploy", { method: "POST" });
      const data = await response.json();

      if (data.logs) {
        data.logs.forEach((log: string) => addLog(log));
      }

      if (data.status === "success" && data.programId) {
        addLog("Deployment Successful!");
        addLog(`Program ID: ${data.programId}`);
        setDeployedProgramId(data.programId);
        
        // Cache deployment
        localStorage.setItem("solana-studio-deployed-id", data.programId);

        if (data.explorerLink) {
            addLog(`View Transaction: ${data.explorerLink}`);
        }
      } else {
        addLog("Deployment failed. See logs.");
      }
    } catch (error: any) {
        addLog(`Deployment error: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Header */}
      <TopBar />

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 flex-none hidden md:block">
            <FileExplorer 
                files={files} 
                activeFile={activeFile} 
                onSelectFile={handleSelectFile} 
            />
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-200 dark:border-zinc-800">
            <EditorTabs
                openFiles={openFiles}
                activeFile={activeFile}
                onSelectFile={setActiveFile}
                onCloseFile={handleCloseFile}
            />
            <div className="flex-1">
                <CodeEditor 
                    code={files[activeFile]} 
                    onChange={handleFileChange} 
                />
            </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 flex flex-col bg-zinc-50 dark:bg-zinc-900/50">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={() => setSidebarTab("deploy")}
                    className={`flex-1 py-2 text-xs font-medium ${sidebarTab === "deploy" ? "bg-white dark:bg-zinc-800 text-blue-500 border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Deploy
                </button>
                <button
                    onClick={() => setSidebarTab("interact")}
                    className={`flex-1 py-2 text-xs font-medium ${sidebarTab === "interact" ? "bg-white dark:bg-zinc-800 text-blue-500 border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Interact
                </button>
            </div>

            <div className="p-4 flex-none">
                {sidebarTab === "deploy" ? (
                    <>
                    <ActionCenter
                        onBuild={handleBuild}
                        onDeploy={handleDeploy}
                        onInteract={() => setSidebarTab("interact")}
                        isBuilding={isBuilding}
                        isDeploying={isDeploying}
                        isBuilt={isBuilt}
                        deployedProgramId={deployedProgramId}
                        serverWalletAddress={serverWalletAddress}
                    />
                     {isBuilt && (
                        <div className="mt-4 p-3 bg-zinc-900/50 border border-t-[0] border-zinc-800 rounded-b text-[10px] text-zinc-500 text-center">
                           <a 
                               href="/api/download" 
                               className="hover:text-zinc-300 underline decoration-zinc-700"
                               onClick={(e) => {
                                   if (!isBuilt) e.preventDefault();
                               }}
                           >
                               Download binary (.so)
                           </a>
                        </div>
                   )}
                   </>
                ) : (
                    <InteractionPanel programId={deployedProgramId} />
                )}
            </div>
            
            {sidebarTab === "deploy" && (
                <div className="flex-1 p-4 overflow-hidden flex flex-col">
                    <Console logs={logs} />
                    {deployedProgramId && (
                         <div className="mt-2 p-2 bg-green-900/20 border border-green-500/30 rounded text-green-400 text-xs break-all">
                            <strong>Deployed Program ID:</strong><br/>
                            {deployedProgramId}
                         </div>
                    )}
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
