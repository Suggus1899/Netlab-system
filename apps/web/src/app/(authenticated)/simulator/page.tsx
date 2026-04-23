'use client';

import { useState } from 'react';
import { LayoutTemplate, X } from 'lucide-react';
import { NetworkCanvas } from '@/components/simulator/network-canvas';
import { TOPOLOGY_TEMPLATES } from '@/lib/engine/topology-templates';
import { useNetworkStore } from '@/lib/store/network-store';

export default function SimulatorPage() {
  const [showTemplates, setShowTemplates] = useState(false);
  const { loadTopology, isSimulating } = useNetworkStore();

  const applyTemplate = (templateId: string) => {
    const tpl = TOPOLOGY_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const { devices, links } = tpl.build();
    loadTopology(devices, links);
    setShowTemplates(false);
  };

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8">
      <div className="relative h-[calc(100vh-64px)] w-full">
        <NetworkCanvas />

        {/* Templates toggle button */}
        <div className="absolute left-4 bottom-4 z-20">
          <button
            onClick={() => setShowTemplates((v) => !v)}
            disabled={isSimulating}
            className="flex items-center gap-2 rounded-xl border border-border bg-white/95 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur hover:bg-gray-50 disabled:opacity-40 dark:bg-gray-900/95 dark:hover:bg-gray-800"
          >
            <LayoutTemplate className="h-4 w-4 text-primary-500" />
            Plantillas
          </button>
        </div>

        {/* Templates panel */}
        {showTemplates && (
          <div className="absolute left-4 bottom-14 z-30 w-72 rounded-2xl border border-border bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Cargar plantilla</h3>
              <button onClick={() => setShowTemplates(false)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {TOPOLOGY_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors"
                >
                  <span className="text-xl">{tpl.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{tpl.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{tpl.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="px-4 py-2.5 text-[11px] text-muted-foreground border-t border-border">
              ⚠️ Reemplazará la topología actual
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
