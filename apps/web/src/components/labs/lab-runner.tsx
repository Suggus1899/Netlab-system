'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Lightbulb, ChevronRight, Trophy, RotateCcw, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNetworkStore } from '@/lib/store/network-store';
import { validateStep, getTopologyChecklist } from '@/lib/engine/lab-validator';
import type { LabStep } from '@si-learning/shared';

interface LabRunnerProps {
  title: string;
  description: string;
  steps: LabStep[];
  onComplete: (score: number) => void;
}

export function LabRunner({ title, description, steps, onComplete }: LabRunnerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<Record<number, { passed: boolean; message: string }>>({});
  const [showHint, setShowHint] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { devices, links } = useNetworkStore();

  const checklist = getTopologyChecklist({ devices, links });
  const checklistOk = checklist.every((c) => c.passed);

  const step = steps[currentStep];
  const result = results[currentStep];

  const handleValidate = () => {
    if (!step) return;
    const validation = validateStep({ devices, links }, step);
    setResults((prev) => ({ ...prev, [currentStep]: validation }));

    if (validation.passed && currentStep === steps.length - 1) {
      const passed = Object.values({ ...results, [currentStep]: validation }).filter((r) => r.passed).length;
      const score = Math.round((passed / steps.length) * 100);
      setCompleted(true);
      onComplete(score);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowHint(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setResults({});
    setShowHint(false);
    setCompleted(false);
  };

  if (completed) {
    const passed = Object.values(results).filter((r) => r.passed).length;
    const score = Math.round((passed / steps.length) * 100);
    return (
      <div className="rounded-xl border border-border bg-white p-6 text-center dark:bg-gray-900">
        <Trophy className="mx-auto h-12 w-12 text-amber-500" />
        <h3 className="mt-3 text-xl font-bold">¡Laboratorio completado!</h3>
        <p className="mt-1 text-muted-foreground">{title}</p>
        <div className="mt-4 text-4xl font-bold text-primary-600">{score}%</div>
        <p className="text-sm text-muted-foreground">{passed}/{steps.length} pasos correctos</p>
        <button onClick={handleReset} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <RotateCcw className="h-4 w-4" /> Reiniciar
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-4 py-2">
        {steps.map((_, i) => (
          <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors',
            results[i]?.passed ? 'bg-green-500' : results[i] ? 'bg-red-400' : i === currentStep ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
          )} />
        ))}
      </div>

      {/* Topology checklist */}
      <div className="border-b border-border px-4 py-2">
        <button
          onClick={() => setShowChecklist(!showChecklist)}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
            checklistOk ? 'text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/20' : 'text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/20',
          )}
        >
          {checklistOk ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
          <span>{checklistOk ? 'Topología lista' : 'Verificar topología'}</span>
          <ChevronRight className={cn('ml-auto h-3.5 w-3.5 transition-transform', showChecklist && 'rotate-90')} />
        </button>
        <AnimatePresence>
          {showChecklist && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="mt-1.5 space-y-1 pb-1">
                {checklist.map((item, i) => (
                  <div key={i} className={cn('flex items-center gap-2 rounded px-2 py-1 text-xs', item.passed ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400')}>
                    {item.passed ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <XCircle className="h-3 w-3 shrink-0" />}
                    {item.label}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Current step */}
      {step && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="rounded-full bg-primary-100 px-2 py-0.5 font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              Paso {currentStep + 1}/{steps.length}
            </span>
            <span className="truncate text-muted-foreground">{step.title}</span>
          </div>

          <p className="text-sm text-muted-foreground">{step.instructions}</p>

          {/* Hint */}
          {step.hint && (
            <div className="mt-2">
              <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700">
                <Lightbulb className="h-3.5 w-3.5" /> {showHint ? 'Ocultar pista' : 'Ver pista'}
              </button>
              <AnimatePresence>
                {showHint && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                    {step.hint}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Validation result */}
          {result && (
            <div className={cn('mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
              result.passed ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
            )}>
              {result.passed ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
              <span>{result.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 border-t border-border px-4 py-3">
        {currentStep > 0 && (
          <button onClick={() => { setCurrentStep(currentStep - 1); setShowHint(false); }}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
            ←
          </button>
        )}
        <button onClick={handleValidate}
          className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          Verificar
        </button>
        {result?.passed && currentStep < steps.length - 1 && (
          <button onClick={handleNext} className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            Siguiente <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
