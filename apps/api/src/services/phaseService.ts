import { PrismaClient, PhaseStatus, PhaseType } from '@prisma/client';
import type {
  CreatePhaseInput,
  UpdatePhaseInput,
  PhaseAttemptResult,
  PhaseWithProgress,
  LabPhaseStats,
  PhaseValidationRule,
} from '../types/phase';

const prisma = new PrismaClient();

// Calcular score con penalización
const calculatePhaseScore = (
  baseScore: number,
  attemptsUsed: number,
  penaltyPerAttempt: number,
  isBonus: boolean
): number => {
  const maxPenalty = baseScore * 0.5; // Máximo 50% de penalización
  const penalty = Math.min(attemptsUsed * penaltyPerAttempt, maxPenalty);
  return Math.max(baseScore - penalty, 0);
};

// Verificar si una fase está desbloqueada
const isPhaseUnlocked = (
  phase: { requiredPhaseIds: string[] },
  userProgress: Map<string, PhaseStatus>
): boolean => {
  if (!phase.requiredPhaseIds || phase.requiredPhaseIds.length === 0) {
    return true;
  }
  return phase.requiredPhaseIds.every(
    (id) => userProgress.get(id) === PhaseStatus.COMPLETED
  );
};

// Crear fase
export const createPhase = async (
  labId: string,
  data: CreatePhaseInput
) => {
  const phase = await prisma.labPhase.create({
    data: {
      ...data,
      labId,
      validationRules: JSON.stringify(data.validationRules),
    },
  });

  // Actualizar lab para indicar que tiene fases
  await prisma.lab.update({
    where: { id: labId },
    data: { hasPhases: true },
  });

  return phase;
};

// Obtener fases de un lab con progreso del usuario
export const getLabPhasesWithProgress = async (
  labId: string,
  userId: string
): Promise<{ phases: PhaseWithProgress[]; stats: LabPhaseStats }> => {
  // Obtener fases del lab
  const phases = await prisma.labPhase.findMany({
    where: { labId },
    orderBy: { order: 'asc' },
  });

  // Obtener progreso del usuario
  const progressRecords = await prisma.phaseProgress.findMany({
    where: {
      userId,
      phaseId: { in: phases.map((p) => p.id) },
    },
  });

  const progressMap = new Map(
    progressRecords.map((p) => [p.phaseId, p])
  );

  const statusMap = new Map(
    progressRecords.map((p) => [p.phaseId, p.status])
  );

  // Construir respuesta con progreso
  const phasesWithProgress: PhaseWithProgress[] = phases.map((phase) => {
    const progress = progressMap.get(phase.id);
    const isUnlocked = isPhaseUnlocked(phase, statusMap);

    let status = progress?.status || PhaseStatus.LOCKED;
    if (!progress && isUnlocked) {
      status = PhaseStatus.AVAILABLE;
    }

    return {
      id: phase.id,
      order: phase.order,
      type: phase.type,
      title: phase.title,
      description: phase.description,
      theoryContent: phase.theoryContent || undefined,
      instructions: phase.instructions,
      maxAttempts: phase.maxAttempts,
      baseScore: phase.baseScore,
      penaltyPerAttempt: phase.penaltyPerAttempt,
      hints: phase.hints,
      status,
      attemptsUsed: progress?.attemptsUsed || 0,
      currentScore: progress?.currentScore || phase.baseScore,
      hintsUsed: progress?.hintsUsed || 0,
      startedAt: progress?.startedAt || undefined,
      completedAt: progress?.completedAt || undefined,
      isUnlocked,
    };
  });

  // Calcular estadísticas
  const mandatory = phasesWithProgress.filter((p) => p.type === PhaseType.MANDATORY);
  const optional = phasesWithProgress.filter((p) => p.type === PhaseType.OPTIONAL);

  const mandatoryCompleted = mandatory.filter(
    (p) => p.status === PhaseStatus.COMPLETED
  ).length;
  const optionalCompleted = optional.filter(
    (p) => p.status === PhaseStatus.COMPLETED
  ).length;

  const totalScore = phasesWithProgress.reduce(
    (sum, p) => sum + (p.status === PhaseStatus.COMPLETED ? p.currentScore : 0),
    0
  );

  const maxPossibleScore = phases.reduce(
    (sum, p) => sum + p.baseScore + (p.type === PhaseType.OPTIONAL ? 50 : 0),
    0
  );

  const bonusScore = optional
    .filter((p) => p.status === PhaseStatus.COMPLETED)
    .reduce((sum, p) => sum + p.currentScore, 0);

  return {
    phases: phasesWithProgress,
    stats: {
      mandatoryCompleted,
      mandatoryTotal: mandatory.length,
      optionalCompleted,
      optionalTotal: optional.length,
      totalScore,
      maxPossibleScore,
      bonusScore,
    },
  };
};

// Iniciar fase
export const startPhase = async (
  phaseId: string,
  userId: string
): Promise<PhaseWithProgress> => {
  const phase = await prisma.labPhase.findUnique({
    where: { id: phaseId },
  });

  if (!phase) {
    throw new Error('Fase no encontrada');
  }

  // Verificar si ya tiene progreso
  let progress = await prisma.phaseProgress.findUnique({
    where: {
      userId_phaseId: { userId, phaseId },
    },
  });

  if (!progress) {
    // Crear progreso inicial
    progress = await prisma.phaseProgress.create({
      data: {
        userId,
        phaseId,
        status: PhaseStatus.IN_PROGRESS,
        currentScore: phase.baseScore,
      },
    });
  } else if (progress.status === PhaseStatus.LOCKED) {
    // Desbloquear
    progress = await prisma.phaseProgress.update({
      where: { id: progress.id },
      data: { status: PhaseStatus.IN_PROGRESS },
    });
  }

  const phases = await getLabPhasesWithProgress(phase.labId, userId);
  const phaseWithProgress = phases.phases.find((p) => p.id === phaseId)!;

  return phaseWithProgress;
};

// Validar intento de fase
export const validatePhaseAttempt = async (
  phaseId: string,
  userId: string,
  attemptData: { topologyState?: any; actions?: any[] }
): Promise<PhaseAttemptResult> => {
  const phase = await prisma.labPhase.findUnique({
    where: { id: phaseId },
  });

  if (!phase) {
    throw new Error('Fase no encontrada');
  }

  // Obtener o crear progreso
  let progress = await prisma.phaseProgress.findUnique({
    where: {
      userId_phaseId: { userId, phaseId },
    },
  });

  if (!progress) {
    progress = await prisma.phaseProgress.create({
      data: {
        userId,
        phaseId,
        status: PhaseStatus.IN_PROGRESS,
        currentScore: phase.baseScore,
      },
    });
  }

  // Verificar si ya está completada
  if (progress.status === PhaseStatus.COMPLETED) {
    return {
      success: true,
      status: PhaseStatus.COMPLETED,
      score: progress.currentScore,
      attemptsUsed: progress.attemptsUsed,
      attemptsRemaining: phase.maxAttempts - progress.attemptsUsed,
      feedback: 'Fase ya completada',
    };
  }

  // Verificar límite de intentos
  if (progress.attemptsUsed >= phase.maxAttempts) {
    await prisma.phaseProgress.update({
      where: { id: progress.id },
      data: { status: PhaseStatus.FAILED },
    });

    return {
      success: false,
      status: PhaseStatus.FAILED,
      score: 0,
      attemptsUsed: progress.attemptsUsed,
      attemptsRemaining: 0,
      feedback: 'Límite de intentos alcanzado. La fase ha sido marcada como fallida.',
    };
  }

  // TODO: Implementar validación real según validationRules
  // Por ahora simulamos éxito/fallo aleatorio para demo
  const isSuccess = Math.random() > 0.3; // 70% éxito para demo

  if (isSuccess) {
    // Éxito
    const finalScore = calculatePhaseScore(
      phase.baseScore,
      progress.attemptsUsed,
      phase.penaltyPerAttempt,
      phase.type === PhaseType.OPTIONAL
    );

    await prisma.phaseProgress.update({
      where: { id: progress.id },
      data: {
        status: PhaseStatus.COMPLETED,
        attemptsUsed: progress.attemptsUsed + 1,
        currentScore: finalScore,
        completedAt: new Date(),
        validationData: attemptData,
      },
    });

    // Buscar fases desbloqueadas
    const allPhases = await prisma.labPhase.findMany({
      where: { labId: phase.labId },
    });

    const completedPhases = await prisma.phaseProgress.findMany({
      where: {
        userId,
        status: PhaseStatus.COMPLETED,
      },
    });

    const completedIds = new Set(completedPhases.map((p) => p.phaseId));

    const unlockedPhases = allPhases
      .filter(
        (p) =>
          p.requiredPhaseIds.length > 0 &&
          p.requiredPhaseIds.every((id) => completedIds.has(id))
      )
      .map((p) => p.id);

    // Actualizar progreso del lab
    await updateLabProgress(phase.labId, userId);

    return {
      success: true,
      status: PhaseStatus.COMPLETED,
      score: finalScore,
      attemptsUsed: progress.attemptsUsed + 1,
      attemptsRemaining: phase.maxAttempts - (progress.attemptsUsed + 1),
      feedback: '¡Excelente trabajo! Has completado la fase correctamente.',
      unlockedPhases,
    };
  } else {
    // Fallo
    const newAttempts = progress.attemptsUsed + 1;
    const isFailed = newAttempts >= phase.maxAttempts;

    await prisma.phaseProgress.update({
      where: { id: progress.id },
      data: {
        status: isFailed ? PhaseStatus.FAILED : PhaseStatus.IN_PROGRESS,
        attemptsUsed: newAttempts,
        lastAttemptAt: new Date(),
      },
    });

    const hint = phase.hints[progress.hintsUsed] || 'Revisa la configuración de red.';

    return {
      success: false,
      status: isFailed ? PhaseStatus.FAILED : PhaseStatus.IN_PROGRESS,
      score: calculatePhaseScore(
        phase.baseScore,
        newAttempts,
        phase.penaltyPerAttempt,
        phase.type === PhaseType.OPTIONAL
      ),
      attemptsUsed: newAttempts,
      attemptsRemaining: phase.maxAttempts - newAttempts,
      feedback: isFailed
        ? 'Has alcanzado el límite de intentos. La fase está marcada como fallida.'
        : `Intento fallido. Te quedan ${phase.maxAttempts - newAttempts} intentos.`,
      hint,
    };
  }
};

// Obtener hint
export const getPhaseHint = async (
  phaseId: string,
  userId: string
): Promise<{ hint: string; hintsRemaining: number }> => {
  const phase = await prisma.labPhase.findUnique({
    where: { id: phaseId },
    select: { hints: true },
  });

  if (!phase) {
    throw new Error('Fase no encontrada');
  }

  let progress = await prisma.phaseProgress.findUnique({
    where: {
      userId_phaseId: { userId, phaseId },
    },
  });

  if (!progress) {
    progress = await prisma.phaseProgress.create({
      data: {
        userId,
        phaseId,
        status: PhaseStatus.IN_PROGRESS,
      },
    });
  }

  const hintIndex = progress.hintsUsed;
  const hint = phase.hints[hintIndex] || 'No hay más pistas disponibles.';

  // Incrementar contador de hints usados
  await prisma.phaseProgress.update({
    where: { id: progress.id },
    data: { hintsUsed: progress.hintsUsed + 1 },
  });

  return {
    hint,
    hintsRemaining: Math.max(phase.hints.length - (hintIndex + 1), 0),
  };
};

// Reiniciar fase
export const resetPhase = async (phaseId: string, userId: string) => {
  const phase = await prisma.labPhase.findUnique({
    where: { id: phaseId },
  });

  if (!phase) {
    throw new Error('Fase no encontrada');
  }

  await prisma.phaseProgress.deleteMany({
    where: {
      userId,
      phaseId,
    },
  });

  // Reiniciar progreso del lab
  await updateLabProgress(phase.labId, userId);

  return { success: true };
};

// Actualizar progreso del lab
const updateLabProgress = async (labId: string, userId: string) => {
  const { stats } = await getLabPhasesWithProgress(labId, userId);

  const allMandatoryCompleted =
    stats.mandatoryCompleted === stats.mandatoryTotal;

  const labProgress = await prisma.studentProgress.findUnique({
    where: {
      userId_labId: { userId, labId },
    },
  });

  if (labProgress) {
    await prisma.studentProgress.update({
      where: { id: labProgress.id },
      data: {
        score: stats.totalScore,
        bonusScore: stats.bonusScore,
        totalScore: stats.totalScore + stats.bonusScore,
        status: allMandatoryCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: allMandatoryCompleted ? new Date() : null,
      },
    });
  }
};

// Actualizar fase
export const updatePhase = async (
  phaseId: string,
  data: UpdatePhaseInput
) => {
  const updateData: any = { ...data };

  if (data.validationRules) {
    updateData.validationRules = JSON.stringify(data.validationRules);
  }

  return prisma.labPhase.update({
    where: { id: phaseId },
    data: updateData,
  });
};

// Eliminar fase
export const deletePhase = async (phaseId: string) => {
  return prisma.labPhase.delete({
    where: { id: phaseId },
  });
};
