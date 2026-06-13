'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Monitor, Router, Network, Server, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeviceType, NetworkInterface } from '@si-learning/shared';

export interface DeviceNodeData {
  label: string;
  type: DeviceType;
  interfaces: NetworkInterface[];
  isSelected: boolean;
  hasError: boolean;
}

const deviceIcons: Record<DeviceType, typeof Monitor> = {
  PC: Monitor,
  ROUTER: Router,
  SWITCH: Network,
  SERVER: Server,
  FIREWALL: Shield,
};

const deviceColors: Record<DeviceType, { bg: string; border: string; text: string }> = {
  PC: { bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400' },
  ROUTER: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400' },
  SWITCH: { bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-600 dark:text-amber-400' },
  SERVER: { bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-600 dark:text-purple-400' },
  FIREWALL: { bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400' },
};

function DeviceNode({ data }: NodeProps<DeviceNodeData>) {
  const Icon = deviceIcons[data.type] || Monitor;
  const colors = deviceColors[data.type] || deviceColors.PC;
  const primaryIp = data.interfaces.find((i) => i.ip)?.ip;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center rounded-xl border-2 px-4 py-3 shadow-md transition-all',
        colors.bg,
        colors.border,
        data.isSelected && 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900',
        data.hasError && 'ring-2 ring-red-500',
      )}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-gray-400 !bg-white dark:!bg-gray-800" />
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-gray-400 !bg-white dark:!bg-gray-800" />
      <Handle type="target" position={Position.Left} id="left" className="!h-3 !w-3 !border-2 !border-gray-400 !bg-white dark:!bg-gray-800" />
      <Handle type="source" position={Position.Right} id="right" className="!h-3 !w-3 !border-2 !border-gray-400 !bg-white dark:!bg-gray-800" />

      {/* Icon */}
      <div className={cn('mb-1 rounded-lg p-2', colors.text)}>
        <Icon className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
      </div>

      {/* Label */}
      <span className="text-xs font-semibold text-foreground" role="img" aria-label={`${data.type}: ${data.label}`}>{data.label}</span>

      {/* IP badge */}
      {primaryIp && (
        <span className="mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {primaryIp}
        </span>
      )}

      {/* Interface count */}
      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        {data.interfaces.length}
      </span>
    </div>
  );
}

export default memo(DeviceNode);
