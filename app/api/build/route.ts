import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.files) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Forward to Rust Server
    try {
        const rustServerUrl = "http://localhost:3001/build";
        const response = await fetch(rustServerUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
             throw new Error("Rust Server responded with error: " + response.statusText);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (e: any) {
        // Fallback or explicit error if server not running
        return NextResponse.json({ 
            status: "error", 
            logs: ["Failed to connect to Rust Builder Server. Ensure it is running on port 3001."],
            message: e.message 
        });
    }

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
