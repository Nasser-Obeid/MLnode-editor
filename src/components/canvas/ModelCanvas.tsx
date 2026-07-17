/** ModelCanvas — the main ReactFlow wrapper with keyboard shortcuts. */

import React, { useCallback, useEffect, useRef, DragEvent } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './nodeTypes';
import { useGraphStore } from '../../stores/graphStore';
import { useUIStore } from '../../stores/uiStore';

export default function ModelCanvas() {
  const rfRef = useRef<ReactFlowInstance | null>(null);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const addNode = useGraphStore((s) => s.addNode);
  const deleteSelected = useGraphStore((s) => s.deleteSelected);
  const setOutputNode = useGraphStore((s) => s.setOutputNode);
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);
  const selectNode = useUIStore((s) => s.selectNode);
  const fitViewNonce = useUIStore((s) => s.fitViewNonce);

  // Re-fit the viewport when import/tidy reshapes the graph.
  useEffect(() => {
    if (fitViewNonce > 0) {
      rfRef.current?.fitView({ padding: 0.15, duration: 300 });
    }
  }, [fitViewNonce]);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/mlnode-type');
      if (!type || !rfRef.current) return;

      const pos = rfRef.current.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      addNode(type, pos);
    },
    [addNode]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        if (e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
        if (e.key === 'Z') { e.preventDefault(); redo(); }
      }
    },
    [deleteSelected, undo, redo]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: any) => {
      e.preventDefault();
      setOutputNode(node.id);
    },
    [setOutputNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div
      className="flex-1 h-full"
      onKeyDown={onKeyDown}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={(rf) => { rfRef.current = rf; }}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={null}
          style={{ background: '#0e0e12' }}
          defaultEdgeOptions={{
            style: { stroke: '#52525b', strokeWidth: 2 },
            type: 'smoothstep',
          }}
        >
          <Background color="#1a1a22" gap={20} size={1} />
          <Controls
            style={{
              background: '#141418',
              border: '1px solid #27272f',
              borderRadius: 8,
            }}
          />
          <MiniMap
            style={{
              background: '#141418',
              border: '1px solid #27272f',
              borderRadius: 8,
            }}
            nodeColor={(n) => {
              if (n.type === 'Input') return '#22c55e';
              return '#3b82f6';
            }}
            maskColor="rgba(0,0,0,0.7)"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
