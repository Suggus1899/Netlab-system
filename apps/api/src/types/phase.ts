export enum PhaseType {
  MANDATORY = 'MANDATORY',
  OPTIONAL = 'OPTIONAL',
}

export enum PhaseStatus {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface PhaseValidationRule {
  type: 'ping' | 'config' | 'routing' | 'firewall' | 'connectivity' | 'device_count';
  target?: string;
  expected?: string | number | boolean;
  message?: string;
}

export interface CreatePhaseInput {
  order: number;
  type: PhaseType;
  title: string;
  description: string;
  theoryContent?: string;
  instructions: string;
  validationRules: PhaseValidationRule[];
  maxAttempts?: number;
  timeLimitMinutes?: number;
  baseScore?: number;
  penaltyPerAttempt?: number;
  hints?: string[];
  requiredPhaseIds?: string[];
}

export interface UpdatePhaseInput extends Partial<CreatePhaseInput> {}

export interface PhaseAttemptResult {
  success: boolean;
  status: PhaseStatus;
  score: number;
  attemptsUsed: number;
  attemptsRemaining: number;
  feedback: string;
  hint?: string;
  unlockedPhases?: string[];
}

export interface PhaseWithProgress {
  id: string;
  order: number;
  type: PhaseType;
  title: string;
  description: string;
  theoryContent?: string;
  instructions: string;
  maxAttempts: number;
  baseScore: number;
  penaltyPerAttempt: number;
  hints: string[];
  status: PhaseStatus;
  attemptsUsed: number;
  currentScore: number;
  hintsUsed: number;
  startedAt?: Date;
  completedAt?: Date;
  isUnlocked: boolean;
}

export interface LabPhaseStats {
  mandatoryCompleted: number;
  mandatoryTotal: number;
  optionalCompleted: number;
  optionalTotal: number;
  totalScore: number;
  maxPossibleScore: number;
  bonusScore: number;
}
