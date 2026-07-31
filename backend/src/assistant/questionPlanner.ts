import { ManuQuestionType } from './types';

const matches = (prompt: string, pattern: RegExp) => pattern.test(prompt.trim().toLowerCase());

export const planManuQuestion = (prompt: string): ManuQuestionType => {
  if (matches(prompt, /\b(draft|prepare|write)\b.*\b(email|message)\b.*\b(manager|reporting manager)\b|\b(draft|prepare|write)\b.*\b(manager|reporting manager)\b.*\b(email|message)\b/)) {
    return 'draft_manager_email';
  }
  if (matches(prompt, /\bwho\s+(?:else\s+)?reports?\s+to\b|\bdirect reports?\b|\bteam members?\b|\bwho is on (?:her|his|their|the) team\b/)) {
    return 'direct_reports';
  }
  if (matches(prompt, /\bwho\s+does\b.+\breport\s+to\b|\bwho\s+is\b.+\bmanager\b|\breporting manager\b|\bmanager\s+(?:of|for)\b/)) {
    return 'reporting_manager';
  }
  if (matches(prompt, /\b(headcount|head count|attrition|breakdown|trend|how many|count|number)\b/)) return 'aggregate';
  if (matches(prompt, /\bdesignation\b|\bjob title\b|\bwhat (?:is|does).+\brole\b/)) return 'designation';
  if (matches(prompt, /\bdepartment\b|\bwhich (?:team|function)\b/)) return 'department';
  if (matches(prompt, /\b(joining date|date of joining|when did .+ join|when .+ joined)\b/)) return 'joining_date';
  if (matches(prompt, /\b(work location|office location|where does .+ work|based in)\b/)) return 'work_location';
  if (matches(prompt, /\b(salary|compensation|payslip|pay slip|ctc|gross pay|net pay)\b/)) return 'employee_compensation';
  if (matches(prompt, /\b(leave balance|leave balances|available leave|remaining leave)\b/)) return 'employee_leave';
  if (matches(prompt, /\b(document|documents|certificate|letter|proof|evidence)\b/)) return 'employee_documents';
  if (matches(prompt, /\b(show|open|view|give).+\b(profile|employee record)\b|\bprofile\b/)) return 'employee_profile';
  if (matches(prompt, /\b(how do i|how to|guide me|step by step|process)\b/)) return 'workflow';
  return 'general';
};

export const questionUsesEmployeeSubject = (questionType: ManuQuestionType) =>
  [
    'reporting_manager',
    'direct_reports',
    'designation',
    'department',
    'joining_date',
    'work_location',
    'employee_profile',
    'employee_compensation',
    'employee_leave',
    'employee_documents',
    'draft_manager_email',
  ].includes(questionType);

export const isConversationalReference = (prompt: string) =>
  /\b(her|his|him|she|he|their|them|that employee|this employee)\b/i.test(prompt);
