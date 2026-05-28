/** TopToolbar — export, import, validate, and model settings. */

import React, { useRef } from 'react';
import { Download, Upload, ShieldCheck, Settings, Undo2, Redo2 } from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { useUIStore } from '../../stores/uiStore';
import { exportMLnode, importMLnode } from '../../utils/exportImport';
import { validateGraph } from '../../utils/dagValidator';

export default function TopToolbar() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const settings = useGraphStore((s) => s.settings);
  const setSettings = useGraphStore((s) => s.setSettings);
  const setGraph = useGraphStore((s) => s.setGraph);
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);
  const addToast = useUIStore((s) => s.addToast);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const result = validateGraph(nodes, edges, settings.outputNodeId);
    if (!result.valid) {
      result.errors.forEach((e) => addToast(e.message, 'error'));
      return;
    }
    result.warnings.forEach((w) => addToast(w.message, 'info'));
    const json = exportMLnode(nodes, edges, settings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${settings.metadata.name ?? 'model'}.mlnode.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported successfully', 'success');
  };

  const handleImport = () => {
    fileRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = importMLnode(ev.target?.result as string);
        setGraph(result.nodes, result.edges, result.settings);
        addToast('Imported successfully', 'success');
      } catch (err: any) {
        addToast(`Import failed: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleValidate = () => {
    const result = validateGraph(nodes, edges, settings.outputNodeId);
    if (result.valid) {
      addToast(`Graph is valid (${nodes.length} nodes, ${edges.length} edges)`, 'success');
    } else {
      result.errors.forEach((e) => addToast(e.message, 'error'));
    }
    result.warnings.forEach((w) => addToast(w.message, 'info'));
  };

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 border-b border-panel-border bg-panel-bg"
      style={{ height: 48 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
          style={{ background: '#6d5cff', color: '#fff' }}
        >
          M
        </div>
        <span className="text-sm font-semibold text-zinc-200 tracking-wide">MLnode</span>
      </div>

      {/* Model name */}
      <input
        type="text"
        value={settings.metadata.name ?? ''}
        onChange={(e) => setSettings({ metadata: { ...settings.metadata, name: e.target.value } })}
        className="px-2 py-0.5 rounded text-sm bg-transparent border border-transparent
                   hover:border-panel-border focus:border-accent text-zinc-300 focus:outline-none
                   transition-colors w-44 font-medium"
        placeholder="Model name"
      />

      {/* Input shape */}
      <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded border border-panel-border bg-canvas-bg">
        <span className="text-xs text-green-400 font-semibold">shape</span>
        <input
          type="text"
          value={JSON.stringify(settings.inputShape)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              if (Array.isArray(parsed)) setSettings({ inputShape: parsed });
            } catch {}
          }}
          className="px-1 py-0 rounded text-xs font-mono bg-transparent border-none
                     text-zinc-300 focus:outline-none w-36"
          title="Edit input shape — click an Input node for a detailed editor"
        />
      </div>

      <div className="flex-1" />

      {/* Undo/Redo */}
      <ToolbarButton icon={<Undo2 size={14} />} label="Undo" onClick={undo} />
      <ToolbarButton icon={<Redo2 size={14} />} label="Redo" onClick={redo} />

      <div className="w-px h-5 bg-panel-border mx-1" />

      {/* Actions */}
      <ToolbarButton icon={<ShieldCheck size={14} />} label="Validate" onClick={handleValidate} />
      <ToolbarButton icon={<Upload size={14} />} label="Import" onClick={handleImport} />
      <ToolbarButton icon={<Download size={14} />} label="Export" onClick={handleExport} accent />

      <input ref={fileRef} type="file" accept=".json,.mlnode.json" onChange={onFileSelected} className="hidden" />
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
        accent
          ? 'bg-accent text-white hover:bg-accent-light'
          : 'bg-panel-hover text-zinc-400 hover:text-zinc-200'
      }`}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
