/** NodeLibrary — draggable sidebar palette grouped by category. */

import React, { useState, DragEvent } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { NODE_CATEGORIES, type NodeCategory } from '../../constants/nodeCategories';

export default function NodeLibrary() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'I/O': true,
    'Linear & Conv': true,
    'Activation': true,
  });

  const toggle = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const onDragStart = (e: DragEvent, type: string) => {
    e.dataTransfer.setData('application/mlnode-type', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-52 h-full overflow-y-auto border-r border-panel-border bg-panel-bg select-none">
      <div className="px-3 py-3">
        <h2
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: '#71717a' }}
        >
          Node Library
        </h2>
      </div>

      {NODE_CATEGORIES.map((cat) => (
        <CategoryGroup
          key={cat.name}
          category={cat}
          isExpanded={expanded[cat.name] ?? false}
          onToggle={() => toggle(cat.name)}
          onDragStart={onDragStart}
        />
      ))}
    </div>
  );
}

function CategoryGroup({
  category,
  isExpanded,
  onToggle,
  onDragStart,
}: {
  category: NodeCategory;
  isExpanded: boolean;
  onToggle: () => void;
  onDragStart: (e: DragEvent, type: string) => void;
}) {
  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-1 px-3 py-1.5 text-xs font-medium hover:bg-panel-hover transition-colors"
        style={{ color: category.color }}
      >
        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {category.name}
      </button>

      {isExpanded && (
        <div className="pl-4 pr-2 pb-1">
          {category.types.map(({ type, label }) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              className="flex items-center gap-2 px-2 py-1 rounded cursor-grab text-xs
                         hover:bg-panel-hover active:cursor-grabbing transition-colors"
              style={{ color: '#d4d4d8' }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: category.color }}
              />
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
