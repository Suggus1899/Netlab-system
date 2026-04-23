'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FlaskConical, CheckCircle2, Clock, Play, TrendingUp } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { BadgeGrid, computeBadges } from './badge-grid';

interface ProgressItem {
  id: string;
  status: string;
  currentStep: number;
  score: number | null;
  lab: { id: string; title: string; topic: string; difficulty: string };
}

const diffColors: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  INTERMEDIATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ADVANCED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const diffLabels: Record<string, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
};

export function StudentDashboard() {
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<ProgressItem[]>('/progress');
        if (res.data) setProgress(res.data as ProgressItem[]);
      } catch { /* API not connected */ }
      setLoading(false);
    }
    load();
  }, []);

  const completed = progress.filter((p) => p.status === 'COMPLETED').length;
  const inProg = progress.filter((p) => p.status === 'IN_PROGRESS').length;
  const avgScore = completed > 0
    ? Math.round(progress.filter((p) => p.score !== null).reduce((s, p) => s + (p.score || 0), 0) / completed)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30"><CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
            <div><p className="text-sm text-muted-foreground">Completados</p><p className="text-2xl font-bold">{loading ? '...' : completed}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30"><Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
            <div><p className="text-sm text-muted-foreground">En progreso</p><p className="text-2xl font-bold">{loading ? '...' : inProg}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30"><TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div>
            <div><p className="text-sm text-muted-foreground">Puntuación media</p><p className="text-2xl font-bold">{loading ? '...' : `${avgScore}%`}</p></div>
          </div>
        </div>
      </div>

      {/* Badges */}
      {!loading && <BadgeGrid badges={computeBadges(progress)} />}

      {/* Progress list */}
      <div className="rounded-xl border border-border bg-white dark:bg-gray-900">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-semibold">Mi Progreso</h3>
        </div>
        <div className="divide-y divide-border">
          {loading && <p className="px-4 py-8 text-center text-muted-foreground">Cargando...</p>}
          {!loading && progress.length === 0 && (
            <div className="px-4 py-8 text-center">
              <FlaskConical className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">Aún no has comenzado ningún laboratorio</p>
              <Link href="/labs" className="mt-3 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Explorar Labs
              </Link>
            </div>
          )}
          {progress.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg',
                item.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
              )}>
                {item.status === 'COMPLETED'
                  ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  : <Play className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-sm">{item.lab.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{item.lab.topic}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', diffColors[item.lab.difficulty])}>
                    {diffLabels[item.lab.difficulty] || item.lab.difficulty}
                  </span>
                </div>
              </div>
              {item.score !== null && (
                <span className="text-sm font-bold text-primary-600">{item.score}%</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
