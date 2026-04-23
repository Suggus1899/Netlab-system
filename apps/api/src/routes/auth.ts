import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loginSchema, registerSchema } from '@si-learning/shared';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

// In-memory reset token store: token → { userId, expiresAt }
const resetTokens = new Map<string, { userId: string; expiresAt: number }>();

const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' },
  );
  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' },
  );
  return { accessToken, refreshToken };
};

// POST /api/auth/register
authRouter.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, role } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new AppError('El email ya está registrado', 409);
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, role },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      const tokens = generateTokens(user.id, user.role);

      res.status(201).json({
        success: true,
        data: { user, tokens },
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/auth/login
authRouter.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new AppError('Credenciales inválidas', 401);
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new AppError('Credenciales inválidas', 401);
      }

      const tokens = generateTokens(user.id, user.role);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
          },
          tokens,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token requerido', 400);
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      userId: string;
      role: string;
    };

    const tokens = generateTokens(decoded.userId, decoded.role);
    res.json({ success: true, data: { tokens } });
  } catch {
    next(new AppError('Refresh token inválido', 401));
  }
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new AppError('Email requerido', 400);

    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond 200 to avoid email enumeration
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      resetTokens.set(token, { userId: user.id, expiresAt: Date.now() + 1000 * 60 * 30 }); // 30 min
      // In production: send email. Here we log to console for dev use.
      console.log(`\n[RESET TOKEN] ${email} → ${token}\n`);
    }
    res.json({ success: true, message: 'Si el email existe, recibirás el enlace de recuperación.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
authRouter.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) throw new AppError('Token y contraseña requeridos', 400);
    if (password.length < 8) throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);

    const entry = resetTokens.get(token);
    if (!entry || entry.expiresAt < Date.now()) {
      throw new AppError('Token inválido o expirado', 400);
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: entry.userId }, data: { password: hashed } });
    resetTokens.delete(token);

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});
