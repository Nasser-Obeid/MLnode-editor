/** RF ↔ MLnode transform — the critical export/import layer. */

import type { RFNode, RFEdge, ModelSettings } from '../types/reactflow';
import type { MLnodeModel } from '../types/mlnode';
import { MLnodeModelSchema } from './jsonSchema';

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
 * Validates against Zod schema, then creates RF nodes with grid layout.
 */
export function importMLnode(json: string): {
  nodes: RFNode[];
  edges: RFEdge[];
  settings: ModelSettings;
} {
  const raw = JSON.parse(json);
  const data = MLnodeModelSchema.parse(raw);

  const nodes: RFNode[] = data.nodes.map((n: any, i: number) => ({
    id: n.id,
    type: n.type,
    position: { x: (i % 4) * 280 + 40, y: Math.floor(i / 4) * 160 + 40 },
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

  const edges: RFEdge[] = data.edges.map((e: any, i: number) => ({
    id: `e-${i}`,
    source: e.source,
    sourceHandle: e.source_port ?? undefined,
    target: e.target,
    targetHandle: e.target_port ?? undefined,
  }));

  return {
    nodes,
    edges,
    settings: {
      metadata: data.metadata ?? {},
      inputShape: data.input_shape,
      outputNodeId: data.output_node,
    },
  };
}
