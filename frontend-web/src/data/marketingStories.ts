export interface MarketingStory {
  id: string;
  category: string;
  title: string;
  lead: string;
  description: string;
  image: string;
  highlights: string[];
  journey: string[];
}

export const marketingStories: MarketingStory[] = [
  {
    id: 'employees', category: 'For every role', title: 'A clear, dependable workspace for every employee',
    lead: 'Self-service should feel simple without becoming disconnected from HR.',
    description: 'AuraHR gives employees one place for attendance, leave, documents, goals, conversations, and lifecycle milestones. Every action stays connected to the employee record and the people responsible for the next step.',
    image: '/images/Product-Screenshots/latest/employee-register.png',
    highlights: ['Personal records and documents in one place', 'Clear leave, attendance, and request status', 'Visible goals, milestones, and HR conversations'],
    journey: ['Open a role-focused home view', 'Complete or request the next action', 'Follow progress without chasing HR', 'Keep the outcome in the employee timeline'],
  },
  {
    id: 'managers', category: 'For every role', title: 'Team context before every people decision',
    lead: 'Managers see decisions, owners, history, and next actions—not global HR noise.',
    description: 'AuraHR brings approvals, probation, performance, attendance exceptions, and team conversations into a focused manager experience. The context behind a decision remains visible and accountable.',
    image: '/images/Product-Screenshots/latest/performance.png',
    highlights: ['Team approvals with supporting context', 'Structured feedback and performance moments', 'Clear ownership for probation and lifecycle actions'],
    journey: ['Review the team signal', 'Open the employee context', 'Record a considered decision', 'Hand the next step to the right owner'],
  },
  {
    id: 'hr-teams', category: 'For every role', title: 'Operational control without losing the human thread',
    lead: 'HR can govern records, workflows, exceptions, and communication from one operating layer.',
    description: 'AuraHR helps HR teams run daily work, resolve exceptions, maintain evidence, prepare documents, and support employees while preserving role boundaries and audit context.',
    image: '/images/Product-Screenshots/latest/dashboard.png',
    highlights: ['Company-wide operational visibility', 'Exception handling with ownership and evidence', 'Templates, documents, and communication in context'],
    journey: ['See what needs attention', 'Resolve the exception with evidence', 'Communicate the outcome', 'Retain an audit-ready history'],
  },
  {
    id: 'leadership', category: 'For every role', title: 'Workforce clarity leaders can trust',
    lead: 'Reliable signals replace spreadsheet archaeology and fragmented status updates.',
    description: 'AuraHR gives leadership a coherent view of workforce health, operating readiness, trends, and important people moments while respecting tenant and role boundaries.',
    image: '/images/Product-Screenshots/latest/analytics.png',
    highlights: ['Role-aware workforce signals', 'Operational and lifecycle trends', 'Connected organizational memory'],
    journey: ['Review the workforce overview', 'Investigate the signal', 'Understand the operating context', 'Align the people decision with accountable action'],
  },
  {
    id: 'india-gccs', category: 'Built for your next chapter', title: 'A strong people-operations foundation for India GCCs',
    lead: 'Stand up local HR operations with global confidence and less enterprise-suite complexity.',
    description: 'AuraHR helps a new or growing India capability centre establish masters, reporting lines, employee records, approvals, documents, and leadership visibility while keeping the experience approachable for local teams.',
    image: '/images/Hero-Images/hero-leadership.jpg',
    highlights: ['Global governance with local operating clarity', 'Implementation-ready roles and reporting lines', 'A credible employee experience from day one'],
    journey: ['Define the operating model', 'Load clean employee and organization data', 'Pilot role-based workflows', 'Scale with visible controls and reporting'],
  },
  {
    id: 'indian-smes', category: 'Built for your next chapter', title: 'Move beyond spreadsheets without importing complexity',
    lead: 'Professionalize HR records and workflows while keeping adoption practical.',
    description: 'AuraHR gives Indian SMEs a connected system for employee records, documents, attendance, leave, approvals, performance, and communication—without requiring a large implementation team.',
    image: '/images/Hero-Images/hero-team-collaboration.jpg',
    highlights: ['Clean employee and organization records', 'Practical approvals and self-service', 'A gradual path from setup to mature operations'],
    journey: ['Start with the HR essentials', 'Replace the highest-friction spreadsheets', 'Train managers and employees', 'Add lifecycle depth as the company grows'],
  },
  {
    id: 'growing-teams', category: 'Built for your next chapter', title: 'Add structure early without losing warmth or speed',
    lead: 'Give a fast-growing team clear ownership, records, and journeys before ambiguity becomes expensive.',
    description: 'AuraHR supports growing companies with role clarity, employee history, lightweight governance, and connected HR service—so the operating model matures alongside the team.',
    image: '/images/Hero-Images/hero-happy-employees.jpg',
    highlights: ['Structure that grows with the team', 'Fast, familiar employee journeys', 'Leadership visibility without HR-suite clutter'],
    journey: ['Establish roles and ownership', 'Create the employee system of record', 'Introduce repeatable people journeys', 'Use signals and history to scale confidently'],
  },
  {
    id: 'authentic-multi-tenancy', category: 'What makes AuraHR different', title: 'Authentic multi-tenancy by design',
    lead: 'Company records, demo journeys, and operating contexts remain intentionally separated.',
    description: 'AuraHR treats tenant boundaries as part of the product experience. Identity, company context, role access, and demo data are designed to prevent accidental crossover and keep every workspace trustworthy.',
    image: '/images/Product-Screenshots/latest/dashboard.png',
    highlights: ['Tenant-scoped records and workflows', 'Separated demo and company contexts', 'Role-aware access inside each organization'],
    journey: ['Resolve the signed-in company context', 'Apply role permissions', 'Scope every workflow and record', 'Preserve accountable tenant history'],
  },
  {
    id: 'role-based-experience', category: 'What makes AuraHR different', title: 'A focused experience for every role',
    lead: 'Owners, HR, managers, and employees each see the work that belongs to them.',
    description: 'Instead of exposing one generic administration grid, AuraHR shapes dashboards, actions, approvals, and guidance around the responsibilities of each role.',
    image: '/images/Product-Screenshots/latest/dashboard.png',
    highlights: ['Focused home views', 'Role-owned actions and approvals', 'Shared records beneath distinct experiences'],
    journey: ['Understand the signed-in role', 'Surface relevant priorities', 'Guide the permitted action', 'Reconnect the outcome to the shared record'],
  },
  {
    id: 'trust-by-design', category: 'What makes AuraHR different', title: 'Trust is a product capability',
    lead: 'Evidence, ownership, confirmation, and audit context sit inside sensitive HR journeys.',
    description: 'AuraHR makes trust visible through clear status, accountable owners, document evidence, controlled access, and confirmation before consequential actions.',
    image: '/images/Product-Screenshots/latest/document-library.png',
    highlights: ['Evidence-backed lifecycle actions', 'Visible ownership and status', 'Confirmation and audit context'],
    journey: ['Identify the sensitive action', 'Show the supporting evidence', 'Confirm role and ownership', 'Record the outcome and history'],
  },
  {
    id: 'governed-documents', category: 'Connected capability', title: 'Keep workforce evidence organized and ready',
    lead: 'Policies and employee records stay governed, previewable, and connected to HR work.',
    description: 'AuraHR brings ownership, verification, expiry, preview, and download controls into a structured document library. Evidence remains available where lifecycle and employee decisions happen.',
    image: '/images/Product-Screenshots/latest/document-library.png',
    highlights: ['Company and employee document libraries', 'Verification and expiry visibility', 'Preview, download, and lifecycle context'],
    journey: ['Classify the document', 'Attach ownership and validity', 'Use it in the relevant HR journey', 'Retain accessible evidence'],
  },
  {
    id: 'lifecycle-workflows', category: 'Connected capability', title: 'Guide every new joiner from offer to impact',
    lead: 'Joining readiness, task ownership, documents, and day-one progress stay in one flow.',
    description: 'AuraHR connects candidate information, onboarding tasks, document readiness, probation milestones, and accountable handoffs so every new employee receives a consistent start.',
    image: '/images/Product-Screenshots/latest/onboarding.png',
    highlights: ['Candidate-to-employee continuity', 'Task and document ownership', 'Onboarding and probation milestones'],
    journey: ['Prepare the joining record', 'Coordinate tasks and evidence', 'Welcome the employee', 'Continue into probation and development'],
  },
  {
    id: 'people-intelligence', category: 'Connected capability', title: 'Turn HR activity into leadership clarity',
    lead: 'Workforce signals and operating priorities become understandable without manual consolidation.',
    description: 'AuraHR combines role-aware dashboards, analytics, reports, and connected employee history to help leaders understand what is happening and where attention is needed.',
    image: '/images/Product-Screenshots/latest/analytics.png',
    highlights: ['Role-aware dashboards and reports', 'Workforce and lifecycle trends', 'Operational priorities with context'],
    journey: ['Collect trustworthy HR activity', 'Summarize the right signals', 'Explore context and trends', 'Turn insight into accountable action'],
  },
];

export const getMarketingStoryById = (id: string) =>
  marketingStories.find((story) => story.id === id);
