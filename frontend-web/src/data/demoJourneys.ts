export interface DemoJourneyStep {
  id: string;
  title: string;
  route: string;
  stage: string;
  storyline: string;
  presenterPrompt: string;
  proofPoints: string[];
  fallbackRecordLabel: string;
}

export const demoJourneySteps: DemoJourneyStep[] = [
  {
    id: 'onboarding',
    title: 'New Employee Onboarding',
    route: '/onboarding',
    stage: 'Candidate pipeline to day-one readiness',
    storyline: 'Show how HR moves a selected hire from offer acceptance through documents, BGV, task ownership, and joining readiness.',
    presenterPrompt: 'Open the highlighted candidate, review the current state, then show tasks and document controls.',
    proofPoints: ['Candidate verification', 'Joining tasks', 'Probation handoff'],
    fallbackRecordLabel: 'Open candidate pipeline',
  },
  {
    id: 'attendance',
    title: 'Attendance Control',
    route: '/attendance',
    stage: 'Daily presence, exceptions, and team visibility',
    storyline: 'Show how HR monitors presence, late arrivals, half-days, and team-level attendance exceptions.',
    presenterPrompt: 'Start with company statistics, then filter into exception-heavy records.',
    proofPoints: ['Clock records', 'Department summary', 'Regularization trail'],
    fallbackRecordLabel: 'Open attendance dashboard',
  },
  {
    id: 'leave',
    title: 'Leave Management',
    route: '/leave',
    stage: 'Balances, requests, approvals, and policy fit',
    storyline: 'Show the relationship between balances, pending approvals, policies, and employee self-service.',
    presenterPrompt: 'Use pending or approved requests to explain the approval trail and balance impact.',
    proofPoints: ['Leave balances', 'Pending approvals', 'Policy-linked history'],
    fallbackRecordLabel: 'Open leave dashboard',
  },
  {
    id: 'probation',
    title: 'Probation Management',
    route: '/probation',
    stage: 'Structured reviews before confirmation',
    storyline: 'Show how new employees are tracked through 30/60/final review checkpoints before confirmation.',
    presenterPrompt: 'Open the highlighted probation case and walk through due reviews, risk status, and decision readiness.',
    proofPoints: ['Review milestones', 'Manager feedback', 'Decision status'],
    fallbackRecordLabel: 'Open probation tracker',
  },
  {
    id: 'performance',
    title: 'Performance Cycle',
    route: '/performance',
    stage: 'Goals, KPIs, reviews, and development actions',
    storyline: 'Show how goals, KPIs, mid-year review, 360 feedback, and development plans come together.',
    presenterPrompt: 'Open the highlighted review and use it to tell the goals-to-rating story.',
    proofPoints: ['Goal progress', 'Review workflow', '360 feedback'],
    fallbackRecordLabel: 'Open performance dashboard',
  },
  {
    id: 'exit',
    title: 'Exit Management',
    route: '/exit',
    stage: 'Resignation through clearance and settlement',
    storyline: 'Show a controlled employee exit from resignation approval through clearance, asset return, interview, and settlement.',
    presenterPrompt: 'Open the highlighted exit case and use the progress tracker as the anchor.',
    proofPoints: ['Clearance checklist', 'Asset return', 'Final settlement'],
    fallbackRecordLabel: 'Open exit dashboard',
  },
];
