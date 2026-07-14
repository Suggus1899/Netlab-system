import { Router, Request, Response, NextFunction } from 'express';
import { Role, createLabSchema } from '@si-learning/shared';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

export const labsRouter = Router();

// GET /api/labs — list published labs
// Students: only labs from their enrolled courses
// Teachers/Admins: all published labs
labsRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const where = req.userRole === Role.STUDENT
      ? {
          status: 'PUBLISHED' as const,
          assignments: { some: { course: { enrollments: { some: { userId: req.userId! } } } } },
        }
      : { status: 'PUBLISHED' as const };

    const labs = await prisma.lab.findMany({
      where,
      include: { steps: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: labs });
  } catch (err) {
    next(err);
  }
});

// GET /api/labs/:id
labsRouter.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lab = await prisma.lab.findUnique({
      where: { id: req.params.id },
      include: { steps: { orderBy: { order: 'asc' } }, creator: { select: { id: true, name: true } } },
    });
    if (!lab) throw new AppError('Laboratorio no encontrado', 404);
    res.json({ success: true, data: lab });
  } catch (err) {
    next(err);
  }
});

// POST /api/labs — create lab (teacher/admin)
labsRouter.post(
  '/',
  authenticate,
  authorize(Role.TEACHER, Role.ADMIN),
  validate(createLabSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const lab = await prisma.lab.create({
        data: {
          ...req.body,
          creatorId: req.userId!,
        },
      });
      res.status(201).json({ success: true, data: lab });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/labs/:id — update lab
labsRouter.patch(
  '/:id',
  authenticate,
  authorize(Role.TEACHER, Role.ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const lab = await prisma.lab.findUnique({ where: { id: req.params.id } });
      if (!lab) throw new AppError('Laboratorio no encontrado', 404);
      if (lab.creatorId !== req.userId && req.userRole !== Role.ADMIN) {
        throw new AppError('No tienes permisos para editar este laboratorio', 403);
      }

      const updated = await prisma.lab.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/labs/:id
labsRouter.delete(
  '/:id',
  authenticate,
  authorize(Role.TEACHER, Role.ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const lab = await prisma.lab.findUnique({ where: { id: req.params.id } });
      if (!lab) throw new AppError('Laboratorio no encontrado', 404);
      if (lab.creatorId !== req.userId && req.userRole !== Role.ADMIN) {
        throw new AppError('No tienes permisos para eliminar este laboratorio', 403);
      }

      await prisma.lab.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Laboratorio eliminado' });
    } catch (err) {
      next(err);
    }
  },
);
