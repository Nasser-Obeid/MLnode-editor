/** Zod schemas — mirrors the Python backend's Pydantic models exactly. */

import { z } from 'zod';

export const MLnodeBlockSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    input_node: z.string(),
    output_node: z.string(),
    nodes: z.array(MLnodeNodeSchema),
    edges: z.array(MLnodeEdgeSchema),
  })
);

export const MLnodeNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string(),
  params: z.record(z.any()).default({}),
  shared_id: z.string().optional(),
  outputs: z.array(z.string()).optional(),
  reduction: z.enum(['concat', 'add', 'stack']).optional(),
  reduction_dim: z.number().optional(),
  hf_model: z.string().optional(),
  hf_config: z.string().optional(),
  path: z.string().optional(),
  block: MLnodeBlockSchema.optional(),
  block_ref: z.string().optional(),
});

export const MLnodeEdgeSchema = z.object({
  source: z.string(),
  source_port: z.string().nullable().default(null),
  target: z.string(),
  target_port: z.string().nullable().default(null),
});

export const MLnodeModelSchema = z.object({
  mlnode_schema_version: z.literal('1.0'),
  metadata: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      author: z.string().optional(),
    })
    .optional(),
  input_shape: z.array(z.union([z.string(), z.number()])),
  output_node: z.string(),
  nodes: z.array(MLnodeNodeSchema),
  edges: z.array(MLnodeEdgeSchema),
});

export type MLnodeModelParsed = z.infer<typeof MLnodeModelSchema>;
