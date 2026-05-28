/** MLnode JSON types — the exported format consumed by the Python backend. */

export type Dim = string | number;
export type Shape = Dim[];

export interface MLnodeMetadata {
  name?: string;
  description?: string;
  author?: string;
}

export interface MLnodeBlockDefinition {
  input_node: string;
  output_node: string;
  nodes: MLnodeNode[];
  edges: MLnodeEdge[];
}

export interface MLnodeNode {
  id: string;
  type: string;
  params: Record<string, any>;
  // Optional fields
  shared_id?: string;
  outputs?: string[];
  reduction?: 'concat' | 'add' | 'stack';
  reduction_dim?: number;
  // HuggingFace (top-level, NOT inside params)
  hf_model?: string;
  hf_config?: string;
  // Custom layer (top-level, NOT inside params)
  path?: string;
  // Block
  block?: MLnodeBlockDefinition;
  block_ref?: string;
}

export interface MLnodeEdge {
  source: string;
  source_port: string | null;
  target: string;
  target_port: string | null;
}

export interface MLnodeModel {
  mlnode_schema_version: string;
  metadata?: MLnodeMetadata;
  input_shape: Dim[];
  output_node: string;
  nodes: MLnodeNode[];
  edges: MLnodeEdge[];
}

/** Reduction ops — implicit reduction, no `reduction` field allowed. */
export const REDUCTION_OPS = new Set([
  'Add', 'Subtract', 'Multiply', 'Divide', 'Concat', 'Stack',
]);

/** Elementwise ops — all input shapes must be identical. */
export const ELEMENTWISE_OPS = new Set([
  'Add', 'Subtract', 'Multiply', 'Divide',
]);

/** Tensor ops with no learnable parameters. */
export const TENSOR_OPS = new Set([
  'Flatten', 'Reshape', 'Permute', 'Transpose', 'View',
  'Unsqueeze', 'Squeeze', 'Split',
]);
