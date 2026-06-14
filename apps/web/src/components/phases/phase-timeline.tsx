'use client';

import React from 'react';
import { Lock, Unlock, Play, CheckCircle, XCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Phase, PhaseStatus, PhaseType } from '@/types/phase';

interface PhaseTimelineProps {
  phases: Phase[];
  currentPhaseId?: string;
  onPhaseClick: (phase: Phase) => void;
  compact?: boolean;
}

const statusConfig: Record<PhaseStatus, { icon: React.ReactNode; color: string; bg: string }> = {
  LOCKED: {
    icon: <Lock className="w-4 h-4" />,
    color: 'text-gray-400',
    bg: 'bg-gray-200 dark:bg-gray-700',
  },
  AVAILABLE: {
    icon: <Unlock className="w-4 h-4" />,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  IN_PROGRESS: {
    icon: <Play className="w-4 h-4" />,
    color: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  COMPLETED: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  FAILED: {
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
};

const typeConfig: Record<PhaseType, { label: string; icon: React.ReactNode }> = {
  MANDATORY: {
    label: 'Obligatoria',
    icon: null,
  },
  OPTIONAL: {
    label: 'Bonus',
    icon: <Star className="w-3 h-3 text-yellow-500" />,
  },
};

export function PhaseTimeline({ phases, currentPhaseId, onPhaseClick, compact = false }: PhaseTimelineProps) {
  if (phases.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No hay fases disponibles
      </div>
    );
  }

  return (
    <div className={cn('w-full', compact ? 'px-2' : 'px-4')}>
      {/* Timeline container */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 hidden md:block" />

        {/* Phases */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-2">
          {phases.map((phase, index) => {
            const status = statusConfig[phase.status];
            const type = typeConfig[phase.type];
            const isCurrent = phase.id === currentPhaseId;
            const isClickable = phase.status !== 'LOCKED';

            return (
              <button
                key={phase.id}
                onClick={() => isClickable && onPhaseClick(phase)}
                disabled={!isClickable}
                className={cn(
                  'relative flex md:flex-col items-center md:text-center gap-3 md:gap-2 p-2 rounded-lg transition-all',
                  isClickable && 'hover:bg-muted cursor-pointer',
                  !isClickable && 'cursor-not-allowed opacity-60',
                  isCurrent && 'ring-2 ring-primary bg-primary/5',
                  compact && 'p-1'
                )}
              >
                {/* Status indicator */}
                <div
                  className={cn(
                    'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0',
                    status.bg,
                    status.color,
                    isCurrent && 'ring-2 ring-offset-2 ring-primary',
                    compact && 'w-8 h-8'
                  )}
                >
                  {status.icon}
                </div>

                {/* Phase info */}
                <div className="flex-1 min-w-0 text-left md:text-center">
                  {/* Phase number and type */}
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Fase {phase.order}
                    </span>
                    {type.icon && <span className="flex items-center">{type.icon}</span>}
                  </div>

                  {/* Title */}
                  <h4 className={cn(
                    'font-medium truncate',
                    compact ? 'text-sm' : 'text-sm md:text-base'
                  )}>
                    {phase.title}
                  </h4>

                  {/* Score & Attempts */}
                  {!compact && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {phase.status === 'COMPLETED' ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {phase.currentScore} pts
                        </span>
                      ) : phase.status === 'FAILED' ? (
                        <span className="text-red-600 dark:text-red-400">
                          Fallida
                        </span>
                      ) : (
                        <span>
                          {phase.attemptsUsed}/{phase.maxAttempts} intentos
                        </span>
                      )}
                    </div>
                  )}

                  {/* Progress bar for in-progress */}
                  {phase.status === 'IN_PROGRESS' && !compact && (
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${((phase.maxAttempts - phase.attemptsUsed) / phase.maxAttempts) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Connector dot (mobile) */}
                {index < phases.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-0.5 -translate-y-1/2 -translate-x-1/2">
                    <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full absolute right-0 top-1/2 -translate-y-1/2" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      {!compact && (
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-500" />
            <span>Completada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-500" />
            <span>En progreso</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-500" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span>Fase Bonus</span>
          </div>
        </div>
      )}
    </div>
  );
}
