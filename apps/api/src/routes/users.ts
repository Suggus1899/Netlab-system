import { Router, Response, NextFunction } from 'express';
import { Role } from '@si-learning/shared';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const usersRouter = Router();

// GET /api/users — list users (admin only)
usersRouter.get(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/users/:id
usersRouter.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });
      if (!user) throw new AppError('Usuario no encontrado', 404);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/users/:id
usersRouter.patch(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.userId !== req.params.id && req.userRole !== Role.ADMIN) {
        throw new AppError('No puedes editar este perfil', 403);
      }

      const { name, email } = req.body;
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { ...(name && { name }), ...(email && { email }) },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
);
