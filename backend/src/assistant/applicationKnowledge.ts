export interface ApplicationKnowledgeEntry {
  id: string;
  title: string;
  section: string;
  route?: string;
  roles: string[];
  keywords: string[];
  content: string;
}

export const AURORA_APPLICATION_KNOWLEDGE: ApplicationKnowledgeEntry[] = [
  {
    id: 'employee-register',
    title: 'Employee Register',
    section: 'Employee master and lifecycle',
    route: '/employees',
    roles: ['system_admin', 'hr_admin', 'manager'],
    keywords: ['employee', 'profile', 'manager', 'department', 'designation', 'joining', 'location'],
    content:
      'The Employee Register is the operational source for employee identity, reporting manager, department, designation, work location, joining date, status, and lifecycle navigation. HR should validate source evidence before changing master data.',
  },
  {
    id: 'employee-self-service',
    title: 'Employee Self-Service',
    section: 'Identity requirement',
    route: '/dashboard',
    roles: ['employee', 'manager'],
    keywords: ['self service', 'my data', 'identity', 'employee link', 'login'],
    content:
      'Employee and manager self-service depends on a valid user-to-employee identity link inside the same tenant. AuroraHR may auto-link only a unique exact normalized email match; ambiguous or missing matches require an administrator decision.',
  },
  {
    id: 'document-library',
    title: 'Document Library',
    section: 'Employee documents and company vault',
    route: '/documents',
    roles: ['system_admin', 'hr_admin', 'manager', 'employee'],
    keywords: ['document', 'vault', 'verification', 'preview', 'download', 'letter', 'evidence'],
    content:
      'The Document Library separates employee documents from tenant-level company vault records. A useful document record needs correct ownership, category, verification state, dates, and a reachable stored file for preview or download.',
  },
  {
    id: 'compensation-memory',
    title: 'Compensation',
    section: 'Salary memory boundary',
    route: '/compensation',
    roles: ['system_admin', 'hr_admin'],
    keywords: ['salary', 'compensation', 'payslip', 'ctc', 'payroll'],
    content:
      'AuroraHR stores salary structures, revision history, payslip records, attachments, and audit evidence. The current MVP is compensation memory, not a statutory payroll engine and does not calculate tax, PF, ESI, TDS, or filings.',
  },
  {
    id: 'attendance',
    title: 'Attendance',
    section: 'Daily status and regularisation',
    route: '/attendance',
    roles: ['system_admin', 'hr_admin', 'manager', 'employee'],
    keywords: ['attendance', 'present', 'absent', 'punch', 'clock', 'regularisation', 'wfh'],
    content:
      'Attendance provides self, team, and company views according to role. Corrections belong in a traceable regularisation workflow and must not silently overwrite biometric or imported source records.',
  },
  {
    id: 'leave',
    title: 'Leave Management',
    section: 'Policy, balance, and approval',
    route: '/leave',
    roles: ['system_admin', 'hr_admin', 'manager', 'employee'],
    keywords: ['leave', 'balance', 'policy', 'approval', 'maternity', 'paternity'],
    content:
      'Leave Management combines active policies, annual balances, requests, and manager approvals. Eligibility and balance checks must precede decisions, and gender-specific policies must be applied only to eligible employees.',
  },
  {
    id: 'analytics',
    title: 'HR Analytics',
    section: 'Reports and evidence',
    route: '/reports',
    roles: ['system_admin', 'hr_admin', 'manager'],
    keywords: ['analytics', 'report', 'headcount', 'attrition', 'chart', 'trend'],
    content:
      'HR Analytics aggregates tenant-scoped employee and operational data. Results should be treated as management evidence only after source completeness, selected scope, grouping, and date range are understood.',
  },
  {
    id: 'settings',
    title: 'Settings',
    section: 'Tenant configuration and access',
    route: '/settings',
    roles: ['system_admin', 'hr_admin'],
    keywords: ['settings', 'roles', 'permission', 'policy', 'masters', 'tenant', 'configuration'],
    content:
      'Settings governs tenant configuration, organization details, masters, leave and attendance policy, users, roles, and permissions. High-impact access and policy changes require the appropriate role and an auditable workflow.',
  },
  {
    id: 'manu-safety',
    title: 'Manu',
    section: 'Conversational operating model',
    roles: ['system_admin', 'hr_admin', 'manager', 'employee'],
    keywords: ['manu', 'assistant', 'ai', 'conversation', 'draft', 'action'],
    content:
      'Manu is a permission-safe conversational layer. It combines current-screen context, role-scoped tenant data, AuroraHR application knowledge, and cited tenant knowledge. It may answer, explain, retrieve, and draft; record-changing actions remain behind module permissions, evidence, confirmation, and audit controls.',
  },
];
