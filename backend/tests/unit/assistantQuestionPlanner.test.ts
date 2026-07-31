import {
  isConversationalReference,
  planManuQuestion,
  questionUsesEmployeeSubject,
} from '../../src/assistant/questionPlanner';

describe('Manu question planner', () => {
  it.each([
    ['Who does Surekha report to?', 'reporting_manager'],
    ['Who is the manager of QA/ACV/0004?', 'reporting_manager'],
    ['Who reports to Aniket?', 'direct_reports'],
    ['Show her direct reports', 'direct_reports'],
    ['What is her designation?', 'designation'],
    ['Which department is Surekha in?', 'department'],
    ['When did Surekha join?', 'joining_date'],
    ['Where does Surekha work?', 'work_location'],
    ['Show me Surekha’s profile', 'employee_profile'],
    ['What is Surekha’s CTC?', 'employee_compensation'],
    ['What is her leave balance?', 'employee_leave'],
    ['Which documents does Surekha have?', 'employee_documents'],
    ['Draft an email to her manager', 'draft_manager_email'],
    ['Show headcount by department', 'aggregate'],
    ['How do I regularise attendance?', 'workflow'],
    ['What should I review today?', 'general'],
  ] as const)('plans "%s" as %s', (prompt, expected) => {
    expect(planManuQuestion(prompt)).toBe(expected);
  });

  it('marks employee-specific questions as requiring a subject', () => {
    expect(questionUsesEmployeeSubject('reporting_manager')).toBe(true);
    expect(questionUsesEmployeeSubject('employee_leave')).toBe(true);
    expect(questionUsesEmployeeSubject('aggregate')).toBe(false);
  });

  it('recognises pronouns and conversational references', () => {
    expect(isConversationalReference('What is her designation?')).toBe(true);
    expect(isConversationalReference('Show his direct reports')).toBe(true);
    expect(isConversationalReference('Who manages Surekha?')).toBe(false);
  });
});
