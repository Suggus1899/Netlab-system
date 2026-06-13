'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FlaskConical, CheckCircle2, Clock, Play, TrendingUp, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { BadgeGrid, computeBadges } from './badge-grid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { mockFetchProgress, isBackendAvailable } from '@/lib/mock-api';

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
        const backendAvailable = await isBackendAvailable();
        if (!backendAvailable) {
          const progress = mockFetchProgress();
          setProgress(progress);
        } else {
          const res = await apiFetch<ProgressItem[]>('/progress');
          if (res.data) setProgress(res.data as ProgressItem[]);
        }
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
        <Card className="transition-all duration-200 hover:shadow-soft">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                {loading ? <Skeleton className="mt-1 h-7 w-12" /> : <p className="text-2xl font-bold">{completed}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-soft">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En progreso</p>
                {loading ? <Skeleton className="mt-1 h-7 w-12" /> : <p className="text-2xl font-bold">{inProg}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-soft">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Puntuación media</p>
                {loading ? <Skeleton className="mt-1 h-7 w-16" /> : <p className="text-2xl font-bold">{avgScore}%</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      {!loading && <BadgeGrid badges={computeBadges(progress)} />}

      {/* Progress list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Mi Progreso</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border">
          {loading && (
            <div className="px-4 py-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && progress.length === 0 && (
            <CardContent className="pt-0">
              <div className="px-4 py-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <FlaskConical className="h-8 w-8 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">Aún no has comenzado ningún laboratorio</p>
                <Link href="/labs" className="inline-flex items-center gap-2">
                  <Button>
                    Explorar Labs
                    <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          )}
          {progress.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg',
                item.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
              )}>
                {item.status === 'COMPLETED'
                  ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
                  : <Play className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
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
      </Card>
    </div>
  );
}
