'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useNetworkStore } from '@/lib/store/network-store';
import type { RoutingEntry } from '@si-learning/shared';

export function RoutingTablePanel() {
  const { devices, selectedDeviceId, updateDeviceConfig } = useNetworkStore();
  const device = devices.find((d) => d.id === selectedDeviceId);

  if (!device || device.type !== 'ROUTER') return null;

  const routes: RoutingEntry[] = device.config.routingTable || [];

  const addRoute = () => {
    updateDeviceConfig(device.id, {
      routingTable: [...routes, { destination: '', mask: '255.255.255.0', nextHop: '', interface: device.interfaces[0]?.name || 'eth0', metric: 1 }],
    });
  };

  const updateRoute = (index: number, field: keyof RoutingEntry, value: string | number) => {
    const updated = routes.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    updateDeviceConfig(device.id, { routingTable: updated });
  };

  const removeRoute = (index: number) => {
    updateDeviceConfig(device.id, { routingTable: routes.filter((_, i) => i !== index) });
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Tabla de Enrutamiento</h4>
        <button onClick={addRoute} className="rounded p-1 hover:bg-muted" title="Agregar ruta">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {routes.length === 0 && <p className="text-[10px] text-muted-foreground">Sin rutas estáticas</p>}
      <div className="space-y-2">
        {routes.map((route, i) => (
          <div key={i} className="rounded-lg border border-border p-2 text-[11px]">
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className="text-[10px] text-muted-foreground">Destino</label>
                <input value={route.destination} onChange={(e) => updateRoute(i, 'destination', e.target.value)}
                  placeholder="192.168.2.0" className="w-full rounded border border-input bg-background px-1.5 py-0.5 font-mono text-[10px] outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Máscara</label>
                <input value={route.mask} onChange={(e) => updateRoute(i, 'mask', e.target.value)}
                  placeholder="255.255.255.0" className="w-full rounded border border-input bg-background px-1.5 py-0.5 font-mono text-[10px] outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Next Hop</label>
                <input value={route.nextHop} onChange={(e) => updateRoute(i, 'nextHop', e.target.value)}
                  placeholder="192.168.1.1" className="w-full rounded border border-input bg-background px-1.5 py-0.5 font-mono text-[10px] outline-none" />
              </div>
              <div className="flex items-end gap-1">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Métrica</label>
                  <input type="number" value={route.metric} onChange={(e) => updateRoute(i, 'metric', parseInt(e.target.value) || 1)}
                    className="w-full rounded border border-input bg-background px-1.5 py-0.5 font-mono text-[10px] outline-none" />
                </div>
                <button onClick={() => removeRoute(i)} className="mb-0.5 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
