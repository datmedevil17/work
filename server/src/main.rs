use anyhow::{Context, Result};
use axum::{
    extract::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::sync::Arc;
use std::{collections::HashMap, net::SocketAddr, path::PathBuf, process::Command};
use tokio::sync::Mutex;
use tower_http::cors::CorsLayer;

#[derive(Deserialize)]
struct BuildRequest {
    files: HashMap<String, String>,
}

#[derive(Serialize)]
struct BuildResponse {
    status: String,
    logs: Vec<String>,
    binary: Option<String>,
    message: Option<String>,
}

// Global lock to prevent concurrent builds on the same folder (MVP limitation)
struct AppState {
    build_lock: Mutex<()>,
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        build_lock: Mutex::new(()),
    });

    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        .route("/build", post(handle_build))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    println!("Builder Server listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn handle_build(
    axum::extract::State(state): axum::extract::State<Arc<AppState>>,
    Json(payload): Json<BuildRequest>,
) -> Json<BuildResponse> {
    // Acquire lock
    let _guard = state.build_lock.lock().await;

    match run_build(payload.files).await {
        Ok((logs, binary)) => Json(BuildResponse {
            status: "success".to_string(),
            logs,
            binary: Some(binary),
            message: None,
        }),
        Err(e) => Json(BuildResponse {
            status: "error".to_string(),
            logs: vec![format!("Internal Error: {}", e)],
            binary: None,
            message: Some(e.to_string()),
        }),
    }
}

async fn run_build(files: HashMap<String, String>) -> Result<(Vec<String>, String)> {
    let mut logs = Vec::new();
    logs.push("Received build request on Rust Server".to_string());

    // We utilize the existing 'solana-workspace' in the parent directory for context consistency
    // In a real generic builder, we would usage tempfile::tempdir() and copy dependencies.
    // For this specific integration, we overwrite the known workspace.

    // Assume we are running in /server, so workspace is ../solana-workspace
    let current_dir = std::env::current_dir()?;
    let workspace_dir = current_dir.parent().unwrap().join("solana-workspace");
    // Standardize Anchor structure: programs/solana_workspace/src/
    let program_dir = workspace_dir.join("programs").join("solana_workspace");
    let src_dir = program_dir.join("src");

    logs.push(format!("Targeting workspace: {:?}", workspace_dir));

    // 1. Clean src directory (optional but recommended to remove deleted files)
    // For safety, we only overwrite files provided in the map

    // 2. Write files
    for (path_str, content) in files {
        let full_path = src_dir.join(&path_str);
        if let Some(parent) = full_path.parent() {
            fs::create_dir_all(parent)?;
        }
        let mut file = fs::File::create(&full_path)?;
        file.write_all(content.as_bytes())?;
        logs.push(format!(
            "Wrote file: programs/solana_workspace/src/{}",
            path_str
        ));
    }

    // 3. Pre-clean: Remove old binary to prevent false positives
    let binary_path = workspace_dir
        .join("target")
        .join("deploy")
        .join("solana_workspace.so");

    if binary_path.exists() {
        let _ = fs::remove_file(&binary_path);
    }

    logs.push("Starting compilation...".to_string());

    // 4. Run anchor build (generates IDL + Binary)
    let output = Command::new("anchor")
        .arg("build")
        .current_dir(&workspace_dir)
        .output()?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    logs.extend(stdout.lines().map(String::from));
    logs.extend(stderr.lines().map(String::from));

    if !output.status.success() {
        logs.push("Build command failed.".to_string());
        return Ok((logs, "".to_string()));
    }

    // 5. Read binary
    if callback_binary_exists(&binary_path) {
        let binary_bytes = fs::read(binary_path)?;
        use base64::{engine::general_purpose, Engine as _};
        let binary_b64 = general_purpose::STANDARD.encode(binary_bytes);
        Ok((logs, binary_b64))
    } else {
        logs.push("Binary not found after successful build.".to_string());
        Ok((logs, "".to_string()))
    }
}

fn callback_binary_exists(path: &PathBuf) -> bool {
    path.exists()
}
