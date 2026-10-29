import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { Role } from '../types/role';
import { AppError } from '../middlewares/error.middleware';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

export class AuthService {
  /**
   * Register a new user
   * Note: Role is intentionally hardcoded to USER to prevent Privilege Escalation attacks.
   */
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existingUser) {
      throw new AppError('Email is already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        role: Role.USER
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return user;
  }

  /**
   * Login user and issue JWT token
   */
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      // Use uniform error message to prevent user enumeration
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role as Role
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as Role
      }
    };
  }
}

export const authService = new AuthService();
