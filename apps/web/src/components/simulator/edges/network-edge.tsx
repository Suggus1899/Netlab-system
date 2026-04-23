'use client';

import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from 'reactflow';

export interface NetworkEdgeData {
  isActive: boolean;
  hasPacket: boolean;
  packetProgress: number; // 0 to 1
  packetColor: string;
}

function NetworkEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<NetworkEdgeData>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const isActive = data?.isActive ?? true;
  const hasPacket = data?.hasPacket ?? false;
  const progress = data?.packetProgress ?? 0;
  const packetColor = data?.packetColor ?? '#3b82f6';

  return (
    <>
      {/* Background edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : isActive ? '#94a3b8' : '#e2e8f0',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: isActive ? 'none' : '5,5',
        }}
      />

      {/* Glow filter (always defined, only applied when needed) */}
      <defs>
        <filter id={`glow-${id}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Animated packet dot — loops while hasPacket is true */}
      {hasPacket && (
        <>
          {/* Trailing halo */}
          <circle r="10" fill={packetColor} opacity="0.2" filter={`url(#glow-${id})`}>
            <animateMotion dur="1.0s" repeatCount="indefinite" path={edgePath} />
          </circle>
          {/* Core dot */}
          <circle r="5" fill={packetColor} filter={`url(#glow-${id})`}>
            <animateMotion dur="1.0s" repeatCount="indefinite" path={edgePath} />
          </circle>
        </>
      )}
    </>
  );
}

export default memo(NetworkEdge);
