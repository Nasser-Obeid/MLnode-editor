/** Graph store — nodes, edges, CRUD, undo/redo. */

import { create } from 'zustand';
import {
  Connection,
  EdgeChange,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import type { RFNode, RFEdge, RFNodeData, ModelSettings } from '../types/reactflow';
import { NODE_DEFAULTS } from '../constants/nodeDefaults';
import { layoutGraph } from '../utils/autoLayout';

interface HistoryEntry {
  nodes: RFNode[];
  edges: RFEdge[];
}

interface GraphState {
  nodes: RFNode[];
  edges: RFEdge[];
  settings: ModelSettings;
  // History
  past: HistoryEntry[];
  future: HistoryEntry[];
  // Actions
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  deleteSelected: () => void;
  updateNodeData: (nodeId: string, data: Partial<RFNodeData>) => void;
  setOutputNode: (nodeId: string) => void;
  setSettings: (s: Partial<ModelSettings>) => void;
  setGraph: (nodes: RFNode[], edges: RFEdge[], settings: ModelSettings) => void;
  tidyLayout: () => void;
  // Undo/redo
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

let nodeCounter = 0;

function generateId(type: string): string {
  nodeCounter++;
  return `${type.toLowerCase()}_${nodeCounter}`;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [
    {
      id: 'input_0',
      type: 'Input',
      position: { x: 100, y: 200 },
      data: { label: 'Input', params: {} },
    },
  ],
  edges: [],
  settings: {
    metadata: { name: 'Untitled Model' },
    inputShape: ['B', 3, 224, 224],
    outputNodeId: '',
  },
  past: [],
  future: [],

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    get().pushHistory();
    const edge = {
      ...connection,
      id: `e-${Date.now()}`,
    };
    set({ edges: addEdge(edge, get().edges) });
  },

  addNode: (type, position) => {
    get().pushHistory();
    const id = generateId(type);
    const defaults = NODE_DEFAULTS[type] ?? {};
    const newNode: RFNode = {
      id,
      type,
      position,
      data: {
        label: `${type}`,
        params: { ...defaults },
        ...(type === 'Split' ? { outputs: ['part1', 'part2'] } : {}),
        ...(type === 'HF_Pretrained' ? { hf_model: 'bert-base-uncased' } : {}),
        ...(type === 'HF_Config' ? { hf_config: 'GPT2Config' } : {}),
      },
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  deleteSelected: () => {
    get().pushHistory();
    const nodes = get().nodes.filter((n) => !n.selected);
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = get().edges.filter(
      (e) => !e.selected && nodeIds.has(e.source) && nodeIds.has(e.target)
    );
    // Clear outputNodeId if the output node was deleted
    const settings = get().settings;
    const newSettings = nodeIds.has(settings.outputNodeId)
      ? settings
      : { ...settings, outputNodeId: '' };
    set({ nodes, edges, settings: newSettings });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    });
  },

  setOutputNode: (nodeId) => {
    set({
      settings: { ...get().settings, outputNodeId: nodeId },
    });
  },

  setSettings: (s) => {
    set({ settings: { ...get().settings, ...s } });
  },

  setGraph: (nodes, edges, settings) => {
    // Sync counter to avoid ID collisions: parse max numeric suffix from existing IDs
    let maxCounter = 0;
    for (const n of nodes) {
      const match = n.id.match(/_(\d+)$/);
      if (match) maxCounter = Math.max(maxCounter, parseInt(match[1], 10));
    }
    nodeCounter = Math.max(maxCounter, nodes.length);
    set({ nodes, edges, settings, past: [], future: [] });
  },

  tidyLayout: () => {
    get().pushHistory();
    set({ nodes: layoutGraph(get().nodes, get().edges) });
  },

  pushHistory: () => {
    const { nodes, edges, past } = get();
    set({
      past: [...past.slice(-30), { nodes: structuredClone(nodes), edges: structuredClone(edges) }],
      future: [],
    });
  },

  undo: () => {
    const { past, nodes, edges } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [{ nodes: structuredClone(nodes), edges: structuredClone(edges) }, ...get().future],
      nodes: prev.nodes,
      edges: prev.edges,
    });
  },

  redo: () => {
    const { future, nodes, edges } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      future: future.slice(1),
      past: [...get().past, { nodes: structuredClone(nodes), edges: structuredClone(edges) }],
      nodes: next.nodes,
      edges: next.edges,
    });
  },
}));
