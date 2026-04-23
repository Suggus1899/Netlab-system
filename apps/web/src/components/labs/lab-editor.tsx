'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import type { LabStep, StepValidation } from '@si-learning/shared';

function uid() { return Math.random().toString(36).substring(2, 10); }

interface LabEditorProps {
  initialTitle?: string;
  initialDescription?: string;
  initialDifficulty?: string;
  initialTopic?: string;
  initialSteps?: LabStep[];
  onSave: (data: { title: string; description: string; difficulty: string; topic: string; estimatedMinutes: number; steps: LabStep[] }) => void;
}

export function LabEditor({ initialTitle = '', initialDescription = '', initialDifficulty = 'BEGINNER', initialTopic = '', initialSteps = [], onSave }: LabEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [topic, setTopic] = useState(initialTopic);
  const [minutes, setMinutes] = useState(15);
  const [steps, setSteps] = useState<LabStep[]>(initialSteps);

  const addStep = () => {
    const order = steps.length + 1;
    setSteps([...steps, {
      id: uid(), order, title: '', instructions: '', hint: '',
      validation: { type: 'config', expected: {} },
    }]);
  };

  const updateStep = (id: string, field: string, value: unknown) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleSave = () => {
    onSave({ title, description, difficulty, topic, estimatedMinutes: minutes, steps });
  };

  return (
    <div className="space-y-6">
      {/* Lab metadata */}
      <div className="rounded-xl border border-border bg-white p-6 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">Información del Laboratorio</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Ping básico entre dos PCs"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe el objetivo del laboratorio..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tema</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ej: ICMP"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Dificultad</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500">
              <option value="BEGINNER">Principiante</option>
              <option value="INTERMEDIATE">Intermedio</option>
              <option value="ADVANCED">Avanzado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tiempo estimado (min)</label>
            <input type="number" value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value) || 15)} min={5} max={180}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500" />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="rounded-xl border border-border bg-white p-6 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Pasos ({steps.length})</h3>
          <button onClick={addStep} className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
            <Plus className="h-4 w-4" /> Agregar paso
          </button>
        </div>

        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.id} className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  Paso {step.order}
                </span>
                <button onClick={() => removeStep(step.id)} className="ml-auto rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <input value={step.title} onChange={(e) => updateStep(step.id, 'title', e.target.value)} placeholder="Título del paso"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary-500" />
                <textarea value={step.instructions} onChange={(e) => updateStep(step.id, 'instructions', e.target.value)} rows={2} placeholder="Instrucciones..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500" />
                <input value={step.hint || ''} onChange={(e) => updateStep(step.id, 'hint', e.target.value)} placeholder="Pista (opcional)"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500" />
                <div className="flex gap-2">
                  <select value={step.validation.type} onChange={(e) => updateStep(step.id, 'validation', { ...step.validation, type: e.target.value })}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500">
                    <option value="config">Configuración</option>
                    <option value="ping">Ping</option>
                    <option value="routing">Ruta</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
        <Save className="h-4 w-4" /> Guardar Laboratorio
      </button>
    </div>
  );
}
