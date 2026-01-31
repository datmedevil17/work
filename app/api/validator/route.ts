import { NextRequest, NextResponse } from "next/server";
import { spawn, ChildProcess } from "child_process";

// Keep track of the validator process
// NOTE: In a serverless environment like Vercel, this won't work as expected because of ephemeral instances.
// However, since this is a local "Next.js as IDE" setup, this singleton pattern in memory *might* work 
// as long as the dev server doesn't restart the worker process too often.
// A more robust local solution would be checking `pidof solana-test-validator` or writing the PID to a file.

let validatorProcess: ChildProcess | null = null;

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (action === "start") {
      if (validatorProcess) {
        return NextResponse.json({ status: "already_running" });
      }

      // Check if already running via shell command to be safe
      // (solana-test-validator refuses to start if ledger exists and is locked)
      
      console.log("Starting solana-test-validator...");
      validatorProcess = spawn("solana-test-validator", ["--reset"], {
        detached: true,
        stdio: "ignore",
      });
      
      // Unref to let it run independently if parent exits (optional, but good for detached)
      validatorProcess.unref();

      validatorProcess.on('error', (err) => {
        console.error('Validator launch error:', err);
        validatorProcess = null;
      });

      validatorProcess.on('exit', (code, signal) => {
          console.log(`Validator exited with code ${code} and signal ${signal}`);
          validatorProcess = null;
      });

      return NextResponse.json({ status: "started" });
    } 
    
    if (action === "stop") {
        if (validatorProcess) {
            validatorProcess.kill();
            validatorProcess = null;
            return NextResponse.json({ status: "stopped" });
        } else {
             // Try fetching PID/killing systematically
             try {
                 // Creating a "kill all" command for robust stopping
                 // This is linux specific
                 const killProc = spawn("pkill", ["solana-test-va"]);
                 return NextResponse.json({ status: "stopped_via_pkill" });
             } catch(e) {
                 return NextResponse.json({ status: "not_running" });
             }
        }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
    // Check status
    // Simple check: is the process object there? 
    // Robust check: curl localhost:8899/health or pgrep
    
    if (validatorProcess) {
        return NextResponse.json({ status: "running", pid: validatorProcess.pid });
    }
    
    // Fallback: check real system process
    try {
        // This is a rough check. In a real app we'd ping the RPC.
        // Let's assume for MVP if our variable is null, it's "unknown" or "stopped".
        // But the user might have started it manually. 
        // Let's ping the RPC port 8899
        const response = await fetch("http://127.0.0.1:8899/health");
        if (response.ok) {
             return NextResponse.json({ status: "running", source: "external" });
        }
    } catch(e) {
        // conn refused, likely not running
    }

    return NextResponse.json({ status: "stopped" });
}
