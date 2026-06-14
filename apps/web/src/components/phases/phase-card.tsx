'use client';

import React from 'react';
import { Clock, Target, AlertTriangle, CheckCircle, Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Phase, PhaseStatus, PhaseType } from '@/types/phase';

interface PhaseCardProps {
  phase: Phase;
  onStart: () => void;
  onReset: () => void;
  onValidate: () => void;
  isCurrent?: boolean;
}

export function PhaseCard({ phase, onStart, onReset, onValidate, isCurrent }: PhaseCardProps) {
  const isLocked = phase.status === 'LOCKED';
  const isCompleted = phase.status === 'COMPLETED';
  const isFailed = phase.status === 'FAILED';
  const isInProgress = phase.status === 'IN_PROGRESS';
  const isAvailable = phase.status === 'AVAILABLE';

  return (
    <Card className={cn(
      'transition-all',
      isCurrent && 'ring-2 ring-primary',
      isLocked && 'opacity-60'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={phase.status} />
              <TypeBadge type={phase.type} />
            </div>
            <CardTitle className="text-lg">{phase.title}</CardTitle>
            <CardDescription className="mt-1">
              {phase.description}
            </CardDescription>
          </div>
          <ScoreDisplay
            score={phase.currentScore}
            baseScore={phase.baseScore}
            status={phase.status}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="bg-muted rounded-lg p-3">
          <h4 className="text-sm font-medium mb-1">Instrucciones</h4>
          <p className="text-sm text-muted-foreground">{phase.instructions}</p>
        </div>

        {/* Attempts indicator */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Intentos</span>
              <span className={cn(
                isFailed && 'text-red-600 dark:text-red-400 font-medium'
              )}>
                {phase.attemptsUsed} / {phase.maxAttempts}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: phase.maxAttempts }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-2 flex-1 rounded-full transition-colors',
                    i < phase.attemptsUsed
                      ? isFailed
                        ? 'bg-red-500'
                        : isCompleted
                        ? 'bg-green-500'
                        : 'bg-amber-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Penalty info */}
          <div className="text-xs text-muted-foreground text-right">
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Penalización: -{phase.penaltyPerAttempt} pts</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {isLocked ? (
          <Button disabled className="w-full">
            <Clock className="w-4 h-4 mr-2" />
            Fase bloqueada
          </Button>
        ) : isCompleted ? (
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" disabled>
              <CheckCircle className="w-4 h-4 mr-2" />
              Completada
            </Button>
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        ) : isFailed ? (
          <div className="flex gap-2 w-full">
            <Button variant="destructive" className="flex-1" disabled>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Fallida
            </Button>
            <Button variant="outline" onClick={onReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        ) : isAvailable || isInProgress ? (
          <div className="flex gap-2 w-full">
            <Button 
              onClick={isInProgress ? onValidate : onStart}
              className="flex-1"
            >
              {isInProgress ? (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Validar intento
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar fase
                </>
              )}
            </Button>
            {isInProgress && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : null}
      </CardFooter>
    </Card>
  );
}

function StatusBadge({ status }: { status: PhaseStatus }) {
  const config: Record<PhaseStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    LOCKED: { label: 'Bloqueada', variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
    AVAILABLE: { label: 'Disponible', variant: 'outline', icon: <Play className="w-3 h-3" /> },
    IN_PROGRESS: { label: 'En progreso', variant: 'default', icon: <Target className="w-3 h-3" /> },
    COMPLETED: { label: 'Completada', variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
    FAILED: { label: 'Fallida', variant: 'destructive', icon: <AlertTriangle className="w-3 h-3" /> },
  };

  const { label, variant, icon } = config[status];

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      {icon}
      {label}
    </Badge>
  );
}

function TypeBadge({ type }: { type: PhaseType }) {
  if (type === 'OPTIONAL') {
    return (
      <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300">
        ★ Bonus
      </Badge>
    );
  }
  return null;
}

function ScoreDisplay({ score, baseScore, status }: { score: number; baseScore: number; status: PhaseStatus }) {
  const isCompleted = status === 'COMPLETED';
  const isFailed = status === 'FAILED';

  return (
    <div className="text-right">
      <div className={cn(
        'text-2xl font-bold',
        isCompleted && 'text-green-600 dark:text-green-400',
        isFailed && 'text-red-600 dark:text-red-400',
        !isCompleted && !isFailed && 'text-muted-foreground'
      )}>
        {isFailed ? 0 : score}
      </div>
      <div className="text-xs text-muted-foreground">
        / {baseScore} pts
      </div>
    </div>
  );
}
