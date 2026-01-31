"use client";

import React from "react";
import { Loader2, Hammer, Rocket } from "lucide-react";

interface DeployPanelProps {
  onBuild: () => void;
  onDeploy: () => void;
  onDeployClient: () => void;
  isBuilding: boolean;
  isDeploying: boolean;
  isBuilt: boolean;
}

const DeployPanel: React.FC<DeployPanelProps> = ({
  onBuild,
  onDeploy,
  onDeployClient,
  isBuilding,
  isDeploying,
  isBuilt,
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm h-full">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Action Center
      </h2>
      
      <div className="flex flex-col gap-3">
        <button
          onClick={onBuild}
          disabled={isBuilding || isDeploying}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isBuilding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Hammer className="w-4 h-4" />
          )}
          {isBuilding ? "Building..." : "Build Program"}
        </button>

        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 uppercase">Deployment</span>
            
            <button
            onClick={onDeploy}
            disabled={!isBuilt || isDeploying || isBuilding}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-zinc-600 hover:bg-zinc-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
            {isDeploying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Rocket className="w-4 h-4" />
            )}
            {isDeploying ? "Deploying..." : "Server Deploy (Airdrop)"}
            </button>

            <button
            onClick={onDeployClient}
            disabled={!isBuilt || isDeploying || isBuilding}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
            {isDeploying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Rocket className="w-4 h-4" />
            )}
            {isDeploying ? "Deploying..." : "Deploy with Wallet"}
            </button>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          <p className="font-medium mb-1">Status:</p>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isDeploying
                  ? "bg-yellow-500 animate-pulse"
                  : isBuilt
                  ? "bg-emerald-500"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            />
            <span>
              {isDeploying
                ? "Deploying to network..."
                : isBuilt
                ? "Ready for deployment"
                : "Waiting for build"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeployPanel;
