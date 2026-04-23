'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FlaskConical, Search, Plus, Clock, ChevronRight, X, Loader2 } from 'lucide-react';
import { TOPICS } from '@si-learning/shared';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth-store';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface Lab {
  id: string;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  topic: string;
  estimatedMinutes: number;
  status: string;
  _count?: { steps: number };
}

const difficultyLabel: Record<string, { label: string; color: string }> = {
  BEGINNER: { label: 'Principiante', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  INTERMEDIATE: { label: 'Intermedio', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  ADVANCED: { label: 'Avanzado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function LabSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-white p-5 shadow-sm dark:bg-gray-900">
      <div className="mb-3 flex gap-2">
        <div className="h-5 w-20 rounded-full bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="mb-2 h-5 w-3/4 rounded bg-muted" />
      <div className="mb-4 h-4 w-full rounded bg-muted" />
      <div className="h-4 w-24 rounded bg-muted" />
    </div>
  );
}

interface CreateLabModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateLabModal({ onClose, onCreated }: CreateLabModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'BEGINNER',
    topic: TOPICS[0] as string,
    estimatedMinutes: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiFetch('/labs', {
        method: 'POST',
        body: JSON.stringify({ ...form, status: 'PUBLISHED', estimatedMinutes: Number(form.estimatedMinutes) }),
      });
      toast('Laboratorio creado correctamente', 'success');
      onCreated();
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al crear el laboratorio', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nuevo Laboratorio</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Título</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Descripción</label>
            <textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Dificultad</label>
              <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500">
                <option value="BEGINNER">Principiante</option>
                <option value="INTERMEDIATE">Intermedio</option>
                <option value="ADVANCED">Avanzado</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Duración (min)</label>
              <input type="number" min={5} max={180} value={form.estimatedMinutes}
                onChange={e => setForm(f => ({ ...f, estimatedMinutes: Number(e.target.value) }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Tema</label>
            <select value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500">
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear Lab'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ProgressItem {
  labId: string;
  status: string;
  score: number | null;
}

const progressColor: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};
const progressLabel: Record<string, string> = {
  COMPLETED: 'Completado',
  IN_PROGRESS: 'En progreso',
};

export default function LabsPage() {
  const { user } = useAuthStore();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ProgressItem>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const fetchLabs = async () => {
    setIsLoading(true);
    try {
      const [labsRes, progressRes] = await Promise.allSettled([
        apiFetch<Lab[]>('/labs'),
        isStudent ? apiFetch<ProgressItem[]>('/progress') : Promise.resolve({ data: [] }),
      ]);
      if (labsRes.status === 'fulfilled') setLabs(labsRes.value.data ?? []);
      if (progressRes.status === 'fulfilled' && progressRes.value.data) {
        const map: Record<string, ProgressItem> = {};
        (progressRes.value.data as ProgressItem[]).forEach((p) => { map[p.labId] = p; });
        setProgressMap(map);
      }
    } catch {
      setLabs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLabs(); }, []);

  const filtered = labs.filter((lab) => {
    const matchSearch = lab.title.toLowerCase().includes(search.toLowerCase()) ||
      lab.description.toLowerCase().includes(search.toLowerCase());
    const matchTopic = !selectedTopic || lab.topic === selectedTopic;
    return matchSearch && matchTopic;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laboratorios</h1>
          <p className="mt-1 text-muted-foreground">Explora los laboratorios guiados disponibles</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            <Plus className="h-4 w-4" /> Crear Lab
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Buscar laboratorios..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}
          className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
          <option value="">Todos los temas</option>
          {TOPICS.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
        </select>
      </div>

      {/* Lab grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <LabSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FlaskConical className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 font-medium">
            {search || selectedTopic ? 'No hay laboratorios que coincidan' : 'No hay laboratorios disponibles'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || selectedTopic ? 'Prueba con otros filtros' : canCreate ? 'Crea el primer laboratorio' : 'Vuelve más tarde'}
          </p>
          {canCreate && !search && !selectedTopic && (
            <button onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 mx-auto">
              <Plus className="h-4 w-4" /> Crear Lab
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lab) => {
            const diff = difficultyLabel[lab.difficulty] ?? difficultyLabel.BEGINNER;
            const prog = progressMap[lab.id];
            return (
              <Link key={lab.id} href={`/labs/${lab.id}`}
                className="group flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-gray-900">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', diff.color)}>{diff.label}</span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{lab.topic}</span>
                  {prog && (
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', progressColor[prog.status])}>
                      {progressLabel[prog.status] || prog.status}
                      {prog.status === 'COMPLETED' && prog.score !== null && ` · ${prog.score}%`}
                    </span>
                  )}
                </div>
                <h3 className="mb-1.5 font-semibold group-hover:text-primary-600">{lab.title}</h3>
                <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2">{lab.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{lab.estimatedMinutes} min</span>
                  <span className="flex items-center gap-1 text-primary-600 group-hover:underline">
                    {prog?.status === 'IN_PROGRESS' ? 'Continuar' : prog?.status === 'COMPLETED' ? 'Revisar' : 'Empezar'}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && <CreateLabModal onClose={() => setShowCreate(false)} onCreated={fetchLabs} />}
    </div>
  );
}
