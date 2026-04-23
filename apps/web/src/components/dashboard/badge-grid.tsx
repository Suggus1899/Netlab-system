'use client';

import { cn } from '@/lib/utils';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const earned = badges.filter((b) => b.earned);
  if (badges.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-semibold">Insignias</h3>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {earned.length}/{badges.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-6">
        {badges.map((badge) => (
          <div
            key={badge.id}
            title={badge.earned ? `${badge.title} — ${badge.description}` : `Bloqueado: ${badge.description}`}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all',
              badge.earned
                ? 'bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-950/20 dark:ring-amber-800'
                : 'bg-gray-50 opacity-40 grayscale dark:bg-gray-800/50',
            )}
          >
            <span className="text-2xl">{badge.icon}</span>
            <span className={cn('text-[11px] font-medium leading-tight', badge.earned ? 'text-amber-800 dark:text-amber-300' : 'text-muted-foreground')}>
              {badge.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProgressItem {
  status: string;
  score: number | null;
  lab: { topic: string };
}

export function computeBadges(progress: ProgressItem[]): Badge[] {
  const completed = progress.filter((p) => p.status === 'COMPLETED');
  const scores = completed.map((p) => p.score ?? 0);
  const hasPerfect = scores.some((s) => s === 100);
  const topics = new Set(completed.map((p) => p.lab.topic));

  const topicCounts: Record<string, number> = {};
  completed.forEach((p) => {
    topicCounts[p.lab.topic] = (topicCounts[p.lab.topic] || 0) + 1;
  });
  const topicMastered = Object.values(topicCounts).some((c) => c >= 3);

  return [
    {
      id: 'first_lab',
      title: 'Primer Lab',
      description: 'Completar tu primer laboratorio',
      icon: '🎯',
      earned: completed.length >= 1,
    },
    {
      id: 'five_labs',
      title: 'Estudiante',
      description: 'Completar 5 laboratorios',
      icon: '📚',
      earned: completed.length >= 5,
    },
    {
      id: 'ten_labs',
      title: 'Experto',
      description: 'Completar 10 laboratorios',
      icon: '🏆',
      earned: completed.length >= 10,
    },
    {
      id: 'perfect_score',
      title: 'Perfecto',
      description: 'Obtener 100% en un lab',
      icon: '⭐',
      earned: hasPerfect,
    },
    {
      id: 'multi_topic',
      title: 'Explorador',
      description: 'Completar labs de 3 temas distintos',
      icon: '🌐',
      earned: topics.size >= 3,
    },
    {
      id: 'topic_master',
      title: 'Maestro',
      description: 'Completar 3+ labs del mismo tema',
      icon: '🧠',
      earned: topicMastered,
    },
    {
      id: 'high_avg',
      title: 'Alto Rendimiento',
      description: 'Promedio ≥ 80% en 3+ labs',
      icon: '📈',
      earned: scores.length >= 3 && scores.reduce((a, b) => a + b, 0) / scores.length >= 80,
    },
    {
      id: 'speedrun',
      title: 'Constante',
      description: 'Completar labs en 5 sesiones distintas',
      icon: '⚡',
      earned: completed.length >= 5,
    },
  ];
}
