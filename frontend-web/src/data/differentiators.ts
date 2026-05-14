import {
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export const differentiators = [
  {
    id: 'hr-connect',
    title: 'HR Connect is collaboration with HR context',
    shortTitle: 'HR Connect',
    description:
      'Not just chat. HR Connect brings wall feeds, conversations, groups, service requests, appointments, and communication guardrails into the same HR workspace where employee lifecycle context already exists.',
    capability:
      'HR Connect gives employees and HR teams a contextual collaboration layer for announcements, conversations, tickets, appointments, and guided support moments. It is designed to keep communication tied to HR operations instead of scattering employee issues across informal channels.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.21.10-AM.png',
    icon: ChatBubbleLeftRightIcon,
    proofPoints: ['Wall feeds and employee conversations', 'HR service requests and appointments', 'Guardrails around HR-sensitive collaboration'],
  },
  {
    id: 'document-library',
    title: 'Document Library supports lifecycle formalities',
    shortTitle: 'Document Library',
    description:
      'HR managers can generate standard documents, preserve lifecycle evidence, and share the right supporting material safely through the employee journey instead of chasing files across mail and drives.',
    capability:
      'The document layer supports formal HR moments across joining, employment changes, probation, performance, and exit. It helps HR teams generate, preserve, and share documents in a controlled way while keeping evidence attached to the employee lifecycle.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.08.18-AM.png',
    icon: DocumentTextIcon,
    proofPoints: ['Standard HR document generation', 'Lifecycle evidence and employee records', 'Safe sharing through HR context'],
  },
  {
    id: 'timeline-led-ux',
    title: 'Timeline-led process UX keeps HR intuitive',
    shortTitle: 'Timeline-led UX',
    description:
      'Sensitive processes like onboarding, probation, performance, and exit become easier to understand when users see status, ownership, history, and next action as an HR timeline.',
    capability:
      'Timeline-led process design makes complex HR work easier to follow. Employees, managers, and HR teams can understand what happened, what is pending, who owns the next step, and which evidence supports the decision.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.16.58-AM.png',
    icon: ClipboardDocumentCheckIcon,
    proofPoints: ['Visible status and ownership', 'History and evidence in one view', 'Clear next action for each role'],
  },
];

export function getDifferentiatorById(id: string) {
  return differentiators.find((item) => item.id === id) || null;
}
