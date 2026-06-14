import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { demoApi } from '@/lib/demo-api';
import { DEMO_USER, DEMO_LABS } from '@/types/demo';

interface DemoState {
  isDemoMode: boolean;
  demoUser: typeof DEMO_USER | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  enterDemoMode: () => Promise<void>;
  exitDemoMode: () => void;
  initDemoFromStorage: () => void;
}

export const useDemoStore = create<DemoState>()(
  devtools(
    (set, get) => ({
      isDemoMode: false,
      demoUser: null,
      loading: false,
      error: null,

      enterDemoMode: async () => {
        set({ loading: true, error: null });
        try {
          // Initialize demo session
          demoApi.initDemoMode();
          
          // Simulate login
          const result = await demoApi.auth.login();
          
          if (result.success) {
            // Save demo token
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('accessToken', result.data.accessToken);
            }
            
            set({
              isDemoMode: true,
              demoUser: result.data.user,
              loading: false,
            });
          } else {
            throw new Error('Error iniciando modo demo');
          }
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      exitDemoMode: () => {
        demoApi.exitDemoMode();
        
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
        }
        
        set({
          isDemoMode: false,
          demoUser: null,
          error: null,
        });
      },

      initDemoFromStorage: () => {
        if (typeof window === 'undefined') return;
        
        const isDemo = demoApi.isDemoMode();
        const savedUser = sessionStorage.getItem('demo_user');
        
        if (isDemo && savedUser) {
          try {
            const user = JSON.parse(savedUser);
            set({
              isDemoMode: true,
              demoUser: user,
            });
          } catch {
            // Invalid storage, exit demo
            get().exitDemoMode();
          }
        }
      },
    }),
    { name: 'demo-store' }
  )
);
