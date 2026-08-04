import {
  BuildingOffice2Icon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export interface PlatformPillar {
  id: string;
  title: string;
  description: string;
  detail: string;
  heroImage: string;
  screenshot: string;
  icon: typeof BuildingOffice2Icon;
  proofPoints: string[];
  implementationSteps: string[];
}

export const platformPillars: PlatformPillar[] = [
  {
    id: 'implementation-ready',
    title: 'Implementation ready',
    description:
      'Masters, role access, reporting lines, approval flows, templates, and employee import are part of the product story.',
    detail:
      'Aura treats implementation as a first-class HR workflow. The product is meant to help an HR owner move from a fresh tenant to a company-specific operating workspace with clean masters, clear roles, reporting relationships, approval rules, and employee data migration.',
    heroImage: '/images/Module-Headers/organization-header.jpg',
    screenshot: '/images/Product-Screenshots/latest/document-library.png',
    icon: BuildingOffice2Icon,
    proofPoints: [
      'Company setup and role configuration are visible to HR owners.',
      'Masters and reporting relationships support downstream workflows.',
      'Pilot imports can start clean without dragging in old test data.',
    ],
    implementationSteps: [
      'Create the tenant and HR owner workspace.',
      'Load departments, designations, roles, and reporting structure.',
      'Validate approval paths before employees begin using the platform.',
      'Use document templates and demo mode to train the implementation team.',
    ],
  },
  {
    id: 'human-hr-journeys',
    title: 'Human HR journeys',
    description:
      'Every process is shaped around the employee, manager, HR manager, and leadership view instead of a generic admin grid.',
    detail:
      'The product is designed around the way HR actually happens: employees request, managers approve, HR resolves exceptions, and leadership reviews outcomes. Each role gets the interface and decisions relevant to that role.',
    heroImage: '/images/Hero-Images/aura-people-team-v2.jpg',
    screenshot: '/images/Product-Screenshots/latest/employee-register.png',
    icon: UserGroupIcon,
    proofPoints: [
      'Employee self-service stays focused and uncluttered.',
      'Managers get team actions and approvals instead of global HR noise.',
      'HR managers retain the ability to intervene, correct, and report.',
    ],
    implementationSteps: [
      'Define personas and permissions.',
      'Validate dashboards for owner, HR, manager, and employee roles.',
      'Connect each workflow to the correct approval owner.',
      'Train teams through demo journeys before live use.',
    ],
  },
  {
    id: 'workflow-depth',
    title: 'Workflow depth',
    description:
      'Attendance, leave, onboarding, probation, performance, documents, HR Connect, and exit are connected to real approvals.',
    detail:
      'Aura is not just a set of forms. Core HR processes behave like workflows with status, ownership, approval context, document support, and timeline-led review points.',
    heroImage: '/images/Module-Headers/performance-header.jpg',
    screenshot: '/images/Product-Screenshots/latest/performance.png',
    icon: ClipboardDocumentCheckIcon,
    proofPoints: [
      'Attendance and leave support approvals and HR intervention.',
      'Performance, probation, and exit are structured as accountable cases.',
      'Documents and HR Connect support communication around lifecycle events.',
    ],
    implementationSteps: [
      'Configure approval owners and HR exception handling.',
      'Run pilot workflows across employee, manager, and HR roles.',
      'Validate status transitions, reports, and document generation.',
      'Use timeline-style views to make process context easy to understand.',
    ],
  },
  {
    id: 'decision-visibility',
    title: 'Decision visibility',
    description:
      'Reports, dashboards, demo data, and visual QA evidence help leadership trust the system before full rollout.',
    detail:
      'Leadership needs confidence before rollout. Aura supports this through role-based dashboards, reports, analytics views, demo data, and visual QA evidence that explains not only what exists, but how it behaves under real HR scenarios.',
    heroImage: '/images/Module-Headers/dashboard-header.jpg',
    screenshot: '/images/Product-Screenshots/latest/dashboard.png',
    icon: ChartBarIcon,
    proofPoints: [
      'Dashboards summarize the operating state of HR.',
      'Demo mode shows good sample data without affecting real records.',
      'Visual testing evidence supports investor and customer demos.',
    ],
    implementationSteps: [
      'Review role dashboards for each persona.',
      'Use reports to inspect attendance, leave, lifecycle, and document activity.',
      'Run demo journeys for leadership and HR training.',
      'Use production smoke and visual QA checks before major rollout events.',
    ],
  },
];

export const getPlatformPillarById = (id: string): PlatformPillar | undefined =>
  platformPillars.find((pillar) => pillar.id === id);
