'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronDown, ChevronUp, ArrowRight, CheckCircle2, XCircle, GripVertical } from 'lucide-react';
import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { useNetworkStore } from '@/lib/store/network-store';
import { OSI_LAYERS } from '@si-learning/shared';
import type { PacketEvent } from '@si-learning/shared';

const layerNames: Record<number, string> = {
  1: 'Física',
  2: 'Enlace de Datos',
  3: 'Red',
  4: 'Transporte',
  7: 'Aplicación',
};

const layerColors: Record<number, string> = {
  1: '#8B5CF6',
  2: '#3B82F6',
  3: '#10B981',
  4: '#F59E0B',
  7: '#6366F1',
};

function PacketEventCard({ event, index }: { event: PacketEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { devices } = useNetworkStore();

  const fromDevice = devices.find((d) => d.id === event.fromDeviceId);
  const toDevice = devices.find((d) => d.id === event.toDeviceId);
  const color = layerColors[event.layer] || '#94a3b8';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg border border-border bg-white dark:bg-gray-900"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {/* Layer color indicator */}
        <div className="h-8 w-1 rounded-full" style={{ backgroundColor: color }} />

        {/* Status icon */}
        {event.status === 'delivered' ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
        ) : event.status === 'dropped' ? (
          <XCircle className="h-4 w-4 shrink-0 text-red-500" />
        ) : (
          <ArrowRight className="h-4 w-4 shrink-0 text-blue-500" />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono font-semibold" style={{ color }}>
              L{event.layer}
            </span>
            <span className="font-medium">{event.protocol}</span>
          </div>
          <p className="truncate text-[10px] text-muted-foreground">
            {fromDevice?.label || '?'} → {toDevice?.label || '?'}
          </p>
        </div>

        {/* Layer name */}
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${color}20`, color }}>
          {layerNames[event.layer] || `Capa ${event.layer}`}
        </span>

        {expanded ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-3 py-2">
              <h5 className="mb-1.5 text-[10px] font-semibold uppercase text-muted-foreground">Headers</h5>
              <div className="space-y-1">
                {Object.entries(event.headers).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-muted-foreground">{key}</span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
              </div>
              {event.payload && (
                <div className="mt-2 rounded bg-gray-50 px-2 py-1 dark:bg-gray-800">
                  <span className="text-[10px] text-muted-foreground">Payload: </span>
                  <span className="font-mono text-[11px]">{event.payload}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PacketInspector() {
  const { packetLog, isSimulating } = useNetworkStore();

  // ── Draggable window state ────────────────────────────────────────────────
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);

  const handleDragStart = (e: ReactMouseEvent<HTMLDivElement>) => {
    // Only drag from the header (not from buttons inside)
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      setPosition({
        x: dragStart.current.posX + dx,
        y: dragStart.current.posY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStart.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (packetLog.length === 0 && !isSimulating) return null;

  return (
    <div
      className={cn(
        'absolute z-30 w-96 max-h-80 overflow-hidden rounded-xl border border-border bg-white/95 shadow-xl backdrop-blur dark:bg-gray-900/95',
        isDragging && 'cursor-grabbing select-none',
      )}
      style={{ left: position.x, bottom: 'auto', top: position.y, right: 'auto' }}
    >
      {/* Header — draggable */}
      <div
        onMouseDown={handleDragStart}
        className={cn(
          'flex items-center gap-2 border-b border-border px-4 py-2.5',
          !isDragging && 'cursor-grab',
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        <Layers className="h-4 w-4 text-primary-500" />
        <h3 className="text-sm font-semibold">Inspector de Paquetes</h3>
        <span className="ml-auto rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          {packetLog.length} eventos
        </span>
      </div>

      {/* OSI layer legend */}
      <div className="flex gap-1 border-b border-border px-4 py-1.5">
        {[7, 4, 3, 2, 1].map((layer) => (
          <span
            key={layer}
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
            style={{ backgroundColor: layerColors[layer] }}
          >
            L{layer}
          </span>
        ))}
      </div>

      {/* Events list */}
      <div className="max-h-52 overflow-y-auto p-2 space-y-1.5">
        {packetLog.map((event, i) => (
          <PacketEventCard key={event.id} event={event} index={i} />
        ))}
        {isSimulating && (
          <div className="flex items-center justify-center py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            <span className="ml-2 text-xs text-muted-foreground">Simulando...</span>
          </div>
        )}
      </div>
    </div>
  );
}
