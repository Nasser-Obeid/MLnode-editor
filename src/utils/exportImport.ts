/** RF ↔ MLnode transform — the critical export/import layer. */

import type { RFNode, RFEdge, ModelSettings } from '../types/reactflow';
import type { MLnodeModel } from '../types/mlnode';
import { INPUT_PORTS } from '../types/mlnode';
import { MLnodeModelSchema } from './jsonSchema';
import { layoutGraph } from './autoLayout';

/**
 * Export: ReactFlow state → MLnode JSON string.
 * Strips position, label, and all RF-only fields.
 */
export function exportMLnode(
  nodes: RFNode[],
  edges: RFEdge[],
  settings: ModelSettings
): string {
  const mlnode: MLnodeModel = {
    mlnode_schema_version: '1.0',
    metadata: settings.metadata,
    input_shape: settings.inputShape,
    output_node: settings.outputNodeId,
    nodes: nodes.map((n) => {
      const d = n.data;
      const out: any = {
        id: n.id,
        type: n.type ?? 'Linear',
        params: d.params ?? {},
      };
      if (d.shared_id) out.shared_id = d.shared_id;
      if (d.outputs) out.outputs = d.outputs;
      if (d.reduction) out.reduction = d.reduction;
      if (d.reduction_dim != null) out.reduction_dim = d.reduction_dim;
      if (d.hf_model) out.hf_model = d.hf_model;
      if (d.hf_config) out.hf_config = d.hf_config;
      if (d.path) out.path = d.path;
      if (d.block) out.block = d.block;
      if (d.block_ref) out.block_ref = d.block_ref;
      return out;
    }),
    edges: edges.map((e) => ({
      source: e.source,
      source_port: e.sourceHandle ?? null,
      target: e.target,
      target_port: e.targetHandle ?? null,
    })),
  };
  return JSON.stringify(mlnode, null, 2);
}

/**
 * Import: MLnode JSON string → ReactFlow state.
 * Validates against Zod schema, creates RF nodes, then applies the layered
 * auto-layout (the .mlnode.json format carries no positions).
 */
export function importMLnode(json: string): {
  nodes: RFNode[];
  edges: RFEdge[];
  settings: ModelSettings;
} {
  const raw = JSON.parse(json);
  const data = MLnodeModelSchema.parse(raw);

  const nodes: RFNode[] = data.nodes.map((n: any) => ({
    id: n.id,
    type: n.type,
    position: { x: 0, y: 0 }, // replaced by layoutGraph below
    data: {
      label: `${n.type} (${n.id})`,
      params: n.params ?? {},
      ...(n.shared_id && { shared_id: n.shared_id }),
      ...(n.outputs && { outputs: n.outputs }),
      ...(n.reduction && { reduction: n.reduction }),
      ...(n.reduction_dim != null && { reduction_dim: n.reduction_dim }),
      ...(n.hf_model && { hf_model: n.hf_model }),
      ...(n.hf_config && { hf_config: n.hf_config }),
      ...(n.path && { path: n.path }),
      ...(n.block && { block: n.block }),
      ...(n.block_ref && { block_ref: n.block_ref }),
    },
  }));

  // Multi-input nodes render one handle per named port. Backfill target_port
  // on unlabeled edges by declaration order — the same fallback the Python
  // executor applies — so imported edges attach to the right handles.
  const typeById = new Map(data.nodes.map((n: any) => [n.id, n.type]));
  const portCursor = new Map<string, number>();
  const edges: RFEdge[] = data.edges.map((e: any, i: number) => {
    let targetHandle = e.target_port ?? undefined;
    const ports = INPUT_PORTS[typeById.get(e.target) ?? ''];
    if (ports && !targetHandle) {
      const used = portCursor.get(e.target) ?? 0;
      targetHandle = ports[Math.min(used, ports.length - 1)];
      portCursor.set(e.target, used + 1);
    }
    return {
      id: `e-${i}`,
      source: e.source,
      sourceHandle: e.source_port ?? undefined,
      target: e.target,
      targetHandle,
    };
  });

  return {
    nodes: layoutGraph(nodes, edges),
    edges,
    settings: {
      metadata: data.metadata ?? {},
      inputShape: data.input_shape,
      outputNodeId: data.output_node,
    },
  };
}
