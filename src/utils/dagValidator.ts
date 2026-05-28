/** DAG validation — cycle detection and orphan checking. */

import type { RFNode, RFEdge } from '../types/reactflow';
import { REDUCTION_OPS } from '../types/mlnode';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'cycle' | 'duplicate_id' | 'no_output' | 'missing_param' | 'missing_path' | 'missing_block' | 'reduction_on_op';
  message: string;
  nodeIds?: string[];
  edgeIds?: string[];
}

export interface ValidationWarning {
  type: 'orphan' | 'shared_mismatch';
  message: string;
  nodeIds: string[];
}

export function validateGraph(
  nodes: RFNode[],
  edges: RFEdge[],
  outputNodeId: string
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Duplicate IDs
  const idSet = new Set<string>();
  const dupes = new Set<string>();
  for (const n of nodes) {
    if (idSet.has(n.id)) dupes.add(n.id);
    idSet.add(n.id);
  }
  if (dupes.size > 0) {
    errors.push({
      type: 'duplicate_id',
      message: `Duplicate node IDs: ${[...dupes].join(', ')}`,
      nodeIds: [...dupes],
    });
  }

  // 2. output_node not set or doesn't exist
  if (!outputNodeId) {
    errors.push({
      type: 'no_output',
      message: 'No output node selected. Right-click a node → "Set as output".',
    });
  } else if (!nodes.some((n) => n.id === outputNodeId)) {
    errors.push({
      type: 'no_output',
      message: `Output node "${outputNodeId}" not found. It may have been deleted.`,
    });
  }

  // 3. Cycle detection (DFS)
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.source)?.push(e.target);
  }

  const visited = new Set<string>();
  const stack = new Set<string>();
  let hasCycle = false;
  const cycleNodes: string[] = [];

  function dfs(node: string): boolean {
    if (stack.has(node)) {
      hasCycle = true;
      cycleNodes.push(node);
      return true;
    }
    if (visited.has(node)) return false;
    visited.add(node);
    stack.add(node);
    for (const neighbor of adj.get(node) ?? []) {
      if (dfs(neighbor)) {
        cycleNodes.push(node);
        return true;
      }
    }
    stack.delete(node);
    return false;
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) dfs(n.id);
  }

  if (hasCycle) {
    errors.push({
      type: 'cycle',
      message: `Cycle detected in graph`,
      nodeIds: cycleNodes,
    });
  }

  // 4. Orphan detection (not reachable from any Input)
  const inputIds = nodes.filter((n) => n.type === 'Input').map((n) => n.id);
  const reachable = new Set<string>();

  function bfs(start: string) {
    const queue = [start];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (reachable.has(cur)) continue;
      reachable.add(cur);
      for (const neighbor of adj.get(cur) ?? []) {
        queue.push(neighbor);
      }
    }
  }

  for (const id of inputIds) bfs(id);

  const orphans = nodes.filter((n) => n.type !== 'Input' && !reachable.has(n.id));
  if (orphans.length > 0) {
    warnings.push({
      type: 'orphan',
      message: `Disconnected nodes: ${orphans.map((n) => n.id).join(', ')}`,
      nodeIds: orphans.map((n) => n.id),
    });
  }

  // 5. Custom node missing path
  for (const n of nodes) {
    if (n.type === 'custom' && !n.data.path) {
      errors.push({
        type: 'missing_path',
        message: `Custom node "${n.id}" requires a path.`,
        nodeIds: [n.id],
      });
    }
  }

  // 6. Block node missing definition
  for (const n of nodes) {
    if (n.type === 'Block' && !n.data.block && !n.data.block_ref) {
      errors.push({
        type: 'missing_block',
        message: `Block node "${n.id}" requires a block definition or reference.`,
        nodeIds: [n.id],
      });
    }
  }

  // 7. Reduction field on reduction op
  for (const n of nodes) {
    if (REDUCTION_OPS.has(n.type ?? '') && n.data.reduction) {
      errors.push({
        type: 'reduction_on_op',
        message: `"${n.id}" (${n.type}) has implicit reduction. Remove the reduction field.`,
        nodeIds: [n.id],
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
