import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import util from "util";
import { Keypair, Connection, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";

const execPromise = util.promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const workspacePath = path.join(process.cwd(), "solana-workspace");
    const binaryPath = path.join(workspacePath, "target", "deploy", "solana_workspace.so");

    // Check if binary exists
    try {
        await fs.access(binaryPath);
    } catch {
        return NextResponse.json({ error: "No compiled binary found. Please Build first." }, { status: 400 });
    }

    // Server Wallet Setup
    const keypairPath = path.join(workspacePath, "deploy-wallet.json");
    let keypair: Keypair;

    try {
        const secretKeyString = await fs.readFile(keypairPath, 'utf-8');
        const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
        keypair = Keypair.fromSecretKey(secretKey);
    } catch (e) {
        // Generate new if not exists
        keypair = Keypair.generate();
        await fs.writeFile(keypairPath, JSON.stringify(Array.from(keypair.secretKey)));
    }

    // Force Devnet
    const rpcUrl = clusterApiUrl("devnet");

    // Connection & Airdrop
    const connection = new Connection(rpcUrl, 'confirmed');
    const balance = await connection.getBalance(keypair.publicKey);
    const MIN_BALANCE = 2 * LAMPORTS_PER_SOL;

    const logs: string[] = [];
    logs.push(`Deploying to DEVNET (${rpcUrl})`);
    logs.push(`Using Server Wallet: ${keypair.publicKey.toBase58()}`);
    logs.push(`Current Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance < MIN_BALANCE) {
        logs.push("Requesting Airdrop of 2 SOL...");
        try {
            const sig = await connection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(sig);
            logs.push("Airdrop Confirmed (2 SOL).");
        } catch (e: any) {
             logs.push(`2 SOL Airdrop failed: ${e.message}. Retrying with 1 SOL...`);
             try {
                const sig = await connection.requestAirdrop(keypair.publicKey, 1 * LAMPORTS_PER_SOL);
                await connection.confirmTransaction(sig);
                logs.push("Airdrop Confirmed (1 SOL).");
             } catch (e2: any) {
                logs.push(`1 SOL Airdrop failed: ${e2.message}.`);
             }
        }
    }

    // Re-check balance
    const finalBalance = await connection.getBalance(keypair.publicKey);
    if (finalBalance < 0.5 * LAMPORTS_PER_SOL) {
        return NextResponse.json({
            status: "error",
            logs: [...logs, `CRITICAL: Insufficient funds. Server Wallet: ${keypair.publicKey.toBase58()}`, `Current Balance: ${finalBalance / LAMPORTS_PER_SOL} SOL`, `Please fund this address manually via faucet.solana.com`],
            message: "Insufficient funds for deployment."
        });
    }

    // Run Deployment Command
    const deployCmd = `solana program deploy ${binaryPath} --keypair ${keypairPath} --url ${rpcUrl}`;
    logs.push("Executing deployment command...");

    try {
        const { stdout, stderr } = await execPromise(deployCmd);
        
        const outLines = stdout.toString().split('\n');
        let programId = "";
        
        // Parse output for Program Id
        // Output usually looks like:
        // Program Id: <ID>
        for(const line of outLines) {
            if (line.includes("Program Id:")) {
                programId = line.split("Program Id:")[1].trim();
            }
        }

        logs.push(...outLines);
        if (stderr) logs.push(...stderr.toString().split('\n'));
        
        if (!programId) {
             throw new Error("Could not parse Program ID from output.");
        }

        // Warning: `solana program deploy` output doesn't give the TX signature directly easily without JSON output
        // We can find the latest transaction for the payer to get the link?
        // Or we can try to use --output json?
        
        // Let's Fetch the signature from chain for the keypair
        let txLink = "";
        const signatures = await connection.getSignaturesForAddress(keypair.publicKey, { limit: 1 });
        if(signatures.length > 0) {
            txLink = `https://explorer.solana.com/tx/${signatures[0].signature}?cluster=devnet`;
        }

        return NextResponse.json({
            status: "success",
            logs,
            programId,
            explorerLink: txLink
        });

    } catch (error: any) {
        const errLogs = [error.message];
        if (error.stdout) errLogs.push(...error.stdout.toString().split('\n'));
        if (error.stderr) errLogs.push(...error.stderr.toString().split('\n'));
        
        return NextResponse.json({
            status: "error",
            logs: [...logs, ...errLogs],
            message: "Deployment failed"
        });
    }

  } catch (error: any) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
