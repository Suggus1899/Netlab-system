import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Phase, PhaseStats, PhaseAttemptResult, PhaseHintResult, PhaseStatus } from '@/types/phase';
import { isDemoMode, demoPhases } from '@/lib/demo-api';
import { DEMO_PHASES_DATA } from '@/types/demo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface PhaseState {
  phases: Phase[];
  stats: PhaseStats | null;
  currentPhase: Phase | null;
  currentLabId: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadPhases: (labId: string) => Promise<void>;
  startPhase: (phaseId: string) => Promise<void>;
  validateAttempt: (phaseId: string, attemptData: any) => Promise<PhaseAttemptResult | null>;
  getHint: (phaseId: string) => Promise<PhaseHintResult | null>;
  resetPhase: (phaseId: string) => Promise<void>;
  setCurrentPhase: (phase: Phase | null) => void;
  clearError: () => void;
}

export const usePhaseStore = create<PhaseState>()(
  devtools(
    (set, get) => ({
      phases: [],
      stats: null,
      currentPhase: null,
      currentLabId: null,
      loading: false,
      error: null,

      loadPhases: async (labId: string) => {
        set({ loading: true, error: null });
        try {
          // Check if demo mode is active
          if (isDemoMode()) {
            const result = await demoPhases.getLabPhases(labId);
            if (result.success) {
              set({
                phases: result.data.phases,
                stats: result.data.stats,
                currentLabId: labId,
                loading: false,
              });
            } else {
              throw new Error('Error cargando fases en modo demo');
            }
            return;
          }

          const token = localStorage.getItem('accessToken');
          const res = await fetch(`${API_URL}/labs/${labId}/phases`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) throw new Error('Error cargando fases');

          const data = await res.json();
          if (data.success) {
            set({ 
              phases: data.data.phases, 
              stats: data.data.stats,
              currentLabId: labId,
              loading: false 
            });
          } else {
            throw new Error(data.error || 'Error cargando fases');
          }
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      startPhase: async (phaseId: string) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem('accessToken');
          const res = await fetch(`${API_URL}/phases/${phaseId}/start`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) throw new Error('Error iniciando fase');

          const data = await res.json();
          if (data.success) {
            set({ currentPhase: data.data, loading: false });
          } else {
            throw new Error(data.error || 'Error iniciando fase');
          }
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      validateAttempt: async (phaseId: string, attemptData: any) => {
        set({ loading: true, error: null });
        try {
          // Check if demo mode is active
          if (isDemoMode()) {
            const result = await demoPhases.validateAttempt(phaseId, attemptData);
            if (result.success) {
              const { currentLabId } = get();
              if (currentLabId) {
                await get().loadPhases(currentLabId);
              }
              set({ loading: false });
              return result.data;
            }
            throw new Error('Error validando intento en modo demo');
          }

          const token = localStorage.getItem('accessToken');
          const res = await fetch(`${API_URL}/phases/${phaseId}/validate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(attemptData),
          });

          const data = await res.json();
          if (data.success || data.data?.status === 'FAILED') {
            // Recargar fases para actualizar progreso
            const { currentLabId } = get();
            if (currentLabId) {
              await get().loadPhases(currentLabId);
            }
            set({ loading: false });
            return data.data;
          } else {
            throw new Error(data.error || 'Error validando intento');
          }
        } catch (err: any) {
          set({ error: err.message, loading: false });
          return null;
        }
      },

      getHint: async (phaseId: string) => {
        try {
          // Check if demo mode is active
          if (isDemoMode()) {
            const result = await demoPhases.getHint(phaseId);
            if (result.success) {
              return result.data;
            }
            return null;
          }

          const token = localStorage.getItem('accessToken');
          const res = await fetch(`${API_URL}/phases/${phaseId}/hint`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) throw new Error('Error obteniendo hint');

          const data = await res.json();
          if (data.success) {
            return data.data;
          }
          return null;
        } catch (err: any) {
          set({ error: err.message });
          return null;
        }
      },

      resetPhase: async (phaseId: string) => {
        set({ loading: true, error: null });
        try {
          // Check if demo mode is active
          if (isDemoMode()) {
            await demoPhases.resetPhase(phaseId);
            const { currentLabId } = get();
            if (currentLabId) {
              await get().loadPhases(currentLabId);
            }
            set({ loading: false });
            return;
          }

          const token = localStorage.getItem('accessToken');
          const res = await fetch(`${API_URL}/phases/${phaseId}/reset`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) throw new Error('Error reiniciando fase');

          const data = await res.json();
          if (data.success) {
            // Recargar fases
            const { currentLabId } = get();
            if (currentLabId) {
              await get().loadPhases(currentLabId);
            }
          }
          set({ loading: false });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      setCurrentPhase: (phase: Phase | null) => {
        set({ currentPhase: phase });
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'phase-store' }
  )
);
