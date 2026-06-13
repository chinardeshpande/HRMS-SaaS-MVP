import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { config } from '../config/config';
import { User } from '../models/User';
import { withoutTenantScope } from '../middleware/tenantContext';

export type DemoPersonaKey = 'admin' | 'hr' | 'manager' | 'employee' | 'finance';

export interface DemoPersona {
  key: DemoPersonaKey;
  label: string;
  email: string;
  role: string;
  journey: string;
}

export const DEMO_TENANT_SUBDOMAIN = 'aurorahr-demo';
export const DEMO_PASSWORD = 'Demo@12345';

export const demoPersonas: DemoPersona[] = [
  {
    key: 'admin',
    label: 'Founder / Admin',
    email: 'demo.admin@aurorahr.in',
    role: 'system_admin',
    journey: 'Organization setup, subscription, master data, and executive dashboards',
  },
  {
    key: 'hr',
    label: 'HR Lead',
    email: 'demo.hr@aurorahr.in',
    role: 'hr_admin',
    journey: 'Employee lifecycle, onboarding, probation, documents, leave, and exits',
  },
  {
    key: 'manager',
    label: 'People Manager',
    email: 'demo.manager@aurorahr.in',
    role: 'manager',
    journey: 'Team attendance, leave approvals, probation reviews, and performance',
  },
  {
    key: 'employee',
    label: 'Employee',
    email: 'demo.employee@aurorahr.in',
    role: 'employee',
    journey: 'Self-service attendance, leave, documents, HR Connect, and goals',
  },
  {
    key: 'finance',
    label: 'Finance / Ops',
    email: 'demo.finance@aurorahr.in',
    role: 'hr_admin',
    journey: 'Subscription, payments, reports, and operational controls',
  },
];

const getPersona = (personaKey?: string): DemoPersona => {
  return demoPersonas.find((persona) => persona.key === personaKey) || demoPersonas[1];
};

export const createDemoSession = async (personaKey?: string) => {
  const persona = getPersona(personaKey);

  // Demo sessions deliberately hop into the demo tenant — both the pre-auth
  // /demo/login path and an authenticated user switching from their own
  // tenant. Sanctioned cross-tenant access => logged escape hatch (A2a).
  const user = await withoutTenantScope('demo: resolve demo persona user', () =>
    AppDataSource.getRepository(User).findOne({
      where: { email: persona.email, isActive: true },
      relations: ['tenant', 'employee', 'employee.department', 'employee.designation'],
    })
  );

  if (!user || user.tenant?.subdomain !== DEMO_TENANT_SUBDOMAIN) {
    const error: any = new Error('Demo data is not available. Please run the demo seed first.');
    error.statusCode = 503;
    error.code = 'DEMO_NOT_READY';
    throw error;
  }

  const tokenPayload = {
    userId: user.userId,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
  };

  const token = jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiry,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(
    {
      userId: user.userId,
      tenantId: user.tenantId,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiry } as jwt.SignOptions
  );

  user.lastLogin = new Date();
  await withoutTenantScope('demo: stamp demo user lastLogin', () =>
    AppDataSource.getRepository(User).save(user)
  );

  return {
    user: {
      userId: user.userId,
      tenantId: user.tenantId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      employeeId: user.employeeId,
      isDemoMode: true,
      demoPersona: persona.key,
      tenant: {
        companyName: user.tenant.companyName,
        subdomain: user.tenant.subdomain,
      },
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
    },
    tokens: {
      token,
      refreshToken,
    },
    demo: {
      tenantSubdomain: DEMO_TENANT_SUBDOMAIN,
      resetPolicy: 'Demo data is reset by the seed script and can be restored to a known clean state.',
      personas: demoPersonas,
    },
  };
};
