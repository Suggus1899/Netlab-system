import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createPhase,
  getLabPhasesWithProgress,
  startPhase,
  validatePhaseAttempt,
  getPhaseHint,
  resetPhase,
  updatePhase,
  deletePhase,
} from '../services/phaseService';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/labs/:labId/phases - Obtener fases del lab con progreso
router.get('/labs/:labId/phases', async (req, res, next) => {
  try {
    const { labId } = req.params;
    const userId = req.userId;

    const result = await getLabPhasesWithProgress(labId, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/phases - Crear fase (solo teacher/admin)
router.post('/phases', async (req, res, next) => {
  try {
    if (req.userRole === 'STUDENT') {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para crear fases',
      });
    }

    const { labId, ...phaseData } = req.body;
    const phase = await createPhase(labId, phaseData);

    res.status(201).json({
      success: true,
      data: phase,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/phases/:id/start - Iniciar fase
router.post('/phases/:id/start', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const phase = await startPhase(id, userId);

    res.json({
      success: true,
      data: phase,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/phases/:id/validate - Validar intento
router.post('/phases/:id/validate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const attemptData = req.body;

    const result = await validatePhaseAttempt(id, userId, attemptData);

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/phases/:id/hint - Obtener hint
router.get('/phases/:id/hint', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await getPhaseHint(id, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/phases/:id/reset - Reiniciar fase
router.post('/phases/:id/reset', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    await resetPhase(id, userId);

    res.json({
      success: true,
      message: 'Fase reiniciada exitosamente',
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/phases/:id - Actualizar fase (solo teacher/admin)
router.put('/phases/:id', async (req, res, next) => {
  try {
    if (req.userRole === 'STUDENT') {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para actualizar fases',
      });
    }

    const { id } = req.params;
    const phase = await updatePhase(id, req.body);

    res.json({
      success: true,
      data: phase,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/phases/:id - Eliminar fase (solo teacher/admin)
router.delete('/phases/:id', async (req, res, next) => {
  try {
    if (req.userRole === 'STUDENT') {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para eliminar fases',
      });
    }

    const { id } = req.params;
    await deletePhase(id);

    res.json({
      success: true,
      message: 'Fase eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
});

export { router as phasesRouter };
