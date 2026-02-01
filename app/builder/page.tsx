'use client'
import React, { useCallback, useState } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, addEdge, Connection, Edge, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ToolsLayout from "@/components/ToolsLayout";
import { Sidebar } from '@/components/builder/Sidebar';
import { CustomNode } from '@/components/builder/CustomNodes';
import { Play, Download } from 'lucide-react';

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes = [
  { id: '1', type: 'custom', position: { x: 250, y: 5 }, data: { label: 'Start Flow', type: 'trigger' } },
];

function BuilderContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }
      
      const label = event.dataTransfer.getData('application/label');
      const nodeType = event.dataTransfer.getData('application/nodeType');

      // Accurate projection using component hook
      const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY
      });

      const newNode = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'custom',
        position,
        data: { label: label, type: nodeType },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, screenToFlowPosition],
  );

  const runFlow = () => {
      setExecutionLog(["Starting Execution..."]);
      
      // Simple mock execution engine
      let delay = 500;
      nodes.forEach((node) => {
          setTimeout(() => {
             setExecutionLog(prev => [...prev, `Executing: ${node.data.label} (${node.id})`]);
             if (node.data.type === 'blockchain') {
                 setExecutionLog(prev => [...prev, `> Interacting with Solana... Success`]);
             }
          }, delay);
          delay += 800;
      });
      
      setTimeout(() => {
          setExecutionLog(prev => [...prev, "Flow Completed!"]);
      }, delay + 500);
  };

    return (
      <div className="flex h-full">
        <Sidebar />
        <div className="flex-1 h-full relative bg-zinc-50 dark:bg-zinc-950">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button 
                    onClick={runFlow}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full shadow-lg font-medium transition-transform active:scale-95"
                >
                    <Play className="w-4 h-4 fill-current" /> Run Flow
                </button>
                <button className="bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 p-2 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                    <Download className="w-4 h-4" />
                </button>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                onDragOver={onDragOver}
                onDrop={onDrop}
                fitView
            >
                <Background gap={16} size={1} />
                <Controls />
            </ReactFlow>

            {/* Execution Console */}
            {executionLog.length > 0 && (
                <div className="absolute bottom-4 left-4 right-4 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-300 shadow-2xl max-h-48 overflow-y-auto">
                    <div className="text-zinc-500 font-bold mb-2 uppercase tracking-wider">Console Output</div>
                    {executionLog.map((log, i) => (
                        <div key={i} className="border-l-2 border-zinc-700 pl-2 mb-1">
                            {log}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    );
}

export default function BuilderPage() {
  return (
    <ToolsLayout>
        <ReactFlowProvider>
            <BuilderContent />
        </ReactFlowProvider>
    </ToolsLayout>
  );
}
