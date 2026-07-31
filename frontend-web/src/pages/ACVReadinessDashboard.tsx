import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ModernLayout } from '../components/layout/ModernLayout';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

type Status = 'green' | 'amber' | 'red' | 'grey';
type Priority = 'critical' | 'high' | 'medium' | 'parked';
type TaskArea = 'employee' | 'uat' | 'decision' | 'document' | 'compensation';

interface Metric {
  label: string;
  value: string;
  detail: string;
  status: Status;
}

interface Task {
  id: string;
  title: string;
  owner: string;
  area: TaskArea;
  priority: Priority;
  due: string;
  employeeCode?: string;
  detail: string;
  actionPath?: string;
}

interface EmployeeRow {
  code: string;
  role: string;
  manager: string;
  missing: string[];
  compensation: string;
  payslips: number;
}

const STORAGE_KEY = 'acv-readiness-completed-actions-v1';

const statusStyles: Record<Status, string> = {
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-rose-50 text-rose-800 ring-rose-200',
  grey: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const priorityStyles: Record<Priority, string> = {
  critical: 'bg-rose-50 text-rose-700 ring-rose-200',
  high: 'bg-orange-50 text-orange-700 ring-orange-200',
  medium: 'bg-sky-50 text-sky-700 ring-sky-200',
  parked: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const metrics: Metric[] = [
  {
    label: 'Controlled UAT',
    value: 'Ready',
    detail: 'Core product evidence is strong enough for guided ACV walkthrough.',
    status: 'green',
  },
  {
    label: 'Active Employees',
    value: '6',
    detail: 'Cleanup scope is deliberately limited to live ACV records.',
    status: 'amber',
  },
  {
    label: 'Automated Evidence',
    value: '184 / 196',
    detail: 'Zero failed tests in the latest readiness pack.',
    status: 'green',
  },
  {
    label: 'Accepted Gaps',
    value: '38',
    detail: 'Storage blockers are parked by product decision for this phase.',
    status: 'grey',
  },
];

const readinessChart = [
  { name: 'Green', value: 5, color: '#059669' },
  { name: 'Amber', value: 5, color: '#d97706' },
  { name: 'Red', value: 3, color: '#e11d48' },
  { name: 'Parked', value: 1, color: '#64748b' },
];

const activeEmployees: EmployeeRow[] = [
  {
    code: 'ACV/EMP/0001',
    role: 'Director',
    manager: 'Top-level decision pending',
    missing: ['dateOfBirth', 'phone', 'address', 'reportingManager', 'workLocation'],
    compensation: 'No structure',
    payslips: 0,
  },
  {
    code: 'ACV/EMP/0002',
    role: 'Sr. Software Developer',
    manager: 'ACV/EMP/0001',
    missing: ['address', 'workLocation'],
    compensation: 'Active structure',
    payslips: 22,
  },
  {
    code: 'ACV/EMP/0008',
    role: 'Technical Lead',
    manager: 'ACV/EMP/0001',
    missing: ['address', 'workLocation'],
    compensation: 'Active structure',
    payslips: 17,
  },
  {
    code: 'ACV/EMP/0012',
    role: 'Software Developer',
    manager: 'ACV/EMP/0008',
    missing: ['address', 'workLocation'],
    compensation: 'Active structure',
    payslips: 5,
  },
  {
    code: 'ACV/EMP/0013',
    role: 'Software Developer',
    manager: 'ACV/EMP/0008',
    missing: ['address', 'workLocation'],
    compensation: 'Active structure',
    payslips: 2,
  },
  {
    code: 'ACV/EMP/0014',
    role: 'Software Developer',
    manager: 'ACV/EMP/0008',
    missing: ['address', 'workLocation'],
    compensation: 'Active structure',
    payslips: 2,
  },
];

const tasks: Task[] = [
  {
    id: 'standard-work-location',
    title: 'Confirm standard work location',
    owner: 'HR Admin',
    area: 'decision',
    priority: 'critical',
    due: 'Before employee edits',
    detail: 'Choose the workLocation value to apply across all 6 active employees.',
    actionPath: '/settings',
  },
  {
    id: 'emp-0001-profile',
    title: 'Complete Director profile',
    owner: 'HR Admin',
    area: 'employee',
    priority: 'critical',
    due: 'Day 1',
    employeeCode: 'ACV/EMP/0001',
    detail: 'Fill phone, address, date of birth if required, and work location.',
    actionPath: '/employees',
  },
  {
    id: 'emp-0001-manager',
    title: 'Decide top-level reporting rule',
    owner: 'Leadership',
    area: 'decision',
    priority: 'high',
    due: 'Day 1',
    employeeCode: 'ACV/EMP/0001',
    detail: 'Either accept blank reportingManager for Director or assign a formal reporting owner.',
  },
  {
    id: 'emp-0002-cleanup',
    title: 'Complete active profile',
    owner: 'HR Admin',
    area: 'employee',
    priority: 'high',
    due: 'Day 2',
    employeeCode: 'ACV/EMP/0002',
    detail: 'Fill address and work location.',
    actionPath: '/employees',
  },
  {
    id: 'emp-0008-cleanup',
    title: 'Complete Technical Lead profile',
    owner: 'HR Admin',
    area: 'employee',
    priority: 'high',
    due: 'Day 2',
    employeeCode: 'ACV/EMP/0008',
    detail: 'Fill address and work location.',
    actionPath: '/employees',
  },
  {
    id: 'emp-0012-cleanup',
    title: 'Complete Software Developer profile',
    owner: 'HR Admin',
    area: 'employee',
    priority: 'medium',
    due: 'Day 3',
    employeeCode: 'ACV/EMP/0012',
    detail: 'Fill address and work location.',
    actionPath: '/employees',
  },
  {
    id: 'emp-0013-cleanup',
    title: 'Complete Software Developer profile',
    owner: 'HR Admin',
    area: 'employee',
    priority: 'medium',
    due: 'Day 3',
    employeeCode: 'ACV/EMP/0013',
    detail: 'Fill address and work location.',
    actionPath: '/employees',
  },
  {
    id: 'emp-0014-cleanup',
    title: 'Complete Software Developer profile',
    owner: 'HR Admin',
    area: 'employee',
    priority: 'medium',
    due: 'Day 3',
    employeeCode: 'ACV/EMP/0014',
    detail: 'Fill address and work location.',
    actionPath: '/employees',
  },
  {
    id: 'director-compensation-decision',
    title: 'Decide Director compensation scope',
    owner: 'Leadership',
    area: 'compensation',
    priority: 'medium',
    due: 'Before UAT',
    employeeCode: 'ACV/EMP/0001',
    detail: 'Accept no compensation for UAT or add a salary structure for the Director record.',
    actionPath: '/compensation',
  },
  {
    id: 'document-gap-note',
    title: 'Record accepted storage gaps',
    owner: 'Product Owner',
    area: 'document',
    priority: 'parked',
    due: 'Before sign-off',
    detail: 'Keep the 38 storage blockers in known-gap status, outside this active-employee sprint.',
    actionPath: '/documents',
  },
  {
    id: 'rerun-validation',
    title: 'Re-run ACV validation',
    owner: 'Implementation',
    area: 'uat',
    priority: 'critical',
    due: 'After cleanup',
    detail: 'Verify active employee master gaps dropped before controlled UAT.',
  },
  {
    id: 'role-walkthrough',
    title: 'Run four-role UAT walkthrough',
    owner: 'HR + Product',
    area: 'uat',
    priority: 'high',
    due: 'Final pass',
    detail: 'Walk through System Admin, HR Admin, Manager, and Employee views.',
    actionPath: '/dashboard',
  },
];

const areaLabels: Record<TaskArea | 'all', string> = {
  all: 'All areas',
  employee: 'Employee',
  uat: 'UAT',
  decision: 'Decision',
  document: 'Document',
  compensation: 'Compensation',
};

function loadCompletedTasks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${priorityStyles[priority]}`}>
      {priority}
    </span>
  );
}

export default function ACVReadinessDashboard() {
  const navigate = useNavigate();
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(loadCompletedTasks);
  const [areaFilter, setAreaFilter] = useState<TaskArea | 'all'>('all');
  const [hideDone, setHideDone] = useState(false);

  const completedSet = useMemo(() => new Set(completedTaskIds), [completedTaskIds]);
  const activeTasks = tasks.filter((task) => !completedSet.has(task.id));
  const progress = Math.round((completedTaskIds.length / tasks.length) * 100);
  const criticalOpen = activeTasks.filter((task) => task.priority === 'critical').length;
  const filteredTasks = tasks.filter((task) => {
    if (hideDone && completedSet.has(task.id)) return false;
    if (areaFilter !== 'all' && task.area !== areaFilter) return false;
    return true;
  });

  const toggleTask = (taskId: string) => {
    setCompletedTaskIds((current) => {
      const next = current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCompletedTaskIds([]);
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                  ACV Customer Zero
                </span>
                <StatusBadge status="amber" />
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                Aura Readiness Cockpit
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Action dashboard for completing the 6 active ACV employee records, keeping accepted storage gaps parked, and preparing controlled UAT.
              </p>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-3 sm:min-w-[360px]">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase text-emerald-700">Progress</p>
                <p className="mt-1 text-3xl font-semibold text-emerald-950">{progress}%</p>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-semibold uppercase text-rose-700">Critical Open</p>
                <p className="mt-1 text-3xl font-semibold text-rose-950">{criticalOpen}</p>
              </div>
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                <StatusBadge status={metric.status} />
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{metric.value}</p>
              <p className="mt-1 text-sm leading-5 text-slate-600">{metric.detail}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.6fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Action Queue</h2>
                <p className="mt-1 text-sm text-slate-600">Complete these items to make active employee UAT credible.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <FunnelIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={areaFilter}
                    onChange={(event) => setAreaFilter(event.target.value as TaskArea | 'all')}
                    className="rounded-lg border-slate-300 py-2 pl-9 pr-8 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    aria-label="Filter task area"
                  >
                    {Object.entries(areaLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={hideDone}
                    onChange={(event) => setHideDone(event.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Hide done
                </label>
                <button
                  type="button"
                  onClick={resetProgress}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  title="Reset saved task progress"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredTasks.map((task) => {
                const done = completedSet.has(task.id);
                return (
                  <article
                    key={task.id}
                    className={`rounded-lg border p-4 transition ${
                      done ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-white hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <PriorityBadge priority={task.priority} />
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {areaLabels[task.area]}
                          </span>
                          {task.employeeCode && (
                            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800 ring-1 ring-cyan-200">
                              {task.employeeCode}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-slate-950">{task.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{task.detail}</p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                          <span>Owner: {task.owner}</span>
                          <span>Target: {task.due}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {task.actionPath && (
                          <button
                            type="button"
                            onClick={() => navigate(task.actionPath!)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Open
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                            done
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          {done ? 'Done' : 'Complete'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Readiness Mix</h2>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={readinessChart} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>
                      {readinessChart.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {readinessChart.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span>{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Decision Log</h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-900">Accepted for this phase</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">38 storage blockers are parked and should not block active employee UAT.</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-700" />
                    <p className="text-sm font-semibold text-amber-950">Needs a call</p>
                  </div>
                  <p className="mt-1 text-sm text-amber-800">Director reporting manager and compensation coverage need explicit UAT decisions.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Active Employee Register Cleanup</h2>
              <p className="mt-1 text-sm text-slate-600">Only live ACV records are shown. Historical records are intentionally hidden.</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <UsersIcon className="h-5 w-5" />
              6 active employees
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="py-3 pr-4">Employee</th>
                  <th className="px-4 py-3">Manager</th>
                  <th className="px-4 py-3">Missing Fields</th>
                  <th className="px-4 py-3">Compensation</th>
                  <th className="py-3 pl-4 text-right">Payslips</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeEmployees.map((employee) => (
                  <tr key={employee.code}>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                          <UserCircleIcon className="h-6 w-6" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-950">{employee.code}</p>
                          <p className="text-slate-500">{employee.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{employee.manager}</td>
                    <td className="px-4 py-4">
                      <div className="flex max-w-xl flex-wrap gap-1.5">
                        {employee.missing.map((field) => (
                          <span key={field} className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                            {field}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                        employee.compensation === 'Active structure'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-amber-50 text-amber-800 ring-amber-200'
                      }`}>
                        {employee.compensation}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right font-semibold text-slate-900">{employee.payslips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <ClipboardDocumentCheckIcon className="h-6 w-6 text-emerald-700" />
            <h3 className="mt-3 text-base font-semibold text-emerald-950">Ready for UAT</h3>
            <p className="mt-1 text-sm text-emerald-800">Auth, RBAC, tenant isolation, leave, attendance, and core product flows have green evidence.</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <UsersIcon className="h-6 w-6 text-amber-700" />
            <h3 className="mt-3 text-base font-semibold text-amber-950">Needs Cleanup</h3>
            <p className="mt-1 text-sm text-amber-800">Active employee address, work location, Director profile, and two leadership decisions.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <DocumentTextIcon className="h-6 w-6 text-slate-700" />
            <h3 className="mt-3 text-base font-semibold text-slate-950">Accepted as Parked</h3>
            <p className="mt-1 text-sm text-slate-700">Document and payslip storage blockers stay known gaps for this phase.</p>
          </div>
        </section>
      </div>
    </ModernLayout>
  );
}
