/** App — root component composing toolbar, sidebar, canvas, config panel. */

import React, { useCallback, useEffect } from 'react';
import TopToolbar from './components/toolbar/TopToolbar';
import NodeLibrary from './components/sidebar/NodeLibrary';
import ModelCanvas from './components/canvas/ModelCanvas';
import NodeConfigPanel from './components/sidebar/NodeConfigPanel';
import Toasts from './components/dialogs/Toasts';
import { useUIStore } from './stores/uiStore';
import { useGraphStore } from './stores/graphStore';
import { exportMLnode } from './utils/exportImport';

export default function App() {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const addToast = useUIStore((s) => s.addToast);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const state = useGraphStore.getState();
        const json = exportMLnode(state.nodes, state.edges, state.settings);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.settings.metadata.name ?? 'model'}.mlnode.json`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('Saved', 'success');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addToast]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: '#0e0e12' }}>
      <TopToolbar />
      <div className="flex flex-1 overflow-hidden">
        <NodeLibrary />
        <ModelCanvas />
        {selectedNodeId && <NodeConfigPanel />}
      </div>
      <Toasts />
    </div>
  );
}
