import { DEMO_USER, DEMO_LABS, DEMO_PROGRESS, DEMO_PHASES_DATA, DEMO_STATS } from '@/types/demo';
import type { PhaseAttemptResult, PhaseHintResult, Phase } from '@/types/phase';

// SessionStorage keys
const DEMO_KEYS = {
  USER: 'demo_user',
  LABS: 'demo_labs',
  PROGRESS: 'demo_progress',
  TOPOLOGY: 'demo_topology',
  ACTIVE: 'demo_active',
};

// Check if demo mode is active
export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(DEMO_KEYS.ACTIVE) === 'true';
};

// Initialize demo mode
export const initDemoMode = (): void => {
  if (typeof window === 'undefined') return;
  
  sessionStorage.setItem(DEMO_KEYS.ACTIVE, 'true');
  sessionStorage.setItem(DEMO_KEYS.USER, JSON.stringify(DEMO_USER));
  sessionStorage.setItem(DEMO_KEYS.LABS, JSON.stringify(DEMO_LABS));
  sessionStorage.setItem(DEMO_KEYS.PROGRESS, JSON.stringify(DEMO_PROGRESS));
};

// Exit demo mode
export const exitDemoMode = (): void => {
  if (typeof window === 'undefined') return;
  
  Object.values(DEMO_KEYS).forEach(key => {
    sessionStorage.removeItem(key);
  });
};

// Auth API
export const demoAuth = {
  login: async () => {
    initDemoMode();
    return {
      success: true,
      data: {
        user: DEMO_USER,
        accessToken: 'demo-token',
        refreshToken: 'demo-refresh',
      },
    };
  },
  
  getMe: async () => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    return {
      success: true,
      data: DEMO_USER,
    };
  },
  
  logout: async () => {
    exitDemoMode();
    return { success: true };
  },
};

// Labs API
export const demoLabs = {
  getAll: async () => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    
    const saved = sessionStorage.getItem(DEMO_KEYS.LABS);
    const labs = saved ? JSON.parse(saved) : DEMO_LABS;
    
    return {
      success: true,
      data: labs,
    };
  },
  
  getById: async (id: string) => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    
    const saved = sessionStorage.getItem(DEMO_KEYS.LABS);
    const labs = saved ? JSON.parse(saved) : DEMO_LABS;
    const lab = labs.find((l: any) => l.id === id);
    
    if (!lab) throw new Error('Lab not found');
    
    return {
      success: true,
      data: lab,
    };
  },
};

// Phases API
export const demoPhases = {
  getLabPhases: async (labId: string) => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    
    // For demo-lab-2, return phases data
    if (labId === 'demo-lab-2') {
      return {
        success: true,
        data: DEMO_PHASES_DATA,
      };
    }
    
    // For other labs, return empty phases
    return {
      success: true,
      data: { phases: [], stats: null },
    };
  },
  
  startPhase: async (phaseId: string) => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    
    const phases = DEMO_PHASES_DATA.phases;
    const phase = phases.find((p: Phase) => p.id === phaseId);
    
    if (!phase) throw new Error('Phase not found');
    
    return {
      success: true,
      data: {
        ...phase,
        status: 'IN_PROGRESS',
      },
    };
  },
  
  validateAttempt: async (phaseId: string, attemptData: any): Promise<{ success: boolean; data: PhaseAttemptResult }> => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    
    const phases = DEMO_PHASES_DATA.phases;
    const phase = phases.find((p: Phase) => p.id === phaseId);
    
    if (!phase) throw new Error('Phase not found');
    
    // Simulate validation (70% success rate for demo)
    const isSuccess = Math.random() > 0.3;
    
    if (isSuccess) {
      return {
        success: true,
        data: {
          success: true,
          status: 'COMPLETED',
          score: phase.baseScore,
          attemptsUsed: phase.attemptsUsed + 1,
          attemptsRemaining: phase.maxAttempts - (phase.attemptsUsed + 1),
          feedback: '¡Excelente! Has completado la fase correctamente.',
          unlockedPhases: [],
        },
      };
    } else {
      return {
        success: false,
        data: {
          success: false,
          status: 'IN_PROGRESS',
          score: phase.currentScore - phase.penaltyPerAttempt,
          attemptsUsed: phase.attemptsUsed + 1,
          attemptsRemaining: phase.maxAttempts - (phase.attemptsUsed + 1),
          feedback: 'Configuración incorrecta. Revisa los parámetros de red.',
          hint: phase.hints[phase.hintsUsed] || 'Verifica la documentación.',
        },
      };
    }
  },
  
  getHint: async (phaseId: string): Promise<{ success: boolean; data: PhaseHintResult }> => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    
    const phases = DEMO_PHASES_DATA.phases;
    const phase = phases.find((p: Phase) => p.id === phaseId);
    
    if (!phase) throw new Error('Phase not found');
    
    const hintIndex = phase.hintsUsed;
    const hint = phase.hints[hintIndex] || 'No hay más pistas disponibles.';
    
    return {
      success: true,
      data: {
        hint,
        hintsRemaining: Math.max(phase.hints.length - (hintIndex + 1), 0),
      },
    };
  },
  
  resetPhase: async (phaseId: string) => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    
    return {
      success: true,
      data: { message: 'Fase reiniciada' },
    };
  },
};

// Progress API
export const demoProgress = {
  getAll: async () => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    
    const saved = sessionStorage.getItem(DEMO_KEYS.PROGRESS);
    const progress = saved ? JSON.parse(saved) : DEMO_PROGRESS;
    
    return {
      success: true,
      data: progress,
    };
  },
  
  getByLabId: async (labId: string) => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    
    const saved = sessionStorage.getItem(DEMO_KEYS.PROGRESS);
    const progress = saved ? JSON.parse(saved) : DEMO_PROGRESS;
    
    return {
      success: true,
      data: progress[labId] || null,
    };
  },
  
  update: async (labId: string, data: any) => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    
    const saved = sessionStorage.getItem(DEMO_KEYS.PROGRESS);
    const progress = saved ? JSON.parse(saved) : DEMO_PROGRESS;
    
    progress[labId] = { ...progress[labId], ...data };
    sessionStorage.setItem(DEMO_KEYS.PROGRESS, JSON.stringify(progress));
    
    return {
      success: true,
      data: progress[labId],
    };
  },
};

// Simulator API
export const demoSimulator = {
  saveTopology: async (topology: any) => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    
    sessionStorage.setItem(DEMO_KEYS.TOPOLOGY, JSON.stringify(topology));
    
    return {
      success: true,
      data: { message: 'Topología guardada' },
    };
  },
  
  loadTopology: async () => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    
    const saved = sessionStorage.getItem(DEMO_KEYS.TOPOLOGY);
    const topology = saved ? JSON.parse(saved) : null;
    
    return {
      success: true,
      data: topology,
    };
  },
};

// Dashboard API
export const demoDashboard = {
  getStats: async () => {
    if (!isDemoMode()) throw new Error('Demo mode not active');
    
    return {
      success: true,
      data: {
        labsAvailable: DEMO_LABS.length,
        labsCompleted: DEMO_USER.stats.labsCompleted,
        labsInProgress: DEMO_USER.stats.labsInProgress,
        averageScore: Math.round(DEMO_USER.stats.totalScore / Math.max(DEMO_USER.stats.labsCompleted, 1)),
        streakDays: DEMO_USER.stats.streakDays,
      },
    };
  },
};

// Export all
export const demoApi = {
  auth: demoAuth,
  labs: demoLabs,
  phases: demoPhases,
  progress: demoProgress,
  simulator: demoSimulator,
  dashboard: demoDashboard,
  isDemoMode,
  initDemoMode,
  exitDemoMode,
};
