import { ComponentType, SVGProps } from 'react';
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  UserPlusIcon,
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { UserRole } from '../types';

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface AccessRule {
  path: string;
  roles?: UserRole[];
  deniedTitle?: string;
  deniedMessage?: string;
}

export interface NavItemConfig extends AccessRule {
  name: string;
  href: string;
  icon: IconComponent;
  badge?: string;
  children?: NavItemConfig[];
}

export const ADMIN_ROLES = [UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN];
export const MANAGER_PLUS_ROLES = [UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER];
export const CORE_ROLES = [UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE];
export const PAYROLL_ROLES = [UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.PAYROLL_PARTNER];
// Company-wide records are maintained by HR. Managers retain access only to personal/team workflows.
export const DOCUMENT_LIBRARY_ROLES = ADMIN_ROLES;

const normalizeRole = (role?: UserRole | string | null): string => String(role || '').toLowerCase();

export const roleMatches = (role: UserRole | string | undefined | null, allowedRole: UserRole): boolean =>
  normalizeRole(role) === normalizeRole(allowedRole);

export const canAccessRoles = (
  userRole: UserRole | string | undefined | null,
  allowedRoles?: UserRole[]
): boolean => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.some((role) => roleMatches(userRole, role));
};

export const routeAccessRules: AccessRule[] = [
  { path: '/dashboard', roles: CORE_ROLES },
  { path: '/onboarding-wizard', roles: ADMIN_ROLES },
  { path: '/employees', roles: ADMIN_ROLES },
  { path: '/employees/:id', roles: ADMIN_ROLES },
  { path: '/departments', roles: ADMIN_ROLES },
  { path: '/designations', roles: ADMIN_ROLES },
  { path: '/attendance', roles: CORE_ROLES },
  { path: '/leave', roles: CORE_ROLES },
  { path: '/performance', roles: ADMIN_ROLES },
  { path: '/performance/:reviewId', roles: ADMIN_ROLES },
  { path: '/onboarding', roles: ADMIN_ROLES },
  { path: '/onboarding-dashboard', roles: ADMIN_ROLES },
  { path: '/onboarding/candidate/:candidateId', roles: ADMIN_ROLES },
  { path: '/probation', roles: ADMIN_ROLES },
  { path: '/probation/case/:probationId', roles: ADMIN_ROLES },
  { path: '/exit', roles: ADMIN_ROLES },
  { path: '/exit/:exitId', roles: ADMIN_ROLES },
  { path: '/calendar', roles: CORE_ROLES },
  { path: '/hr-connect', roles: CORE_ROLES },
  { path: '/chat/:conversationId', roles: CORE_ROLES },
  { path: '/ticket/:ticketId', roles: CORE_ROLES },
  { path: '/groups', roles: CORE_ROLES },
  { path: '/reports', roles: ADMIN_ROLES },
  // Preserve the legacy master-data URL while keeping the current Settings > Masters experience.
  { path: '/master-data', roles: ADMIN_ROLES },
  { path: '/documents', roles: DOCUMENT_LIBRARY_ROLES },
  { path: '/my-hr-documents', roles: CORE_ROLES },
  { path: '/org-chart', roles: CORE_ROLES },
  { path: '/payroll-operations', roles: PAYROLL_ROLES },
  {
    path: '/settings',
    roles: ADMIN_ROLES,
    deniedTitle: 'Settings are available to HR administrators',
    deniedMessage:
      'Organization, billing, user management, and policy settings require HR administrator access. Your personal HR actions remain available from the main workspace modules.',
  },
  { path: '/edit-profile', roles: CORE_ROLES },
  { path: '/transfer', roles: ADMIN_ROLES },
  { path: '/promote', roles: ADMIN_ROLES },
  { path: '/compensation', roles: ADMIN_ROLES },
  { path: '/performance-review', roles: ADMIN_ROLES },
  { path: '/employee-attendance', roles: CORE_ROLES },
];

export const navigationItems: NavItemConfig[] = [
  { name: 'Dashboard', href: '/dashboard', path: '/dashboard', icon: HomeIcon, roles: CORE_ROLES },
  {
    name: 'Employee Register',
    href: '/employees',
    path: '/employees',
    icon: UsersIcon,
    roles: ADMIN_ROLES,
  },
  {
    name: 'Document Library',
    href: '/documents',
    path: '/documents',
    icon: DocumentDuplicateIcon,
    roles: DOCUMENT_LIBRARY_ROLES,
  },
  {
    name: 'Employee Lifecycle',
    href: '/onboarding',
    path: '/onboarding',
    icon: ClipboardDocumentCheckIcon,
    roles: ADMIN_ROLES,
    children: [
      {
        name: 'Onboarding',
        href: '/onboarding',
        path: '/onboarding',
        icon: UserPlusIcon,
        roles: ADMIN_ROLES,
      },
      {
        name: 'Probation',
        href: '/probation',
        path: '/probation',
        icon: ClipboardDocumentCheckIcon,
        roles: ADMIN_ROLES,
      },
      {
        name: 'Performance',
        href: '/performance',
        path: '/performance',
        icon: ChartBarIcon,
        roles: ADMIN_ROLES,
      },
      {
        name: 'Moves/Promotions',
        href: '/promote',
        path: '/promote',
        icon: BriefcaseIcon,
        roles: ADMIN_ROLES,
      },
      {
        name: 'Exit',
        href: '/exit',
        path: '/exit',
        icon: ArrowRightStartOnRectangleIcon,
        roles: ADMIN_ROLES,
      },
    ],
  },
  { name: 'Attendance', href: '/attendance', path: '/attendance', icon: CalendarIcon, roles: CORE_ROLES },
  { name: 'Leave', href: '/leave', path: '/leave', icon: ClipboardDocumentCheckIcon, roles: CORE_ROLES },
  { name: 'HR Connect', href: '/hr-connect', path: '/hr-connect', icon: ChatBubbleLeftRightIcon },
  { name: 'Calendar', href: '/calendar', path: '/calendar', icon: CalendarDaysIcon },
  {
    name: 'HR Analytics',
    href: '/reports',
    path: '/reports',
    icon: DocumentTextIcon,
    roles: ADMIN_ROLES,
  },
  {
    name: 'Payroll Operations',
    href: '/payroll-operations',
    path: '/payroll-operations',
    icon: BanknotesIcon,
    roles: PAYROLL_ROLES,
  },
  {
    name: 'Settings',
    href: '/settings',
    path: '/settings',
    icon: Cog6ToothIcon,
    roles: ADMIN_ROLES,
  },
];

export const filterNavItemsForRole = (
  items: NavItemConfig[],
  userRole: UserRole | string | undefined | null
): NavItemConfig[] =>
  (normalizeRole(userRole) === 'payroll_partner'
    ? items.filter((item) => item.path === '/payroll-operations')
    : items)
    .filter((item) => canAccessRoles(userRole, item.roles))
    .map((item) => ({
      ...item,
      children: item.children ? filterNavItemsForRole(item.children, userRole) : undefined,
    }));
