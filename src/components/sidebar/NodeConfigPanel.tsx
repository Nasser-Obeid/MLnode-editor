/** NodeConfigPanel — params editor for the selected node. */

import React from 'react';
import { X, Target, Trash2 } from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { useUIStore } from '../../stores/uiStore';
import { getNodeColor } from '../../constants/nodeCategories';
import { REDUCTION_OPS } from '../../types/mlnode';

export default function NodeConfigPanel() {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const selectNode = useUIStore((s) => s.selectNode);
  const nodes = useGraphStore((s) => s.nodes);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const setOutputNode = useGraphStore((s) => s.setOutputNode);
  const deleteSelected = useGraphStore((s) => s.deleteSelected);
  const outputNodeId = useGraphStore((s) => s.settings.outputNodeId);
  const settings = useGraphStore((s) => s.settings);
  const setSettings = useGraphStore((s) => s.setSettings);

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const color = getNodeColor(node.type ?? 'Linear');
  const isReductionOp = REDUCTION_OPS.has(node.type ?? '');
  const isInputNode = node.type === 'Input';

  // Determine which Input node index this is (for multi-input display)
  const inputNodes = nodes.filter((n) => n.type === 'Input');
  const inputIndex = inputNodes.findIndex((n) => n.id === node.id);

  const updateParam = (key: string, raw: string) => {
    const params = { ...node.data.params };
    // Try parsing as number, then JSON array/object, else keep string
    const num = Number(raw);
    if (raw === '') {
      delete params[key];
    } else if (!isNaN(num) && raw.trim() !== '') {
      params[key] = num;
    } else if (raw.startsWith('[') || raw.startsWith('{')) {
      try { params[key] = JSON.parse(raw); } catch { params[key] = raw; }
    } else if (raw === 'true') {
      params[key] = true;
    } else if (raw === 'false') {
      params[key] = false;
    } else {
      params[key] = raw;
    }
    updateNodeData(node.id, { params });
  };

  const addParam = () => {
    const key = prompt('Parameter name:');
    if (!key) return;
    updateParam(key, '0');
  };

  return (
    <div className="w-72 h-full overflow-y-auto border-l border-panel-border bg-panel-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
            {node.type}
          </div>
          <div className="text-sm text-zinc-300 font-mono mt-0.5">{node.id}</div>
        </div>
        <button onClick={() => selectNode(null)} className="text-zinc-500 hover:text-zinc-300">
          <X size={16} />
        </button>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 flex gap-2 border-b border-panel-border">
        <button
          onClick={() => setOutputNode(node.id)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
            node.id === outputNodeId
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-panel-hover text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Target size={12} />
          {node.id === outputNodeId ? 'Output ✓' : 'Set Output'}
        </button>
        <button
          onClick={deleteSelected}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-panel-hover text-red-400 hover:text-red-300"
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>

      {/* Input Shape — shown when an Input node is selected */}
      {isInputNode && (
        <div className="px-4 py-3 border-b border-panel-border">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#22c55e' }}>
            Input Shape
          </div>
          {inputNodes.length > 1 && (
            <div className="text-xs text-zinc-500 mb-2">
              Input #{inputIndex + 1} of {inputNodes.length} — maps to forward() arg[{inputIndex}]
            </div>
          )}

          {/* Dimension editors */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {settings.inputShape.map((dim, i) => (
              <input
                key={i}
                type="text"
                value={String(dim)}
                onChange={(e) => {
                  const newShape = [...settings.inputShape];
                  const raw = e.target.value.trim();
                  const num = Number(raw);
                  newShape[i] = !isNaN(num) && raw !== '' ? num : raw;
                  setSettings({ inputShape: newShape });
                }}
                className="w-14 px-1.5 py-1 rounded text-xs font-mono text-center bg-canvas-bg border
                           border-panel-border text-zinc-200 focus:border-green-500 focus:outline-none
                           transition-colors"
                title={`Dimension ${i}: ${typeof dim === 'string' ? 'symbolic' : 'concrete'}`}
              />
            ))}
          </div>

          {/* Add/remove dimension buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSettings({ inputShape: [...settings.inputShape, 1] })}
              className="text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              + Add dim
            </button>
            {settings.inputShape.length > 1 && (
              <button
                onClick={() => setSettings({ inputShape: settings.inputShape.slice(0, -1) })}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                − Remove last
              </button>
            )}
          </div>

          {/* Shape preview */}
          <div className="mt-2 text-xs text-zinc-500 font-mono">
            → ({settings.inputShape.join(', ')})
          </div>
        </div>
      )}

      {/* Params */}
      <div className="px-4 py-3">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Parameters
        </div>
        {Object.entries(node.data.params).map(([key, value]) => (
          <div key={key} className="mb-2">
            <label className="block text-xs text-zinc-500 mb-0.5 font-mono">{key}</label>
            <input
              type="text"
              value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
              onChange={(e) => updateParam(key, e.target.value)}
              className="w-full px-2 py-1 rounded text-xs font-mono bg-canvas-bg border border-panel-border
                         text-zinc-200 focus:border-accent focus:outline-none transition-colors"
            />
          </div>
        ))}
        <button
          onClick={addParam}
          className="text-xs text-accent hover:text-accent-light transition-colors mt-1"
        >
          + Add parameter
        </button>
      </div>

      {/* Custom layer path */}
      {node.type === 'custom' && (
        <div className="px-4 py-3 border-t border-panel-border">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Import Path
          </div>
          <input
            type="text"
            value={node.data.path ?? ''}
            onChange={(e) => updateNodeData(node.id, { path: e.target.value })}
            placeholder="e.g. user.layers.MyLayer"
            className="w-full px-2 py-1 rounded text-xs font-mono bg-canvas-bg border border-panel-border
                       text-zinc-200 focus:border-accent focus:outline-none"
          />
        </div>
      )}

      {/* HuggingFace fields */}
      {(node.data.hf_model != null || node.data.hf_config != null) && (
        <div className="px-4 py-3 border-t border-panel-border">
          <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
            🤗 HuggingFace
          </div>
          {node.data.hf_model != null && (
            <div className="mb-2">
              <label className="block text-xs text-zinc-500 mb-0.5 font-mono">hf_model</label>
              <input
                type="text"
                value={node.data.hf_model}
                onChange={(e) => updateNodeData(node.id, { hf_model: e.target.value })}
                className="w-full px-2 py-1 rounded text-xs font-mono bg-canvas-bg border border-panel-border
                           text-zinc-200 focus:border-accent focus:outline-none"
              />
            </div>
          )}
          {node.data.hf_config != null && (
            <div className="mb-2">
              <label className="block text-xs text-zinc-500 mb-0.5 font-mono">hf_config</label>
              <input
                type="text"
                value={node.data.hf_config}
                onChange={(e) => updateNodeData(node.id, { hf_config: e.target.value })}
                className="w-full px-2 py-1 rounded text-xs font-mono bg-canvas-bg border border-panel-border
                           text-zinc-200 focus:border-accent focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Shared ID */}
      <div className="px-4 py-3 border-t border-panel-border">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Weight Sharing
        </div>
        <input
          type="text"
          value={node.data.shared_id ?? ''}
          onChange={(e) =>
            updateNodeData(node.id, { shared_id: e.target.value || undefined })
          }
          placeholder="shared_id (optional)"
          className="w-full px-2 py-1 rounded text-xs font-mono bg-canvas-bg border border-panel-border
                     text-zinc-200 focus:border-accent focus:outline-none"
        />
      </div>

      {/* Fallback reduction (only for non-reduction-op nodes) */}
      {!isReductionOp && node.type !== 'Input' && (
        <div className="px-4 py-3 border-t border-panel-border">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Fallback Reduction
          </div>
          <select
            value={node.data.reduction ?? ''}
            onChange={(e) =>
              updateNodeData(node.id, {
                reduction: (e.target.value || undefined) as any,
              })
            }
            className="w-full px-2 py-1 rounded text-xs font-mono bg-canvas-bg border border-panel-border
                       text-zinc-200 focus:border-accent focus:outline-none"
          >
            <option value="">None</option>
            <option value="concat">concat</option>
            <option value="add">add</option>
            <option value="stack">stack</option>
          </select>
        </div>
      )}

      {/* Multi-output ports */}
      {node.type === 'Split' && (
        <div className="px-4 py-3 border-t border-panel-border">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Output Ports
          </div>
          <input
            type="text"
            value={(node.data.outputs ?? []).join(', ')}
            onChange={(e) =>
              updateNodeData(node.id, {
                outputs: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder="part1, part2"
            className="w-full px-2 py-1 rounded text-xs font-mono bg-canvas-bg border border-panel-border
                       text-zinc-200 focus:border-accent focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
