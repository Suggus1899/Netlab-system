import { Router, Response, NextFunction } from 'express';
import { Role, createCourseSchema } from '@si-learning/shared';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

export const coursesRouter = Router();

// GET /api/courses
coursesRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let courses;
    if (req.userRole === Role.TEACHER) {
      courses = await prisma.course.findMany({
        where: { teacherId: req.userId },
        include: { _count: { select: { enrollments: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else if (req.userRole === Role.STUDENT) {
      courses = await prisma.course.findMany({
        where: { enrollments: { some: { userId: req.userId } } },
        include: { teacher: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      courses = await prisma.course.findMany({
        include: { teacher: { select: { id: true, name: true } }, _count: { select: { enrollments: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    res.json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
});

// POST /api/courses
coursesRouter.post(
  '/',
  authenticate,
  authorize(Role.TEACHER, Role.ADMIN),
  validate(createCourseSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const course = await prisma.course.create({
        data: { ...req.body, teacherId: req.userId! },
      });
      res.status(201).json({ success: true, data: course });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/courses/:id/enroll
coursesRouter.post(
  '/:id/enroll',
  authenticate,
  authorize(Role.STUDENT),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const course = await prisma.course.findUnique({ where: { id: req.params.id } });
      if (!course) throw new AppError('Curso no encontrado', 404);

      await prisma.enrollment.create({
        data: { userId: req.userId!, courseId: course.id },
      });
      res.status(201).json({ success: true, message: 'Inscrito exitosamente' });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/courses/:id
coursesRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        teacher: { select: { id: true, name: true } },
        enrollments: { include: { user: { select: { id: true, name: true, email: true } } } },
        assignments: { include: { lab: true } },
      },
    });
    if (!course) throw new AppError('Curso no encontrado', 404);
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
});
