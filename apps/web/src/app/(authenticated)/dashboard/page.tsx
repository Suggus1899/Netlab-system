'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FlaskConical, Network, BookOpen, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { apiFetch } from '@/lib/api';
import { TeacherDashboard } from '@/components/dashboard/teacher-dashboard';
import { StudentDashboard } from '@/components/dashboard/student-dashboard';

interface ProgressEntry { status: string; score: number | null }

const quickActions = [
  { href: '/labs', label: 'Ver Laboratorios', icon: FlaskConical, color: 'bg-blue-500' },
  { href: '/simulator', label: 'Abrir Simulador', icon: Network, color: 'bg-green-500' },
  { href: '/courses', label: 'Mis Cursos', icon: BookOpen, color: 'bg-purple-500' },
];

function StatCard({ icon, label, value, bgColor, iconColor, loading }: {
  icon: React.ReactNode; label: string; value: string | number; bgColor: string; iconColor: string; loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${bgColor}`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-1 h-7 w-10 animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [labCount, setLabCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [labsRes, coursesRes, progressRes] = await Promise.allSettled([
          apiFetch<unknown[]>('/labs'),
          apiFetch<unknown[]>('/courses'),
          apiFetch<ProgressEntry[]>('/progress'),
        ]);

        if (labsRes.status === 'fulfilled') setLabCount(labsRes.value.data?.length ?? 0);
        if (coursesRes.status === 'fulfilled') setCourseCount(coursesRes.value.data?.length ?? 0);
        if (progressRes.status === 'fulfilled') {
          const prog = progressRes.value.data ?? [];
          setCompleted(prog.filter(p => p.status === 'COMPLETED').length);
          setInProgress(prog.filter(p => p.status === 'IN_PROGRESS').length);
          const scores = prog.filter(p => p.score !== null).map(p => p.score as number);
          setAvgScore(scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const isStudent = user?.role === 'STUDENT';

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Bienvenido, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {user?.role === 'TEACHER'
            ? 'Gestiona tus cursos y laboratorios'
            : user?.role === 'ADMIN'
              ? 'Panel de administración del sistema'
              : 'Continúa aprendiendo sobre redes'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard loading={loading} icon={<FlaskConical className="h-5 w-5" />} label="Labs disponibles"
          value={labCount} bgColor="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400" />
        <StatCard loading={loading} icon={<CheckCircle2 className="h-5 w-5" />} label="Completados"
          value={completed} bgColor="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600 dark:text-green-400" />
        <StatCard loading={loading} icon={<Clock className="h-5 w-5" />}
          label={isStudent ? 'En progreso' : 'Mis Cursos'}
          value={isStudent ? inProgress : courseCount}
          bgColor="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600 dark:text-amber-400" />
        <StatCard loading={loading} icon={<TrendingUp className="h-5 w-5" />} label="Puntuación media"
          value={avgScore !== null ? `${avgScore}%` : '—'}
          bgColor="bg-purple-100 dark:bg-purple-900/30" iconColor="text-purple-600 dark:text-purple-400" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Acciones rápidas</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}
                className="group flex items-center gap-4 rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-gray-900">
                <div className={`rounded-lg p-3 text-white ${action.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="font-medium group-hover:text-primary-600">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Role-based dashboard */}
      {user?.role === 'TEACHER' && <TeacherDashboard />}
      {user?.role === 'STUDENT' && <StudentDashboard />}
      {user?.role === 'ADMIN' && <TeacherDashboard />}
    </div>
  );
}
