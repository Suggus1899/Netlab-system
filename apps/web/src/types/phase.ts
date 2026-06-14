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

export interface Phase {
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
  startedAt?: string;
  completedAt?: string;
  isUnlocked: boolean;
}

export interface PhaseStats {
  mandatoryCompleted: number;
  mandatoryTotal: number;
  optionalCompleted: number;
  optionalTotal: number;
  totalScore: number;
  maxPossibleScore: number;
  bonusScore: number;
}

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

export interface PhaseHintResult {
  hint: string;
  hintsRemaining: number;
}
