import { Router, Response, NextFunction } from 'express';
import { Role } from '@si-learning/shared';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const progressRouter = Router();

// GET /api/progress — student's progress across all labs
progressRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const progress = await prisma.studentProgress.findMany({
      where: { userId: req.userId },
      include: { lab: { select: { id: true, title: true, topic: true, difficulty: true } } },
      orderBy: { startedAt: 'desc' },
    });
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
});

// POST /api/progress/:labId/start
progressRouter.post('/:labId/start', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lab = await prisma.lab.findUnique({ where: { id: req.params.labId } });
    if (!lab) throw new AppError('Laboratorio no encontrado', 404);

    const existing = await prisma.studentProgress.findUnique({
      where: { userId_labId: { userId: req.userId!, labId: lab.id } },
    });
    if (existing) {
      return res.json({ success: true, data: existing });
    }

    const progress = await prisma.studentProgress.create({
      data: { userId: req.userId!, labId: lab.id, status: 'IN_PROGRESS' },
    });
    res.status(201).json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/progress/:labId — update step / complete
progressRouter.patch('/:labId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentStep, score, status } = req.body;

    const progress = await prisma.studentProgress.update({
      where: { userId_labId: { userId: req.userId!, labId: req.params.labId } },
      data: {
        ...(currentStep !== undefined && { currentStep }),
        ...(score !== undefined && { score }),
        ...(status && { status }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
    });
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
});

// GET /api/progress/lab/:labId/students — teacher view: all students' progress for a lab
progressRouter.get(
  '/lab/:labId/students',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.userRole !== Role.TEACHER && req.userRole !== Role.ADMIN) {
        throw new AppError('Solo profesores pueden ver el progreso de los alumnos', 403);
      }

      const progress = await prisma.studentProgress.findMany({
        where: { labId: req.params.labId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { startedAt: 'desc' },
      });
      res.json({ success: true, data: progress });
    } catch (err) {
      next(err);
    }
  },
);
