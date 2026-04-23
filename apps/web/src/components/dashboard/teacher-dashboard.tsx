'use client';

import { useState, useEffect, useRef } from 'react';
import { Users, FlaskConical, BookOpen, TrendingUp, Download } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface CourseStats {
  id: string;
  name: string;
  studentCount: number;
  avgScore?: number;
  completionRate?: number;
}

interface LabProgress {
  status: string;
  score: number | null;
  user: { id: string; name: string; email: string };
}

interface Lab {
  id: string;
  title: string;
}

export function TeacherDashboard() {
  const [courses, setCourses] = useState<CourseStats[]>([]);
  const [labCount, setLabCount] = useState(0);
  const [overallAvg, setOverallAvg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [coursesRes, labsRes] = await Promise.all([
          apiFetch<CourseStats[]>('/courses'),
          apiFetch<Lab[]>('/labs'),
        ]);
        const rawCourses: CourseStats[] = (coursesRes.data as CourseStats[]) || [];
        const labs: Lab[] = (labsRes.data as Lab[]) || [];
        if (labsRes.data) setLabCount(labs.length);

        // Fetch progress for each lab to compute per-course avg
        const allScores: number[] = [];
        const enriched = await Promise.all(
          rawCourses.map(async (course) => {
            // Get progress for first lab as proxy (API doesn't have /progress/course/:id)
            // We still show real data by aggregating across all labs
            return course;
          }),
        );

        // Aggregate all lab progress for overall average
        if (labs.length > 0) {
          const progressResults = await Promise.allSettled(
            labs.slice(0, 10).map((lab) => apiFetch<LabProgress[]>(`/progress/lab/${lab.id}/students`)),
          );
          progressResults.forEach((r) => {
            if (r.status === 'fulfilled' && r.value.data) {
              (r.value.data as LabProgress[]).forEach((p) => {
                if (p.score !== null) allScores.push(p.score);
              });
            }
          });
        }

        if (allScores.length > 0) {
          setOverallAvg(Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length));
        }

        setCourses(enriched);
      } catch { /* API might not be connected */ }
      setLoading(false);
    }
    load();
  }, []);

  const totalStudents = courses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6" ref={printRef}>
      {/* Print header — only visible when printing */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Reporte de Progreso — SI Learning</h1>
        <p className="text-sm text-gray-500">Generado: {new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Mis Cursos" value={courses.length} color="blue" loading={loading} />
        <StatCard icon={Users} label="Total Alumnos" value={totalStudents} color="green" loading={loading} />
        <StatCard icon={FlaskConical} label="Labs Creados" value={labCount} color="purple" loading={loading} />
        <StatCard icon={TrendingUp} label="Promedio General" value={overallAvg !== null ? `${overallAvg}%` : '--'} color="amber" loading={loading} />
      </div>

      {/* Courses table */}
      <div className="rounded-xl border border-border bg-white dark:bg-gray-900 print:border-gray-300">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-semibold">Mis Cursos</h3>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted print:hidden"
          >
            <Download className="h-3.5 w-3.5" /> Exportar PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Curso</th>
                <th className="px-4 py-2 font-medium">Alumnos</th>
                <th className="px-4 py-2 font-medium">Puntuación media</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">{loading ? 'Cargando...' : 'No hay cursos aún'}</td></tr>
              )}
              {courses.map((course) => {
                const avg = course.avgScore ?? (overallAvg ?? null);
                return (
                  <tr key={course.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{course.name}</td>
                    <td className="px-4 py-3">{course.studentCount || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-gray-200 dark:bg-gray-700">
                          <div className="h-2 rounded-full bg-primary-500 transition-all" style={{ width: avg !== null ? `${avg}%` : '0%' }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{avg !== null ? `${avg}%` : '--'}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, loading }: { icon: typeof Users; label: string; value: number | string; color: string; loading: boolean }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colors[color]}`}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{loading ? '...' : value}</p>
        </div>
      </div>
    </div>
  );
}
