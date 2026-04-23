'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Users, ChevronRight, X, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth-store';
import { useToast } from '@/components/ui/toast';

interface Course {
  id: string;
  name: string;
  description: string;
  teacher?: { id: string; name: string };
  _count?: { enrollments: number };
}

function CourseSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-white p-5 shadow-sm dark:bg-gray-900">
      <div className="mb-3 h-5 w-2/3 rounded bg-muted" />
      <div className="mb-4 h-4 w-full rounded bg-muted" />
      <div className="h-4 w-24 rounded bg-muted" />
    </div>
  );
}

interface CreateCourseModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateCourseModal({ onClose, onCreated }: CreateCourseModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiFetch('/courses', { method: 'POST', body: JSON.stringify(form) });
      toast('Curso creado correctamente', 'success');
      onCreated();
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al crear el curso', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nuevo Curso</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nombre</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Descripción</label>
            <textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear Curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<Course[]>('/courses');
      setCourses(res.data ?? []);
    } catch {
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cursos</h1>
          <p className="mt-1 text-muted-foreground">
            {canCreate ? 'Gestiona tus cursos y grupos' : 'Tus cursos inscritos'}
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            <Plus className="h-4 w-4" /> Crear Curso
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CourseSkeleton key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 font-medium">
            {canCreate ? 'Aún no tienes cursos' : 'No estás inscrito en ningún curso'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canCreate ? 'Crea tu primer curso para comenzar' : 'Pide a tu profesor que te inscriba'}
          </p>
          {canCreate && (
            <button onClick={() => setShowCreate(true)}
              className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              <Plus className="h-4 w-4" /> Crear Curso
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}
              className="group flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-gray-900">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <h3 className="font-semibold group-hover:text-primary-600">{course.name}</h3>
              </div>
              <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {course._count !== undefined ? (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />{course._count.enrollments} alumno{course._count.enrollments !== 1 ? 's' : ''}
                  </span>
                ) : course.teacher ? (
                  <span>Profesor: {course.teacher.name}</span>
                ) : <span />}
                <span className="flex items-center gap-1 text-primary-600 group-hover:underline">
                  Ver <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateCourseModal onClose={() => setShowCreate(false)} onCreated={fetchCourses} />}
    </div>
  );
}
