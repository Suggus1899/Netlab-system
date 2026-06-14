import type { UserPublic } from '@si-learning/shared';
import { Role, Difficulty } from '@si-learning/shared';

export interface DemoUser extends UserPublic {
  avatarUrl: string | null;
  stats: {
    labsCompleted: number;
    labsInProgress: number;
    totalScore: number;
    streakDays: number;
    badges: { id: string; name: string; icon: string }[];
  };
}

export interface DemoLab {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  topic: string;
  estimatedMinutes: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  score?: number;
  currentStep?: number;
  hasPhases?: boolean;
  phases?: DemoPhase[];
  topologyData?: {
    nodes: any[];
    edges: any[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface DemoPhase {
  id: string;
  order: number;
  type: 'MANDATORY' | 'OPTIONAL';
  title: string;
  description: string;
  instructions: string;
  theoryContent?: string;
  validationRules?: any[];
  maxAttempts: number;
  baseScore: number;
  penaltyPerAttempt: number;
  hints: string[];
  requiredPhaseIds: string[];
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  attemptsUsed: number;
  currentScore: number;
  hintsUsed: number;
  isUnlocked: boolean;
}

export interface DemoPhaseStats {
  mandatoryCompleted: number;
  mandatoryTotal: number;
  optionalCompleted: number;
  optionalTotal: number;
  totalScore: number;
  maxPossibleScore: number;
  bonusScore: number;
}

export interface DemoProgress {
  [labId: string]: {
    status: string;
    score?: number;
    currentStep?: number;
    completedAt?: string;
    startedAt?: string;
  };
}

export const DEMO_USER: DemoUser = {
  id: 'demo-user',
  name: 'Usuario Demo',
  email: 'demo@silearning.com',
  role: Role.STUDENT,
  createdAt: '2024-01-01T00:00:00Z',
  avatarUrl: null,
  stats: {
    labsCompleted: 2,
    labsInProgress: 1,
    totalScore: 850,
    streakDays: 3,
    badges: [
      { id: 'first-lab', name: 'Primer Lab', icon: '🎯' },
      { id: 'streak-3', name: 'Racha 3 días', icon: '🔥' },
    ],
  },
};

export const DEMO_LABS: DemoLab[] = [
  {
    id: 'demo-lab-1',
    title: 'Introducción a Redes',
    description: 'Aprende los conceptos básicos de redes. Configura tu primera topología con PCs y un switch simple.',
    difficulty: Difficulty.BEGINNER,
    topic: 'Fundamentos',
    estimatedMinutes: 15,
    status: 'COMPLETED',
    score: 100,
    hasPhases: false,
    topologyData: {
      nodes: [
        { id: 'pc1', type: 'PC', label: 'PC1', x: 100, y: 100 },
        { id: 'pc2', type: 'PC', label: 'PC2', x: 300, y: 100 },
        { id: 'sw1', type: 'SWITCH', label: 'Switch1', x: 200, y: 200 },
      ],
      edges: [
        { id: 'e1', source: 'pc1', target: 'sw1' },
        { id: 'e2', source: 'pc2', target: 'sw1' },
      ],
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'demo-lab-2',
    title: 'Configuración de Router',
    description: 'Configura interfaces de red y establece rutas estáticas entre dos subredes diferentes.',
    difficulty: Difficulty.INTERMEDIATE,
    topic: 'Ruteo',
    estimatedMinutes: 30,
    status: 'IN_PROGRESS',
    currentStep: 2,
    hasPhases: true,
    phases: [
      {
        id: 'phase-1',
        order: 1,
        type: 'MANDATORY',
        title: 'Configuración de Interfaces',
        description: 'Asigna direcciones IP a las interfaces del router',
        instructions: 'Configura la interfaz eth0 con IP 192.168.1.1/24 y la interfaz eth1 con IP 192.168.2.1/24',
        theoryContent: '## Configuración de Interfaces\n\nPara que un router pueda comunicar diferentes redes, debes configurar sus interfaces con IPs de cada subred.\n\n### Comandos útiles:\n- `interface eth0` - Entrar en modo configuración\n- `ip address 192.168.1.1/24` - Asignar IP\n- `no shutdown` - Activar interfaz',
        validationRules: [{ type: 'config', target: 'eth0', expected: '192.168.1.1' }],
        maxAttempts: 3,
        baseScore: 50,
        penaltyPerAttempt: 5,
        hints: [
          'Verifica que la máscara sea /24',
          'Asegúrate de activar la interfaz con "no shutdown"',
          'Revisa que la IP esté en el rango correcto',
        ],
        requiredPhaseIds: [],
        status: 'COMPLETED',
        attemptsUsed: 1,
        currentScore: 50,
        hintsUsed: 0,
        isUnlocked: true,
      },
      {
        id: 'phase-2',
        order: 2,
        type: 'MANDATORY',
        title: 'Gateway Predeterminado',
        description: 'Configura la ruta por defecto para acceso externo',
        instructions: 'Establece el gateway por defecto en ambas subredes',
        theoryContent: '## Gateway Predeterminado\n\nEl gateway es la puerta de salida hacia otras redes. Cada dispositivo necesita conocer su gateway para comunicarse fuera de su subred local.',
        validationRules: [{ type: 'routing', target: 'default', expected: true }],
        maxAttempts: 3,
        baseScore: 50,
        penaltyPerAttempt: 5,
        hints: [
          'Usa el comando "ip route" para ver rutas',
          'El gateway debe ser la IP del router en esa subred',
        ],
        requiredPhaseIds: ['phase-1'],
        status: 'IN_PROGRESS',
        attemptsUsed: 1,
        currentScore: 45,
        hintsUsed: 1,
        isUnlocked: true,
      },
      {
        id: 'phase-3',
        order: 3,
        type: 'OPTIONAL',
        title: 'Verificación con Ping',
        description: 'Valida la conectividad entre subredes',
        instructions: 'Realiza ping entre PCs de diferentes subredes',
        theoryContent: '## Comando Ping\n\nPing utiliza ICMP para verificar conectividad entre dispositivos. Es la herramienta básica de troubleshooting.',
        validationRules: [{ type: 'ping', target: 'cross-subnet', expected: true }],
        maxAttempts: 5,
        baseScore: 30,
        penaltyPerAttempt: 3,
        hints: [
          'Verifica primero conectividad local',
          'Revisa la tabla de enrutamiento',
          'Asegúrate que el firewall no bloquee ICMP',
        ],
        requiredPhaseIds: ['phase-2'],
        status: 'LOCKED',
        attemptsUsed: 0,
        currentScore: 30,
        hintsUsed: 0,
        isUnlocked: false,
      },
    ],
    topologyData: {
      nodes: [
        { id: 'pc1', type: 'PC', label: 'PC-Red1', x: 100, y: 100, config: { ip: '192.168.1.10', gateway: '192.168.1.1' } },
        { id: 'pc2', type: 'PC', label: 'PC-Red2', x: 500, y: 100, config: { ip: '192.168.2.10', gateway: '192.168.2.1' } },
        { id: 'router', type: 'ROUTER', label: 'Router', x: 300, y: 200 },
      ],
      edges: [
        { id: 'e1', source: 'pc1', target: 'router', sourceInterface: 'eth0' },
        { id: 'e2', source: 'pc2', target: 'router', sourceInterface: 'eth1' },
      ],
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'demo-lab-3',
    title: 'VLANs y Trunking',
    description: 'Segmenta tu red usando VLANs y configura puertos trunk entre switches.',
    difficulty: Difficulty.ADVANCED,
    topic: 'Switching',
    estimatedMinutes: 45,
    status: 'NOT_STARTED',
    hasPhases: true,
    topologyData: {
      nodes: [
        { id: 'sw1', type: 'SWITCH', label: 'Switch-Core', x: 200, y: 200 },
        { id: 'sw2', type: 'SWITCH', label: 'Switch-Acceso', x: 400, y: 200 },
        { id: 'pc1', type: 'PC', label: 'PC-VLAN10', x: 100, y: 100 },
        { id: 'pc2', type: 'PC', label: 'PC-VLAN20', x: 500, y: 100 },
      ],
      edges: [
        { id: 'e1', source: 'pc1', target: 'sw1' },
        { id: 'e2', source: 'pc2', target: 'sw2' },
        { id: 'trunk', source: 'sw1', target: 'sw2', label: 'Trunk' },
      ],
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'demo-lab-4',
    title: 'Firewall y Seguridad',
    description: 'Configura reglas de firewall para proteger tu red perimetral.',
    difficulty: Difficulty.ADVANCED,
    topic: 'Seguridad',
    estimatedMinutes: 40,
    status: 'NOT_STARTED',
    hasPhases: false,
    topologyData: {
      nodes: [
        { id: 'pc1', type: 'PC', label: 'PC-Interno', x: 100, y: 200 },
        { id: 'fw', type: 'FIREWALL', label: 'Firewall', x: 300, y: 200 },
        { id: 'server', type: 'SERVER', label: 'Web-Server', x: 500, y: 200 },
        { id: 'internet', type: 'CLOUD', label: 'Internet', x: 300, y: 100 },
      ],
      edges: [
        { id: 'e1', source: 'pc1', target: 'fw' },
        { id: 'e2', source: 'fw', target: 'server' },
        { id: 'e3', source: 'fw', target: 'internet' },
      ],
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

export const DEMO_PROGRESS: DemoProgress = {
  'demo-lab-1': {
    status: 'COMPLETED',
    score: 100,
    completedAt: '2024-06-10T10:00:00Z',
  },
  'demo-lab-2': {
    status: 'IN_PROGRESS',
    score: 45,
    currentStep: 2,
    startedAt: '2024-06-13T15:00:00Z',
  },
};

export const DEMO_STATS = {
  totalScore: 850,
  bonusScore: 0,
  mandatoryCompleted: 1,
  mandatoryTotal: 3,
  optionalCompleted: 0,
  optionalTotal: 1,
};

export const DEMO_PHASES_DATA: { phases: DemoPhase[]; stats: DemoPhaseStats } = {
  phases: DEMO_LABS[1].phases || [],
  stats: {
    mandatoryCompleted: 1,
    mandatoryTotal: 2,
    optionalCompleted: 0,
    optionalTotal: 1,
    totalScore: 95,
    maxPossibleScore: 130,
    bonusScore: 0,
  },
};
