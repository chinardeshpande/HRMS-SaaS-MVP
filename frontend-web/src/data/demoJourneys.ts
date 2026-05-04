export interface DemoJourneyStep {
  id: string;
  title: string;
  route: string;
  stage: string;
  proofPoints: string[];
}

export const demoJourneySteps: DemoJourneyStep[] = [
  {
    id: 'onboarding',
    title: 'New Employee Onboarding',
    route: '/onboarding',
    stage: 'Candidate pipeline to day-one readiness',
    proofPoints: ['Candidate verification', 'Joining tasks', 'Probation handoff'],
  },
  {
    id: 'attendance',
    title: 'Attendance Control',
    route: '/attendance',
    stage: 'Daily presence, exceptions, and team visibility',
    proofPoints: ['Clock records', 'Department summary', 'Regularization trail'],
  },
  {
    id: 'leave',
    title: 'Leave Management',
    route: '/leave',
    stage: 'Balances, requests, approvals, and policy fit',
    proofPoints: ['Leave balances', 'Pending approvals', 'Policy-linked history'],
  },
  {
    id: 'probation',
    title: 'Probation Management',
    route: '/probation',
    stage: 'Structured reviews before confirmation',
    proofPoints: ['Review milestones', 'Manager feedback', 'Decision status'],
  },
  {
    id: 'performance',
    title: 'Performance Cycle',
    route: '/performance',
    stage: 'Goals, KPIs, reviews, and development actions',
    proofPoints: ['Goal progress', 'Review workflow', '360 feedback'],
  },
  {
    id: 'exit',
    title: 'Exit Management',
    route: '/exit',
    stage: 'Resignation through clearance and settlement',
    proofPoints: ['Clearance checklist', 'Asset return', 'Final settlement'],
  },
];
