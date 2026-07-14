'use client';

import { useRef } from 'react';
import { Monitor, Router, Network, Server, Shield, Trash2, Play, Square, RotateCcw, Download, Upload, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeviceType } from '@si-learning/shared';

export type SimProtocol = 'PING' | 'ARP' | 'DNS' | 'DHCP' | 'HTTP';

interface ToolbarProps {
  onAddDevice: (type: DeviceType) => void;
  onDelete: () => void;
  onSimulate: (protocol: SimProtocol) => void;
  onStopSimulation: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
  isSimulating: boolean;
  hasSelection: boolean;
  selectedProtocol: SimProtocol;
  onProtocolChange: (p: SimProtocol) => void;
  onToggleTemplates: () => void;
  showTemplates: boolean;
}

const DEVICE_DEFS: { type: DeviceType; icon: typeof Monitor; label: string; color: string }[] = [
  { type: DeviceType.PC, icon: Monitor, label: 'PC', color: 'hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/40' },
  { type: DeviceType.ROUTER, icon: Router, label: 'Router', color: 'hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/40' },
  { type: DeviceType.SWITCH, icon: Network, label: 'Switch', color: 'hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/40' },
  { type: DeviceType.SERVER, icon: Server, label: 'Server', color: 'hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/40' },
  { type: DeviceType.FIREWALL, icon: Shield, label: 'Firewall', color: 'hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40' },
];

const PROTOCOLS: { value: SimProtocol; label: string; color: string }[] = [
  { value: 'PING',  label: 'ICMP Ping', color: 'text-emerald-600' },
  { value: 'ARP',   label: 'ARP',       color: 'text-blue-600' },
  { value: 'DNS',   label: 'DNS',       color: 'text-purple-600' },
  { value: 'DHCP',  label: 'DHCP',      color: 'text-amber-600' },
  { value: 'HTTP',  label: 'HTTP',      color: 'text-rose-600' },
];

export function SimulatorToolbar({
  onAddDevice, onDelete, onSimulate, onStopSimulation, onClear,
  onExport, onImport, isSimulating, hasSelection, selectedProtocol, onProtocolChange,
  onToggleTemplates, showTemplates,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) onImport(ev.target.result as string); };
    reader.readAsText(file);
    e.target.value = '';
  };

  const activeProto = PROTOCOLS.find((p) => p.value === selectedProtocol)!;

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-white/90 px-2 py-1.5 shadow-lg backdrop-blur dark:bg-gray-900/90">
      {/* Device buttons */}
      {DEVICE_DEFS.map(({ type, icon: Icon, label, color }) => (
        <button
          key={type}
          onClick={() => onAddDevice(type)}
          disabled={isSimulating}
          title={`Agregar ${label}`}
          className={cn('flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors disabled:opacity-40', color)}
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}

      {/* Templates button */}
      <button
        onClick={onToggleTemplates}
        disabled={isSimulating}
        title="Plantillas de red"
        className={cn(
          'flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors disabled:opacity-40',
          showTemplates
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
            : 'hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/40',
        )}
      >
        <LayoutTemplate className="h-5 w-5" strokeWidth={1.5} />
        <span className="text-[10px] font-medium">Plantillas</span>
      </button>

      <div className="mx-1 h-8 w-px bg-border" />

      {/* Protocol selector + simulate */}
      {!isSimulating ? (
        <div className="flex items-center gap-0.5">
          <select
            value={selectedProtocol}
            onChange={(e) => onProtocolChange(e.target.value as SimProtocol)}
            className={cn('rounded-l-lg border border-r-0 border-input bg-background px-2 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer', activeProto.color)}
          >
            {PROTOCOLS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button
            onClick={() => onSimulate(selectedProtocol)}
            title={`Simular ${activeProto.label}`}
            className="flex items-center gap-1.5 rounded-r-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400"
          >
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Simular</span>
          </button>
        </div>
      ) : (
        <button
          onClick={onStopSimulation}
          title="Detener simulación"
          className="flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400"
        >
          <Square className="h-4 w-4" />
          <span className="hidden sm:inline">Detener</span>
        </button>
      )}

      <div className="mx-1 h-8 w-px bg-border" />

      {/* Export / Import */}
      <button onClick={onExport} title="Exportar topología (JSON)" disabled={isSimulating}
        className="rounded-lg p-2 text-muted-foreground hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 dark:hover:bg-gray-800">
        <Download className="h-4 w-4" />
      </button>
      <button onClick={() => fileRef.current?.click()} title="Importar topología (JSON)" disabled={isSimulating}
        className="rounded-lg p-2 text-muted-foreground hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 dark:hover:bg-gray-800">
        <Upload className="h-4 w-4" />
      </button>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />

      {hasSelection && (
        <button onClick={onDelete} disabled={isSimulating} title="Eliminar selección"
          className="rounded-lg p-2 text-muted-foreground hover:bg-red-100 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-900/40">
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      <button onClick={onClear} disabled={isSimulating} title="Limpiar topología"
        className="rounded-lg p-2 text-muted-foreground hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:hover:bg-gray-800">
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  );
}
