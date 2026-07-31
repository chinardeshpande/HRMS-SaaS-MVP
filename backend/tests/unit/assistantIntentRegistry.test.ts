import { resolveManuIntent, roleCanUseIntent } from '../../src/assistant/intentRegistry';
import { UserRole } from '../../../shared/types';

describe('Manu intent registry', () => {
  it.each([
    ['Draft an appointment letter for QA/ACV/0004', 'draft_appointment_letter', 'L2'],
    ['Approve all leave requests', 'bulk_approval_action', 'L4'],
    ['Delete QA/ACV/0004', 'unsafe_or_prohibited_action', 'L4'],
    ['Show headcount by department', 'analytics_insight', 'L0'],
    ['What documents are missing?', 'document_insight', 'L0'],
    ['How do I regularise attendance?', 'guided_process', 'L1'],
    ['What is the ACV readiness status?', 'acv_implementation_knowledge', 'L0'],
    ['Draft an email to her manager', 'draft_manager_email', 'L2'],
    ['Who does Surekha report to?', 'employee_insight', 'L0'],
    ['What is her designation?', 'employee_insight', 'L0'],
  ])('classifies "%s"', (prompt, expectedIntent, expectedLevel) => {
    const match = resolveManuIntent(prompt);
    expect(match.intent.id).toBe(expectedIntent);
    expect(match.intent.autonomyLevel).toBe(expectedLevel);
    expect(match.confidence).toBeGreaterThan(0.5);
  });

  it('uses screen affinity without letting screen context override a prompt', () => {
    const match = resolveManuIntent('What should I review first?', {
      pathname: '/attendance',
      pageTitle: 'Attendance',
    });
    expect(match.intent.id).toBe('general_hr_question');

    const attendance = resolveManuIntent('Show attendance gaps', {
      pathname: '/attendance',
      pageTitle: 'Attendance',
    });
    expect(attendance.intent.id).toBe('attendance_insight');
    expect(attendance.confidence).toBeGreaterThan(match.confidence);
  });

  it('enforces role restrictions declared by the intent', () => {
    const compensation = resolveManuIntent('Show salary for QA/ACV/0004').intent;
    expect(roleCanUseIntent(compensation, UserRole.HR_ADMIN)).toBe(true);
    expect(roleCanUseIntent(compensation, UserRole.EMPLOYEE)).toBe(false);
  });
});
