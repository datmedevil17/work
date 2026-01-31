import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);
const WORKSPACE_DIR = path.join(process.cwd(), "solana-workspace");

export async function GET(req: NextRequest) {
  try {
    const cargoTomlPath = path.join(WORKSPACE_DIR, "Cargo.toml");
    
    // Check if file exists
    try {
        await fs.access(cargoTomlPath);
    } catch {
        return NextResponse.json({ dependencies: [] });
    }

    const content = await fs.readFile(cargoTomlPath, "utf-8");
    const dependencies: string[] = [];
    
    // Simple regex to find dependencies in [dependencies] section
    // precise parsing is hard without a TOML library, but this should work for standard files
    let inDependencies = false;
    const lines = content.split("\n");
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "[dependencies]") {
            inDependencies = true;
            continue;
        }
        if (trimmed.startsWith("[") && trimmed !== "[dependencies]") {
            inDependencies = false;
        }

        if (inDependencies && trimmed && !trimmed.startsWith("#")) {
            const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=/);
            if (match) {
                dependencies.push(match[1]);
            }
        }
    }

    return NextResponse.json({ dependencies });

  } catch (error: any) {
    console.error("Dependency API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    try {
        const { crate, features } = await req.json();

        if (!crate) {
            return NextResponse.json({ error: "No crate specified" }, { status: 400 });
        }

        const cmd = features 
            ? `cargo add ${crate} --features ${features}`
            : `cargo add ${crate}`;

        // Execute cargo add
        const { stdout, stderr } = await execPromise(cmd, { cwd: WORKSPACE_DIR });

        return NextResponse.json({ 
            status: "success", 
            logs: [cmd, stdout, stderr].filter(Boolean) 
        });

    } catch (error: any) {
        console.error("Dependency Install Error:", error);
        return NextResponse.json({ 
            status: "error", 
            message: error.message,
            logs: [error.message] 
        }, { status: 500 });
    }
}
