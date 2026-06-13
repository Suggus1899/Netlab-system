// Mock API for standalone frontend development
// Uses localStorage to persist data

const STORAGE_KEYS = {
  USER: 'mock_user',
  LABS: 'mock_labs',
  PROGRESS: 'mock_progress',
  COURSES: 'mock_courses',
};

// Mock user data
const DEFAULT_USER = {
  id: '1',
  name: 'Usuario Demo',
  email: 'demo@netlab.com',
  role: 'STUDENT' as const,
};

// Mock labs data
const DEFAULT_LABS = [
  {
    id: '1',
    title: 'Introducción a Redes',
    description: 'Aprende los fundamentos de networking con ejercicios prácticos de configuración básica.',
    difficulty: 'BEGINNER' as const,
    topic: 'TCP/IP',
    estimatedMinutes: 30,
    status: 'PUBLISHED',
    _count: { steps: 5 },
  },
  {
    id: '2',
    title: 'Configuración de Routers',
    description: 'Configura tablas de enrutamiento estático y dinámico usando OSPF.',
    difficulty: 'INTERMEDIATE' as const,
    topic: 'Enrutamiento',
    estimatedMinutes: 45,
    status: 'PUBLISHED',
    _count: { steps: 8 },
  },
  {
    id: '3',
    title: 'Seguridad de Redes',
    description: 'Implementa firewalls y ACLs para proteger tu infraestructura.',
    difficulty: 'ADVANCED' as const,
    topic: 'Seguridad',
    estimatedMinutes: 60,
    status: 'PUBLISHED',
    _count: { steps: 10 },
  },
  {
    id: '4',
    title: 'Subnetting y VLANs',
    description: 'Divide redes en subredes eficientes y configura VLANs para segmentación.',
    difficulty: 'INTERMEDIATE' as const,
    topic: 'TCP/IP',
    estimatedMinutes: 40,
    status: 'PUBLISHED',
    _count: { steps: 6 },
  },
];

// Mock progress data
const DEFAULT_PROGRESS = [
  {
    id: 'p1',
    labId: '1',
    status: 'COMPLETED',
    score: 85,
    currentStep: 5,
    lab: { id: '1', title: 'Introducción a Redes', topic: 'TCP/IP', difficulty: 'BEGINNER' },
  },
  {
    id: 'p2',
    labId: '2',
    status: 'IN_PROGRESS',
    score: null,
    currentStep: 3,
    lab: { id: '2', title: 'Configuración de Routers', topic: 'Enrutamiento', difficulty: 'INTERMEDIATE' },
  },
];

// Mock courses data
const DEFAULT_COURSES = [
  { id: '1', name: 'Fundamentos de Redes', description: 'Curso introductorio', _count: { labs: 4 } },
  { id: '2', name: 'Redes Avanzadas', description: 'Configuración avanzada', _count: { labs: 6 } },
];

// Initialize mock data
export function initMockData() {
  if (typeof window === 'undefined') return;
  
  if (!localStorage.getItem(STORAGE_KEYS.USER)) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LABS)) {
    localStorage.setItem(STORAGE_KEYS.LABS, JSON.stringify(DEFAULT_LABS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROGRESS)) {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(DEFAULT_PROGRESS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(DEFAULT_COURSES));
  }
}

// Mock API responses
export function mockLogin(email: string, password: string) {
  if (email && password) {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    const tokens = {
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
    };
    localStorage.setItem('refreshToken', tokens.refreshToken);
    return { user, tokens };
  }
  throw new Error('Credenciales inválidas');
}

export function mockFetchLabs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.LABS) || '[]');
}

export function mockFetchProgress() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS) || '[]');
}

export function mockFetchCourses() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]');
}

export function mockGetMe() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
}

// Check if backend is available
export async function isBackendAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    
    await fetch('http://localhost:4000/api/health', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}
