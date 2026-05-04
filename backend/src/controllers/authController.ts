import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { config } from '../config/config';
import emailService from '../services/emailService';

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
      });
    }

    // Find user by email. Login is email-only, so duplicate emails across tenants
    // would make identity resolution ambiguous.
    const userRepository = AppDataSource.getRepository(User);
    const matchingUsers = await userRepository.find({
      where: { email: email.toLowerCase() },
      relations: ['employee', 'employee.department', 'employee.designation'],
    });
    const user = matchingUsers[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    if (matchingUsers.length > 1) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'AMBIGUOUS_ACCOUNT',
          message: 'Multiple accounts use this email. Please contact support.',
        },
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account has been deactivated',
        },
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.userId,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry } as jwt.SignOptions
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        userId: user.userId,
        tenantId: user.tenantId,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiry } as jwt.SignOptions
    );

    // Update last login
    user.lastLogin = new Date();
    await userRepository.save(user);

    // Return user data without password
    const userData = {
      userId: user.userId,
      tenantId: user.tenantId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      employeeId: user.employeeId,
      employee: user.employee
        ? {
            employeeId: user.employee.employeeId,
            employeeCode: user.employee.employeeCode,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            email: user.employee.email,
            department: user.employee.department,
            designation: user.employee.designation,
          }
        : null,
    };

    return res.json({
      success: true,
      data: {
        user: userData,
        tokens: {
          token,
          refreshToken,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred during login',
      },
    });
  }
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Not authenticated
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { userId },
      relations: ['employee', 'employee.department', 'employee.designation'],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const userData = {
      userId: user.userId,
      tenantId: user.tenantId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      employeeId: user.employeeId,
      employee: user.employee
        ? {
            employeeId: user.employee.employeeId,
            employeeCode: user.employee.employeeCode,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            email: user.employee.email,
            department: user.employee.department,
            designation: user.employee.designation,
          }
        : null,
    };

    return res.json({
      success: true,
      data: userData,
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred',
      },
    });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
        },
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const matchingUsers = await userRepository.find({ where: { email } });

    if (matchingUsers.length !== 1 || !matchingUsers[0].isActive) {
      return res.json({
        success: true,
        data: {
          message: 'If an active account exists for this email, a reset link will be sent.',
        },
      });
    }

    const user = matchingUsers[0];
    const resetToken = jwt.sign(
      {
        purpose: 'password_reset',
        userId: user.userId,
      },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    await emailService.sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      resetToken,
    });

    return res.json({
      success: true,
      data: {
        message: 'If an active account exists for this email, a reset link will be sent.',
      },
    });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Unable to send password reset email. Please try again later.',
      },
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Reset token and new password are required',
        },
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters long',
        },
      });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, config.jwt.secret);
    } catch {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: 'This reset link is invalid or has expired',
        },
      });
    }

    if (payload.purpose !== 'password_reset' || !payload.userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: 'This reset link is invalid or has expired',
        },
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { userId: payload.userId } });

    if (!user || !user.isActive) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: 'This reset link is invalid or has expired',
        },
      });
    }

    if (payload.iat && user.updatedAt && payload.iat * 1000 < user.updatedAt.getTime()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: 'This reset link is no longer valid. Please request a new one.',
        },
      });
    }

    user.password = password;
    await userRepository.save(user);

    return res.json({
      success: true,
      data: {
        message: 'Password reset successful. You can now sign in.',
      },
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Unable to reset password. Please try again later.',
      },
    });
  }
};

export default {
  login,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
};
