'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, FlaskConical, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface CourseDetail {
  id: string;
  name: string;
  description: string;
  teacher: { id: string; name: string };
  enrollments: { user: { id: string; name: string; email: string } }[];
  assignments: { lab: { id: string; title: string; estimatedMinutes: number; difficulty: string } }[];
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

export default function CourseDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<CourseDetail>(`/courses/${id}`)
      .then(res => setCourse(res.data ?? null))
      .catch(err => setError(err instanceof Error ? err.message : 'Error al cargar el curso'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="mb-4 text-muted-foreground">{error || 'Curso no encontrado'}</p>
        <button onClick={() => router.push('/courses')}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <ArrowLeft className="h-4 w-4" /> Volver a Cursos
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/courses" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a Cursos
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
        <p className="mt-1 text-muted-foreground">{course.description}</p>
        <p className="mt-2 text-sm text-muted-foreground">Profesor: <span className="font-medium text-foreground">{course.teacher.name}</span></p>
      </div>

      {/* Students */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-gray-900">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Users className="h-5 w-5 text-blue-500" />
          Alumnos inscritos ({course.enrollments.length})
        </h2>
        {course.enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay alumnos inscritos en este curso.</p>
        ) : (
          <div className="divide-y divide-border">
            {course.enrollments.map(({ user }) => (
              <div key={user.id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Labs assigned */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-gray-900">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <FlaskConical className="h-5 w-5 text-purple-500" />
          Laboratorios asignados ({course.assignments.length})
        </h2>
        {course.assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay laboratorios asignados a este curso.</p>
        ) : (
          <div className="space-y-2">
            {course.assignments.map(({ lab }) => (
              <Link key={lab.id} href={`/labs/${lab.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted transition-colors">
                <span className="text-sm font-medium">{lab.title}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />{lab.estimatedMinutes} min
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
