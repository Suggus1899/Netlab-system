'use client';

import { X, Wifi, WifiOff } from 'lucide-react';
import { useNetworkStore } from '@/lib/store/network-store';
import { cn } from '@/lib/utils';

export function DeviceConfigPanel() {
  const { devices, selectedDeviceId, selectDevice, updateInterfaceConfig, updateDeviceConfig, updateDeviceLabel, removeDevice } =
    useNetworkStore();

  const device = devices.find((d) => d.id === selectedDeviceId);
  if (!device) return null;

  return (
    <div className="absolute right-4 top-4 z-10 w-80 animate-fade-in rounded-xl border border-border bg-white/95 shadow-xl backdrop-blur dark:bg-gray-900/95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <input
            value={device.label}
            onChange={(e) => updateDeviceLabel(device.id, e.target.value)}
            className="bg-transparent text-sm font-semibold outline-none focus:border-b focus:border-primary-500"
          />
          <p className="text-xs text-muted-foreground">{device.type}</p>
        </div>
        <button onClick={() => selectDevice(null)} className="rounded-lg p-1 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Device config */}
      {(device.type === 'PC' || device.type === 'SERVER') && (
        <div className="border-b border-border px-4 py-3">
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Configuración</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground">Gateway</label>
              <input
                value={device.config.gateway || ''}
                onChange={(e) => updateDeviceConfig(device.id, { gateway: e.target.value })}
                placeholder="ej. 192.168.1.1"
                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 font-mono text-xs outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">DNS Server</label>
              <input
                value={device.config.dnsServer || ''}
                onChange={(e) => updateDeviceConfig(device.id, { dnsServer: e.target.value })}
                placeholder="ej. 8.8.8.8"
                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 font-mono text-xs outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Interfaces */}
      <div className="max-h-64 overflow-y-auto px-4 py-3">
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Interfaces ({device.interfaces.length})
        </h4>
        <div className="space-y-3">
          {device.interfaces.map((iface) => (
            <div
              key={iface.id}
              className={cn(
                'rounded-lg border p-2.5',
                iface.isUp ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20' : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900',
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold">{iface.name}</span>
                <button
                  onClick={() => updateInterfaceConfig(device.id, iface.id, { isUp: !iface.isUp })}
                  className={cn('rounded p-0.5', iface.isUp ? 'text-green-600' : 'text-gray-400')}
                  title={iface.isUp ? 'Desactivar' : 'Activar'}
                >
                  {iface.isUp ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[10px] text-muted-foreground">IP</label>
                  <input
                    value={iface.ip || ''}
                    onChange={(e) => updateInterfaceConfig(device.id, iface.id, { ip: e.target.value })}
                    placeholder="192.168.1.10"
                    className="w-full rounded border border-input bg-background px-1.5 py-1 font-mono text-[11px] outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Máscara</label>
                  <input
                    value={iface.mask || ''}
                    onChange={(e) => updateInterfaceConfig(device.id, iface.id, { mask: e.target.value })}
                    placeholder="255.255.255.0"
                    className="w-full rounded border border-input bg-background px-1.5 py-1 font-mono text-[11px] outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">MAC: {iface.mac}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2">
        <button
          onClick={() => { removeDevice(device.id); selectDevice(null); }}
          className="w-full rounded-lg py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          Eliminar dispositivo
        </button>
      </div>
    </div>
  );
}
