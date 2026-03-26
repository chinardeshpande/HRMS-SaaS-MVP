import {
  UsersIcon,
  UserPlusIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  UserMinusIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export interface Module {
  id: string;
  name: string;
  title: string;
  description: string;
  longDescription: string;
  icon: any;
  gradient: string;
  color: string;
  screenshots: string[];
  keyFeatures: string[];
  benefits: string[];
}

export const modules: Module[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    title: 'Unified Dashboard',
    description: 'Get a comprehensive overview of your entire workforce with real-time insights and analytics.',
    longDescription: 'Our intelligent dashboard provides a centralized view of all HR metrics, employee statistics, and key performance indicators. Make data-driven decisions with customizable widgets, real-time updates, and actionable insights.',
    icon: ChartBarIcon,
    gradient: 'from-blue-500 to-indigo-600',
    color: 'blue',
    screenshots: [
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.07.33-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.07.42-AM.png',
    ],
    keyFeatures: [
      'Real-time workforce analytics',
      'Customizable widgets and KPIs',
      'Department-wise metrics',
      'Attendance and leave overview',
      'Performance trends visualization',
    ],
    benefits: [
      'Quick decision making with real-time data',
      'Identify trends and patterns instantly',
      'Monitor organizational health at a glance',
    ],
  },
  {
    id: 'employee-management',
    name: 'Employee Management',
    title: 'Complete Employee Lifecycle',
    description: 'Centralized employee database with comprehensive profiles, documents, and complete lifecycle tracking.',
    longDescription: 'Manage your entire employee lifecycle from hire to retire with our comprehensive employee management system. Store documents, track history, manage transfers, promotions, and maintain detailed employee records.',
    icon: UsersIcon,
    gradient: 'from-purple-500 to-pink-600',
    color: 'purple',
    screenshots: [
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.15.14-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.15.25-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.15.34-AM.png',
    ],
    keyFeatures: [
      'Comprehensive employee profiles',
      'Document management and storage',
      'Transfer and promotion tracking',
      'Compensation history',
      'Emergency contacts and beneficiaries',
    ],
    benefits: [
      'Single source of truth for employee data',
      'Reduce manual paperwork by 80%',
      'Ensure compliance with data management',
    ],
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    title: 'Seamless Onboarding Experience',
    description: 'Streamlined onboarding workflows with automated tasks, digital documents, and pre-boarding portals.',
    longDescription: 'Transform your new hire experience with automated onboarding workflows. From offer acceptance to first day and beyond, ensure every new employee has a smooth, engaging onboarding journey.',
    icon: UserPlusIcon,
    gradient: 'from-green-500 to-emerald-600',
    color: 'green',
    screenshots: [
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.18.08-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.18.14-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.18.19-AM.png',
    ],
    keyFeatures: [
      'Pre-boarding portal for new hires',
      'Automated task assignment and tracking',
      'Digital document collection',
      'Probation period management',
      'First-day experience optimization',
    ],
    benefits: [
      'Reduce onboarding time by 60%',
      'Improve new hire satisfaction',
      'Ensure consistency across all hires',
    ],
  },
  {
    id: 'attendance',
    name: 'Time & Attendance',
    title: 'Smart Time Tracking',
    description: 'Automated time tracking with biometric integration, geofencing, and real-time attendance monitoring.',
    longDescription: 'Track employee attendance with precision using our advanced time and attendance system. Support multiple tracking methods including biometric, GPS, and manual clock-in/out with real-time monitoring and automated calculations.',
    icon: ClockIcon,
    gradient: 'from-orange-500 to-red-600',
    color: 'orange',
    screenshots: [
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.16.04-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.16.14-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.16.18-AM.png',
    ],
    keyFeatures: [
      'Multiple clock-in methods (Biometric, GPS, Manual)',
      'Real-time attendance tracking',
      'Overtime calculation',
      'Shift management',
      'Late arrival and early departure alerts',
    ],
    benefits: [
      'Eliminate time theft and buddy punching',
      'Automate payroll calculations',
      'Real-time visibility into workforce',
    ],
  },
  {
    id: 'leave-management',
    name: 'Leave Management',
    title: 'Intelligent Leave System',
    description: 'Smart leave policies, automated approvals, balance tracking, and accrual calculations.',
    longDescription: 'Simplify leave management with our intelligent system that handles multiple leave types, automated approvals, balance calculations, and compliance tracking. Employees can request leave with a click while managers get complete visibility.',
    icon: CalendarIcon,
    gradient: 'from-cyan-500 to-blue-600',
    color: 'cyan',
    screenshots: [
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.19.47-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.20.02-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.20.18-AM.png',
    ],
    keyFeatures: [
      'Multiple leave types configuration',
      'Automated leave accrual',
      'Multi-level approval workflows',
      'Leave balance tracking',
      'Holiday calendar management',
    ],
    benefits: [
      'Reduce leave processing time by 90%',
      'Eliminate manual calculations',
      'Improve employee satisfaction',
    ],
  },
  {
    id: 'performance',
    name: 'Performance Management',
    title: 'Continuous Performance Improvement',
    description: 'Continuous feedback, goal tracking, 360-degree reviews, and development planning.',
    longDescription: 'Drive performance excellence with our comprehensive performance management system. Set goals, conduct reviews, gather 360-degree feedback, and create development plans to help your employees reach their full potential.',
    icon: ChartBarIcon,
    gradient: 'from-yellow-500 to-amber-600',
    color: 'yellow',
    screenshots: [
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.16.58-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.17.14-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.17.21-AM.png',
    ],
    keyFeatures: [
      'Goal setting and OKR tracking',
      '360-degree feedback system',
      'Continuous performance reviews',
      'KPI monitoring',
      'Development and action plans',
    ],
    benefits: [
      'Align employee goals with company objectives',
      'Foster continuous improvement culture',
      'Identify and develop top talent',
    ],
  },
  {
    id: 'probation',
    name: 'Probation Tracking',
    title: 'Probation Period Management',
    description: 'Track new hire probation periods with automated reviews, feedback collection, and confirmation workflows.',
    longDescription: 'Effectively manage probation periods with structured review processes, milestone tracking, and automated notifications. Ensure new hires receive proper guidance and evaluation during their critical first months.',
    icon: CalendarDaysIcon,
    gradient: 'from-indigo-500 to-purple-600',
    color: 'indigo',
    screenshots: [
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.18.26-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.18.44-AM.png',
    ],
    keyFeatures: [
      'Automated probation tracking',
      'Scheduled review reminders',
      'Milestone-based evaluations',
      'Confirmation workflow',
      'Extension and termination processes',
    ],
    benefits: [
      'Never miss probation end dates',
      'Structured evaluation process',
      'Reduce early turnover',
    ],
  },
  {
    id: 'exit-management',
    name: 'Exit Management',
    title: 'Professional Exit Process',
    description: 'Professional exit interviews, asset recovery, knowledge transfer, and compliance tracking.',
    longDescription: 'Manage employee exits professionally with structured workflows covering exit interviews, asset returns, clearances, final settlements, and knowledge transfer. Maintain good relationships even as employees leave.',
    icon: UserMinusIcon,
    gradient: 'from-red-500 to-rose-600',
    color: 'red',
    screenshots: [
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.19.21-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.19.34-AM.png',
    ],
    keyFeatures: [
      'Exit interview scheduling and tracking',
      'Asset return management',
      'Department clearance workflow',
      'Final settlement calculation',
      'Knowledge transfer documentation',
    ],
    benefits: [
      'Reduce legal and compliance risks',
      'Gather valuable exit insights',
      'Ensure smooth knowledge transfer',
    ],
  },
  {
    id: 'hr-connect',
    name: 'HR Connect',
    title: 'Employee Engagement Hub',
    description: 'Internal social network, announcements, employee directory, and helpdesk system in one platform.',
    longDescription: 'Foster employee engagement with our integrated communication platform. Share updates, create groups, submit tickets, and build a connected workplace culture.',
    icon: ChatBubbleLeftRightIcon,
    gradient: 'from-pink-500 to-rose-600',
    color: 'pink',
    screenshots: [
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.20.43-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.21.10-AM.png',
    ],
    keyFeatures: [
      'Social feed and announcements',
      'Group creation and management',
      'Employee directory',
      'Helpdesk and ticketing',
      'Real-time chat and messaging',
    ],
    benefits: [
      'Improve internal communication',
      'Build company culture',
      'Resolve employee queries faster',
    ],
  },
  {
    id: 'organization',
    name: 'Organization Setup',
    title: 'Organization Structure',
    description: 'Define departments, designations, reporting hierarchies, and organizational charts.',
    longDescription: 'Build and visualize your organizational structure with departments, designations, and reporting relationships. Create hierarchies that reflect your company structure.',
    icon: BuildingOfficeIcon,
    gradient: 'from-teal-500 to-green-600',
    color: 'teal',
    screenshots: [
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.15.53-AM.png',
    ],
    keyFeatures: [
      'Department hierarchy management',
      'Designation levels and roles',
      'Reporting structure definition',
      'Organization chart visualization',
      'Bulk import/export',
    ],
    benefits: [
      'Clear organizational visibility',
      'Streamline approval workflows',
      'Easy restructuring capabilities',
    ],
  },
  {
    id: 'calendar',
    name: 'Calendar & Events',
    title: 'Company Calendar',
    description: 'Manage company holidays, events, and important dates in a centralized calendar.',
    longDescription: 'Keep everyone informed with a centralized company calendar showing holidays, events, meetings, and important milestones. Sync with personal calendars and send automated reminders.',
    icon: CalendarDaysIcon,
    gradient: 'from-violet-500 to-purple-600',
    color: 'violet',
    screenshots: [
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.21.16-AM.png',
    ],
    keyFeatures: [
      'Company-wide calendar',
      'Holiday calendar management',
      'Event scheduling and invitations',
      'Calendar sync integration',
      'Automated reminders',
    ],
    benefits: [
      'Everyone stays on same page',
      'Reduce scheduling conflicts',
      'Plan leaves better',
    ],
  },
  {
    id: 'settings',
    name: 'Settings & Configuration',
    title: 'System Administration',
    description: 'Complete system configuration including subscriptions, payments, users, roles, and business rules.',
    longDescription: 'Comprehensive system administration with subscription management, payment methods, user roles & permissions, and configurable business rules tailored to your organization.',
    icon: Cog6ToothIcon,
    gradient: 'from-gray-500 to-slate-600',
    color: 'gray',
    screenshots: [
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.07.53-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.08.06-AM.png',
      '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.08.18-AM.png',
    ],
    keyFeatures: [
      'Subscription plan management',
      'Payment methods and billing',
      'User role management',
      'Permission configuration',
      'Business rules engine',
      'Organization settings',
    ],
    benefits: [
      'Full control over system',
      'Tailor to your needs',
      'Secure access management',
    ],
  },
];

export const getModuleById = (id: string): Module | undefined => {
  return modules.find((module) => module.id === id);
};

export const getModulesByCategory = () => {
  return {
    core: modules.filter((m) => ['dashboard', 'employee-management', 'organization'].includes(m.id)),
    lifecycle: modules.filter((m) => ['onboarding', 'probation', 'exit-management'].includes(m.id)),
    operations: modules.filter((m) => ['attendance', 'leave-management', 'calendar'].includes(m.id)),
    development: modules.filter((m) => ['performance'].includes(m.id)),
    engagement: modules.filter((m) => ['hr-connect'].includes(m.id)),
    admin: modules.filter((m) => ['settings'].includes(m.id)),
  };
};
