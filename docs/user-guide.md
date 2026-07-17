# User Guide

A tour of every surface in mlnode-editor. For the exported file format, see the backend's [json-schema.md](https://github.com/Nasser-Obeid/MLnode/blob/main/docs/json-schema.md).

## Layout

```
┌──────────────────────── Top Toolbar ────────────────────────┐
│ logo · model name · input shape · undo/redo · Tidy ·        │
│ Validate · Import · Export                                  │
├──────────┬────────────────────────────────┬─────────────────┤
│ Node     │                                │ Node Config     │
│ Library  │           Canvas               │ Panel           │
│ (palette)│        (ReactFlow)             │ (when a node    │
│          │                                │  is selected)   │
└──────────┴────────────────────────────────┴─────────────────┘
```

Toasts (success/info/error) appear in the corner and disappear after 4 seconds.

## Top Toolbar

- **Model name** — inline text field; becomes `metadata.name` and the exported filename (`<name>.mlnode.json`).
- **shape** — the graph's `input_shape` as JSON, e.g. `["B", 3, 224, 224]`. The field only applies while the text parses as a JSON array. For a friendlier per-dimension editor, click an Input node.
- **Undo / Redo** — history covers structural changes (add node, connect, delete, Tidy); the last 30 states are kept. Parameter edits are applied live and are *not* part of the history.
- **Tidy** — re-runs the auto-layout on the current graph and re-fits the viewport. Undoable.
- **Validate** — runs the structural checks (below) and reports via toasts.
- **Import** — opens a file picker for `.json` / `.mlnode.json`. The file is validated against the schema, laid out automatically (the format carries no positions), and replaces the current graph. Import clears the undo history.
- **Export** — validates first; on errors it refuses and shows them as toasts. On success it downloads `<name>.mlnode.json`.

`Ctrl/Cmd + S` anywhere is a **quick-save**: it downloads the JSON immediately *without* validation — useful for saving work-in-progress graphs that don't validate yet.

## Node Library (Palette)

Layers are grouped by PyTorch category, each with a color. Click a category header to expand/collapse; drag an entry onto the canvas to create a node. New nodes get:

- an auto-generated ID (`conv2d_7`),
- default params matching the `torch.nn` constructor (see `src/constants/nodeDefaults.ts`) — sequence layers (`RNN`, `LSTM`, `GRU`, `MultiheadAttention`, transformer family) include `batch_first: true` because the backend's shape rules assume it,
- for `Split`: default output ports `part1, part2`.

> The HuggingFace palette entries are currently disabled (commented out in `nodeCategories.ts`), but imported graphs containing `hf_model`/`hf_config` nodes render and can be edited — see [huggingface.md](https://github.com/Nasser-Obeid/MLnode/blob/main/docs/huggingface.md).

## Canvas

- **Connect**: drag from a node's right-side handle to another node's left-side handle.
- **Multi-input layers** (`Transformer`, `TransformerDecoder(-Layer)`, `MultiheadAttention`, `Bilinear`) show one labeled handle per port (`src`/`tgt`, `tgt`/`memory`, `query`/`key`/`value`, `input1`/`input2`). The handle you attach to is exported as the edge's `target_port`.
- **Multi-output nodes** (`Split`) show one labeled handle per declared output port; the handle becomes `source_port`.
- **Select** a node (click) to open the config panel; click empty canvas to deselect.
- **Right-click** a node to set it as the model output (yellow border + `OUTPUT` badge).
- **Delete/Backspace** removes the selection. Edges attached to deleted nodes are cleaned up; deleting the output node clears the output setting.
- Minimap and zoom controls sit in the corners; `Tidy` + auto-fit keep large graphs readable.

Node cards show the type (color-coded), the node ID, up to three params, and badges for output status, inline/referenced blocks, and HuggingFace models. Input nodes display the current input shape.

## Node Config Panel

Opens when a node is selected.

- **Set Output / Delete** — same actions as right-click / keyboard.
- **Input Shape** (Input nodes only) — edit each dimension in place; type a number for a concrete dim or a name (`B`, `Seq`, `D`, …) for a symbolic one. `+ Add dim` / `− Remove last` change the rank. With several Input nodes the panel shows which `forward()` argument this node maps to. **The shape is global** — schema v1.0 feeds the same `input_shape` to every Input node.
- **Parameters** — every param is a free-form field with type sniffing: numeric text becomes a number, `[...]`/`{...}` parses as JSON, `true`/`false` become booleans, anything else stays a string, and clearing a field deletes the param. `+ Add parameter` prompts for a name.
- **Import Path** (`custom` nodes) — the dotted path to your `nn.Module` subclass, e.g. `user.layers.MyLayer`. Required for export.
- **🤗 HuggingFace** — `hf_model` / `hf_config` fields, shown only when the node already carries them (e.g. from an imported file).
- **Weight Sharing** — set the same `shared_id` on two or more nodes to share one module instance. The backend requires identical `type` and `params` across the group.
- **Fallback Reduction** — `concat` / `add` / `stack` for non-reduction nodes that receive multiple inputs. Hidden on reduction ops (`Add`, `Concat`, …), which reduce implicitly — setting it there is a validation error.
- **Output Ports** (`Split` nodes) — comma-separated port names; handles update live.

## Validation

**Validate** and **Export** run these structural checks (`src/utils/dagValidator.ts`):

| Check | Severity |
|-------|----------|
| Duplicate node IDs | error |
| No output node set, or it was deleted | error |
| Cycle in the graph | error |
| `custom` node without an import path | error |
| `Block` node without `block`/`block_ref` | error |
| `reduction` field on a reduction op | error |
| Nodes unreachable from any Input | warning |

Shape correctness (do the tensors actually fit?) is **not** checked in the editor — that's the backend's `model.validate()`. The client-side shape checker (`shapeValidator.ts`) is a placeholder for a future release.

## Import Details

Imports are validated with Zod against the same schema the backend enforces (`mlnode_schema_version` must be `"1.0"`). Two conveniences on top:

- **Auto-layout** — nodes are ranked left-to-right by dependency, crossings reduced, and rows spaced by estimated card height.
- **Port backfill** — unlabeled edges into multi-input nodes are assigned `target_port` by declaration order (the same fallback the Python executor uses), so older files attach to the correct labeled handles and re-export cleanly.

Files exported by `MLnodeModel.save()` — including `expanded=True` flattened graphs — import fine; namespaced IDs like `res1/conv` are just IDs to the editor.
