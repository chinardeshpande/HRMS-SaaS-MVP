// User roles
export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  HR_ADMIN = 'HR_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

// User interface
export interface User {
  userId: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: UserRole;
  employeeId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Auth tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  timestamp?: string;
}
