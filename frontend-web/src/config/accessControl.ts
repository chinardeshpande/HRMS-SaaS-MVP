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
  BuildingOfficeIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon,
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
  { path: '/dashboard' },
  { path: '/onboarding-wizard', roles: ADMIN_ROLES },
  { path: '/employees', roles: MANAGER_PLUS_ROLES },
  { path: '/employees/:id', roles: MANAGER_PLUS_ROLES },
  { path: '/master-data', roles: ADMIN_ROLES },
  { path: '/departments', roles: ADMIN_ROLES },
  { path: '/designations', roles: ADMIN_ROLES },
  { path: '/attendance' },
  { path: '/leave' },
  { path: '/performance', roles: MANAGER_PLUS_ROLES },
  { path: '/performance/:reviewId', roles: MANAGER_PLUS_ROLES },
  { path: '/onboarding', roles: ADMIN_ROLES },
  { path: '/onboarding-dashboard', roles: ADMIN_ROLES },
  { path: '/onboarding/candidate/:candidateId', roles: ADMIN_ROLES },
  { path: '/probation', roles: MANAGER_PLUS_ROLES },
  { path: '/probation/case/:probationId', roles: MANAGER_PLUS_ROLES },
  { path: '/exit', roles: MANAGER_PLUS_ROLES },
  { path: '/exit/:exitId', roles: MANAGER_PLUS_ROLES },
  { path: '/calendar' },
  { path: '/hr-connect' },
  { path: '/chat/:conversationId' },
  { path: '/ticket/:ticketId' },
  { path: '/groups' },
  { path: '/reports', roles: ADMIN_ROLES },
  { path: '/documents', roles: MANAGER_PLUS_ROLES },
  { path: '/my-hr-documents' },
  { path: '/org-chart' },
  {
    path: '/settings',
    roles: ADMIN_ROLES,
    deniedTitle: 'Settings are available to HR administrators',
    deniedMessage:
      'Organization, billing, user management, and policy settings require HR administrator access. Your personal HR actions remain available from the main workspace modules.',
  },
  { path: '/edit-profile' },
  { path: '/transfer', roles: ADMIN_ROLES },
  { path: '/promote', roles: ADMIN_ROLES },
  { path: '/compensation', roles: ADMIN_ROLES },
  { path: '/performance-review', roles: MANAGER_PLUS_ROLES },
  { path: '/employee-attendance' },
];

export const navigationItems: NavItemConfig[] = [
  { name: 'Dashboard', href: '/dashboard', path: '/dashboard', icon: HomeIcon },
  {
    name: 'Employee Register',
    href: '/employees',
    path: '/employees',
    icon: UsersIcon,
    roles: MANAGER_PLUS_ROLES,
  },
  {
    name: 'Document Library',
    href: '/documents',
    path: '/documents',
    icon: DocumentDuplicateIcon,
    roles: MANAGER_PLUS_ROLES,
  },
  {
    name: 'Employee Lifecycle',
    href: '/onboarding',
    path: '/onboarding',
    icon: ClipboardDocumentCheckIcon,
    roles: MANAGER_PLUS_ROLES,
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
        roles: MANAGER_PLUS_ROLES,
      },
      { name: 'Attendance', href: '/attendance', path: '/attendance', icon: CalendarIcon },
      { name: 'Leave', href: '/leave', path: '/leave', icon: ClipboardDocumentCheckIcon },
      {
        name: 'Performance',
        href: '/performance',
        path: '/performance',
        icon: ChartBarIcon,
        roles: MANAGER_PLUS_ROLES,
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
        roles: MANAGER_PLUS_ROLES,
      },
    ],
  },
  { name: 'HR Connect', href: '/hr-connect', path: '/hr-connect', icon: ChatBubbleLeftRightIcon },
  { name: 'Calendar', href: '/calendar', path: '/calendar', icon: CalendarDaysIcon },
  {
    name: 'Masters',
    href: '/master-data',
    path: '/master-data',
    icon: BuildingOfficeIcon,
    roles: ADMIN_ROLES,
    children: [
      {
        name: 'Departments',
        href: '/departments',
        path: '/departments',
        icon: BuildingOfficeIcon,
        roles: ADMIN_ROLES,
      },
      {
        name: 'Designations',
        href: '/designations',
        path: '/designations',
        icon: BriefcaseIcon,
        roles: ADMIN_ROLES,
      },
    ],
  },
  {
    name: 'HR Analytics',
    href: '/reports',
    path: '/reports',
    icon: DocumentTextIcon,
    roles: ADMIN_ROLES,
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
  items
    .filter((item) => canAccessRoles(userRole, item.roles))
    .map((item) => ({
      ...item,
      children: item.children ? filterNavItemsForRole(item.children, userRole) : undefined,
    }));
