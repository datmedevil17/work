import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const workspacePath = path.join(process.cwd(), "solana-workspace");
    const binaryPath = path.join(workspacePath, "target", "deploy", "solana_workspace.so");

    try {
        await fs.access(binaryPath);
    } catch {
        return NextResponse.json({ error: "Binary not found. Please build first." }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(binaryPath);
    
    return new NextResponse(fileBuffer, {
        headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": 'attachment; filename="solana_workspace.so"',
        },
    });

  } catch (error: any) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
