import {
  BuildingOffice2Icon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  PresentationChartLineIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

export interface AdoptionJourney {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  detail: string;
  image: string;
  screenshot: string;
  icon: typeof BuildingOffice2Icon;
  steps: string[];
  outcomes: string[];
}

export const adoptionJourneys: AdoptionJourney[] = [
  {
    id: 'company-registration',
    title: 'Company registration and owner setup',
    shortTitle: 'Register',
    description: 'Create the tenant, verify the owner account, and establish the first HR admin workspace.',
    detail:
      'Aura starts with a clean company registration flow. The first HR owner creates the organization, verifies identity, and enters a guided workspace that is ready for onboarding, configuration, and controlled user creation.',
    image: '/images/Hero-Images/hero-leadership.jpg',
    screenshot: '/images/Product-Screenshots/latest/dashboard.png',
    icon: BuildingOffice2Icon,
    steps: [
      'Register the company and primary HR owner.',
      'Verify email and create a secure password.',
      'Open the owner implementation workspace.',
      'Review the guided setup checklist before adding employee data.',
    ],
    outcomes: [
      'A tenant-safe company workspace is created.',
      'The owner has the right dashboard and permissions.',
      'The organization is ready for masters and employee import.',
    ],
  },
  {
    id: 'operating-model',
    title: 'Operating model and HR masters',
    shortTitle: 'Configure',
    description: 'Set departments, designations, roles, reporting lines, approval rules, and document templates.',
    detail:
      'The implementation layer converts HR policy into usable product structure: departments, designations, org relationships, approval paths, and document templates. This is where Aura becomes specific to the company instead of remaining generic software.',
    image: '/images/Module-Headers/organization-header.jpg',
    screenshot: '/images/Product-Screenshots/latest/document-library.png',
    icon: Cog6ToothIcon,
    steps: [
      'Create or import departments, designations, and locations.',
      'Define HR admin, HR manager, manager, and employee roles.',
      'Map reporting relationships and approval workflows.',
      'Prepare documents and policy masters before rollout.',
    ],
    outcomes: [
      'Clean master data supports every HR module.',
      'Approvals follow the organization structure.',
      'HR can onboard employees without manual improvisation.',
    ],
  },
  {
    id: 'employee-migration',
    title: 'Employee data migration and invites',
    shortTitle: 'Migrate',
    description: 'Import employee records, attach reporting context, and invite people into role-specific workspaces.',
    detail:
      'Aura supports serious pilot adoption by treating employee import as implementation work, not a one-off spreadsheet upload. Employee records, managers, roles, and access are brought together so the team can begin using the platform with confidence.',
    image: '/images/Hero-Images/hero-team-collaboration.jpg',
    screenshot: '/images/Product-Screenshots/latest/employee-register.png',
    icon: UserPlusIcon,
    steps: [
      'Prepare the employee master file.',
      'Import employee records into the tenant.',
      'Assign roles, managers, departments, and designations.',
      'Invite users and validate each persona dashboard.',
    ],
    outcomes: [
      'Employee data becomes a usable system of record.',
      'Managers see team workflows and approvals.',
      'Employees get a clean self-service workspace.',
    ],
  },
  {
    id: 'daily-operations',
    title: 'Daily HR operations and approvals',
    shortTitle: 'Operate',
    description: 'Run attendance, leave, onboarding, probation, performance, documents, communication, and exit workflows.',
    detail:
      'Once setup is complete, the platform moves into daily HR operations. Employees perform self-service actions, managers approve team requests, HR handles exceptions and bulk updates, and leadership sees operational health through dashboards and reports.',
    image: '/images/Module-Headers/attendance-header.jpg',
    screenshot: '/images/Product-Screenshots/latest/attendance.png',
    icon: ClipboardDocumentCheckIcon,
    steps: [
      'Employees submit attendance, leave, document, and lifecycle requests.',
      'Managers approve subordinate actions from their work queue.',
      'HR managers intervene, override, and manage global workflows.',
      'Leadership reviews reports, trends, and exceptions.',
    ],
    outcomes: [
      'Operational HR becomes visible and auditable.',
      'Approvals are role-based and traceable.',
      'Daily work no longer depends on scattered messages and sheets.',
    ],
  },
  {
    id: 'demo-and-training',
    title: 'Demo mode, training, and adoption confidence',
    shortTitle: 'Adopt',
    description: 'Use curated sample data to train buyers, leaders, HR teams, managers, and employees.',
    detail:
      'Aura can show a complete good-data workspace without polluting the customer tenant. Demo mode supports investor walkthroughs, customer demos, HR team training, and user confidence before real company data is fully adopted.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.07.42-AM.png',
    screenshot: '/images/Product-Screenshots/latest/dashboard.png',
    icon: PresentationChartLineIcon,
    steps: [
      'Switch into demo mode from the workspace.',
      'Walk through realistic HR records and journeys.',
      'Train role-based users without touching real data.',
      'Return to the clean company workspace after the session.',
    ],
    outcomes: [
      'Stakeholders can see the full product story quickly.',
      'Training does not damage real records.',
      'Sales, implementation, and adoption use the same product language.',
    ],
  },
  {
    id: 'continuous-scale',
    title: 'Continuous scale and lifecycle maturity',
    shortTitle: 'Scale',
    description: 'Use reports, lifecycle history, documents, HR Connect, and analytics to mature operations over time.',
    detail:
      'The platform is meant to grow with the organization. As the company adds people and processes, Aura keeps lifecycle history, documents, role-based views, reports, and HR communication connected to the same employee record.',
    image: '/images/Hero-Images/hero-happy-employees.jpg',
    screenshot: '/images/Product-Screenshots/latest/analytics.png',
    icon: UserGroupIcon,
    steps: [
      'Review monthly HR reports and operational exceptions.',
      'Tighten workflow rules as the organization matures.',
      'Use HR Connect and documents to improve employee experience.',
      'Keep lifecycle history attached to each employee record.',
    ],
    outcomes: [
      'HR matures without replacing the platform.',
      'Leadership sees trends, risks, and operational readiness.',
      'The system co-exists with payroll, recruitment, and finance tools.',
    ],
  },
];

export const getAdoptionJourneyById = (id: string): AdoptionJourney | undefined =>
  adoptionJourneys.find((journey) => journey.id === id);
