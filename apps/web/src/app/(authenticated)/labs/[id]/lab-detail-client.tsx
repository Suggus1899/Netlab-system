'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, FlaskConical, BookOpen, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { NetworkCanvas } from '@/components/simulator/network-canvas';
import { LabRunner } from '@/components/labs/lab-runner';
import { apiFetch } from '@/lib/api';
import { demoLabs, demoProgress, isDemoMode } from '@/lib/demo-api';
import { useNetworkStore } from '@/lib/store/network-store';
import { cn } from '@/lib/utils';
import type { LabStep } from '@si-learning/shared';

interface Lab {
  id: string;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  topic: string;
  estimatedMinutes: number;
  steps: LabStep[];
}

const difficultyLabel: Record<string, { label: string; color: string }> = {
  BEGINNER: { label: 'Principiante', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  INTERMEDIATE: { label: 'Intermedio', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  ADVANCED: { label: 'Avanzado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export default function LabDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { clearTopology } = useNetworkStore();

  const [lab, setLab] = useState<Lab | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressStarted, setProgressStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        let labData: Lab | null = null;

        if (isDemoMode()) {
          const res = await demoLabs.getById(id);
          labData = res.data as Lab;
        } else {
          const res = await apiFetch<Lab>(`/labs/${id}`);
          labData = res.data ?? null;
        }

        if (labData) {
          setLab(labData);
          if (!isDemoMode()) {
            try {
              await apiFetch(`/progress/${id}/start`, { method: 'POST' });
            } catch { /* already started is fine */ }
          }
          setProgressStarted(true);
        } else {
          setError('Laboratorio no encontrado');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el laboratorio');
      } finally {
        setIsLoading(false);
      }
    }
    load();
    clearTopology();
  }, [id, clearTopology]);

  const handleComplete = async (score: number) => {
    setFinalScore(score);
    setCompleted(true);
    try {
      if (isDemoMode()) {
        await demoProgress.update(id, { status: 'COMPLETED', score });
      } else {
        await apiFetch(`/progress/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'COMPLETED', score }),
        });
      }
    } catch { /* non-critical */ }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-3 font-medium">{error || 'Laboratorio no encontrado'}</p>
          <Link href="/labs" className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Volver a Labs
          </Link>
        </div>
      </div>
    );
  }

  const diff = difficultyLabel[lab.difficulty] ?? difficultyLabel.BEGINNER;

  return (
    <div className="-mx-4 -my-6 flex flex-col sm:-mx-6 lg:-mx-8" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border bg-white/95 px-4 py-2.5 backdrop-blur dark:bg-gray-900/95 shrink-0">
        <Link href="/labs" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="h-4 w-4 shrink-0 text-primary-500" />
          <h1 className="truncate text-sm font-semibold">{lab.title}</h1>
          <span className={cn('hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:inline', diff.color)}>
            {diff.label}
          </span>
          <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline">
            {lab.topic}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{lab.estimatedMinutes} min</span>
          <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{lab.steps.length} pasos</span>
          {completed && finalScore !== null && (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {finalScore}%
            </span>
          )}
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Network Canvas */}
        <div className="relative flex-1 overflow-hidden">
          <NetworkCanvas />
        </div>

        {/* Right: Lab Runner panel */}
        <div className="w-80 shrink-0 overflow-y-auto border-l border-border bg-gray-50 p-3 dark:bg-gray-950 xl:w-96">
          {lab.steps.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-medium">Sin pasos configurados</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Este lab no tiene pasos de validación. Usa el canvas libremente.
              </p>
            </div>
          ) : (
            <LabRunner
              title={lab.title}
              description={lab.description}
              steps={lab.steps}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
