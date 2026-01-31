import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Keypair } from "@solana/web3.js";

export async function GET() {
  try {
    const workspacePath = path.join(process.cwd(), "solana-workspace");
    const keypairPath = path.join(workspacePath, "deploy-wallet.json");

    try {
        const secretKeyString = await fs.readFile(keypairPath, 'utf-8');
        const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
        const keypair = Keypair.fromSecretKey(secretKey);
        
        return NextResponse.json({ 
            address: keypair.publicKey.toBase58() 
        });
    } catch (e) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }
  } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
