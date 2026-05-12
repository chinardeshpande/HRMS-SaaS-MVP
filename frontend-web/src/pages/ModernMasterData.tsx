import { Link } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import {
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const masterCards = [
  {
    title: 'Departments',
    description: 'Maintain company units and sub-units used by employees, approvals, org charts, reports, and imports.',
    href: '/departments',
    icon: BuildingOfficeIcon,
    metric: 'Organization units',
  },
  {
    title: 'Designations',
    description: 'Maintain role titles and hierarchy levels used by employee records, approvals, and workforce analytics.',
    href: '/designations',
    icon: BriefcaseIcon,
    metric: 'Role hierarchy',
  },
];

const implementationChecks = [
  { label: 'Employee imports can map to clean departments and designations', icon: UsersIcon },
  { label: 'Approval workflows can rely on reporting and organization structure', icon: ClipboardDocumentCheckIcon },
  { label: 'Reports and analytics use consistent master dimensions', icon: ChartBarIcon },
];

export default function ModernMasterData() {
  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              Implementation Console
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Master Data</h1>
            <p className="mt-2 max-w-3xl text-gray-600">
              Build the controlled organization reference data that employee migration, HR workflows, reports, documents, and approval rules depend on.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {masterCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                to={card.href}
                className="card group block transition hover:border-primary-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary-50 p-3 text-primary-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{card.metric}</p>
                      <h2 className="mt-1 text-xl font-semibold text-gray-900">{card.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{card.description}</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="mt-2 h-5 w-5 text-gray-400 transition group-hover:translate-x-1 group-hover:text-primary-600" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Production Readiness Checks</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {implementationChecks.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <Icon className="h-6 w-6 text-primary-600" />
                  <p className="mt-3 text-sm font-medium leading-6 text-gray-800">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
