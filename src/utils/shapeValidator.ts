/**
 * Advisory shape inference — lightweight client-side shape tracking.
 *
 * This is UX sugar only. The Python backend is the shape authority.
 * Green = compatible, Red = definite mismatch, Gray = unknown.
 *
 * TODO: Implement in Week 5 per roadmap.
 */

export type ShapeStatus = 'valid' | 'error' | 'unknown';

export interface EdgeShapeInfo {
  edgeId: string;
  status: ShapeStatus;
  message?: string;
}

/**
 * Placeholder — returns 'unknown' for all edges.
 * Will be replaced with shape propagation logic in Week 5.
 */
export function inferEdgeShapes(
  _nodes: any[],
  edges: any[]
): Map<string, EdgeShapeInfo> {
  const result = new Map<string, EdgeShapeInfo>();
  for (const e of edges) {
    result.set(e.id, { edgeId: e.id, status: 'unknown' });
  }
  return result;
}
