import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const workspacePath = path.join(process.cwd(), "solana-workspace");
    // Anchor default IDL path
    const idlPath = path.join(workspacePath, "target", "idl", "solana_workspace.json");

    try {
        await fs.access(idlPath);
    } catch {
        return NextResponse.json({ error: "IDL not found. Please build first." }, { status: 404 });
    }

    const fileContent = await fs.readFile(idlPath, "utf-8");
    const idl = JSON.parse(fileContent);
    
    return NextResponse.json(idl);

  } catch (error: any) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
