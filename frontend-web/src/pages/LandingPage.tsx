import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  Bars3Icon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type Capability = {
  title: string;
  description: string;
  image: string;
  icon: typeof UserGroupIcon;
  points: string[];
};

type JourneyStep = {
  title: string;
  description: string;
  image: string;
};

const navigation = [
  { label: 'Platform', target: 'platform' },
  { label: 'Journeys', target: 'journeys' },
  { label: 'For India GCCs', target: 'gcc' },
  { label: 'Pricing', target: 'pricing' },
];

const proofMetrics = [
  { value: '3 months', label: 'GCC-ready operating horizon' },
  { value: 'Multi-role', label: 'Owner, HR, manager, employee workspaces' },
  { value: 'Tenant-safe', label: 'Company data separation by design' },
  { value: 'End-to-end', label: 'Hire, manage, grow, exit lifecycle' },
];

const capabilities: Capability[] = [
  {
    title: 'Implementation console for a clean company launch',
    description:
      'Set up a new company with masters, departments, designations, users, reporting relationships, approval flows, document templates, and onboarding readiness from one operating layer.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.07.33-AM.png',
    icon: BuildingOffice2Icon,
    points: ['Company setup', 'Masters migration', 'Role-based access'],
  },
  {
    title: 'Employee lifecycle that behaves like a real HR operating system',
    description:
      'Manage employee records, joining, probation, transfers, promotions, compensation context, documents, performance cycles, and exits without scattering data across spreadsheets.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.15.14-AM.png',
    icon: UserGroupIcon,
    points: ['Employee 360', 'Lifecycle history', 'Document vault'],
  },
  {
    title: 'Attendance and leave with approval depth',
    description:
      'Support employee self-service, manager approvals, HR intervention, bulk updates, monthly views, balances, regularization, and operational reporting for distributed Indian teams.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.16.04-AM.png',
    icon: ClockIcon,
    points: ['Daily operations', 'Leave balances', 'Manager approvals'],
  },
  {
    title: 'Performance, probation, and exit workflows with accountability',
    description:
      'Convert sensitive HR events into structured cases with owners, status, evidence, approvals, and review steps so teams can run the process consistently.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.16.58-AM.png',
    icon: ClipboardDocumentCheckIcon,
    points: ['Review cycles', 'Probation cases', 'Exit clearance'],
  },
  {
    title: 'HR Connect for communication and service moments',
    description:
      'Bring HR announcements, employee conversations, group collaboration, tickets, appointments, and technical hooks for chat, audio, and video-led service into the HR workspace.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.21.10-AM.png',
    icon: ChatBubbleLeftRightIcon,
    points: ['Wall feeds', 'Chat context', 'Appointments'],
  },
  {
    title: 'Documents, reports, and analytics for leadership confidence',
    description:
      'Generate HR documents, preserve employee records, and surface dashboards that help founders, HR leaders, and GCC leadership understand operational health quickly.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.08.18-AM.png',
    icon: ChartBarIcon,
    points: ['Standard letters', 'Analytics views', 'Audit trail'],
  },
];

const journeySteps: JourneyStep[] = [
  {
    title: 'Register the company',
    description:
      'The HR owner creates the tenant, verifies the account, and enters the guided workspace for company setup.',
    image: '/images/Hero-Images/hero-leadership.jpg',
  },
  {
    title: 'Configure the operating model',
    description:
      'Masters, roles, departments, designations, locations, reporting lines, approval rules, and templates are set before employees are invited.',
    image: '/images/Module-Headers/organization-header.jpg',
  },
  {
    title: 'Invite users and run HR operations',
    description:
      'Employees get self-service; managers receive team approvals; HR controls global data, reports, documents, and exceptions.',
    image: '/images/Hero-Images/hero-team-collaboration.jpg',
  },
  {
    title: 'Use demo mode when the team needs confidence',
    description:
      'A curated sample workspace can show good data and complete workflows without polluting the company’s real records.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.07.42-AM.png',
  },
];

const personaCards = [
  {
    title: 'Western MNCs building India GCCs',
    description:
      'Launch the India HR foundation fast while preserving global governance, local compliance expectations, role clarity, and auditable workflows.',
    icon: GlobeAltIcon,
  },
  {
    title: 'Indian SMEs professionalizing HR',
    description:
      'Move beyond spreadsheets into clean employee records, approvals, documents, attendance, leave, and reports without enterprise-suite complexity.',
    icon: BuildingOffice2Icon,
  },
  {
    title: 'New-age startups scaling teams',
    description:
      'Give founders and HR operators enough structure for scale while keeping employee self-service clean, modern, and low-friction.',
    icon: SparklesIcon,
  },
];

const pricingPlans = [
  {
    name: 'Pilot',
    price: 'Free',
    description: 'For evaluation, demo journeys, and first-company setup.',
    features: ['Guided registration', 'Core HR modules', 'Demo workspace', 'Initial tenant setup'],
    action: 'Start pilot',
  },
  {
    name: 'Growth',
    price: 'Per employee',
    description: 'For SMEs and startups ready to operate HR on AuroraHR.',
    features: ['Role-based dashboards', 'Attendance and leave', 'Performance and exit', 'Reports and documents'],
    action: 'Register company',
    featured: true,
  },
  {
    name: 'GCC Launch',
    price: 'Custom',
    description: 'For MNCs planning India entity setup, migration, and rollout.',
    features: ['Implementation planning', 'Data migration support', 'Workflow configuration', 'Leadership reporting'],
    action: 'Talk to us',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const requestDemo = () => {
    window.location.href =
      'mailto:sales@aurorahr.in?subject=AuroraHR%20Demo%20Request&body=Hi%2C%0A%0AI%20would%20like%20to%20schedule%20an%20AuroraHR%20demo.%0A%0ACompany%20Name%3A%0AEmployee%20Count%3A%0AUse%20Case%3A%20GCC%20setup%20%2F%20SME%20HR%20operations%20%2F%20Startup%20scale-up%0APreferred%20Date%2FTime%3A%0A';
  };

  return (
    <div className="bg-white text-gray-900">
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors ${
          scrolled ? 'border-gray-200 bg-white/95 shadow-sm backdrop-blur' : 'border-white/10 bg-gray-950/35 backdrop-blur'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => scrollToSection('top')} className="flex items-center">
            <img
              src="/images/AuroraHR-logo.png"
              alt="AuroraHR"
              className={`h-10 w-auto ${scrolled ? '' : 'rounded-sm bg-white/95 px-2 py-1'}`}
            />
          </button>

          <div className={`hidden items-center gap-7 text-sm font-medium md:flex ${scrolled ? 'text-gray-700' : 'text-white'}`}>
            {navigation.map((item) => (
              <button key={item.target} onClick={() => scrollToSection(item.target)} className="hover:text-primary-300">
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => navigate('/login')}
              className={`px-4 py-2 text-sm font-semibold ${scrolled ? 'text-gray-700 hover:text-primary-700' : 'text-white hover:text-primary-100'}`}
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              Register company
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            className={`md:hidden ${scrolled ? 'text-gray-800' : 'text-white'}`}
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-lg md:hidden">
            <div className="flex flex-col gap-4 text-left text-sm font-medium text-gray-700">
              {navigation.map((item) => (
                <button key={item.target} onClick={() => scrollToSection(item.target)} className="text-left">
                  {item.label}
                </button>
              ))}
              <button onClick={() => navigate('/login')} className="rounded-md border border-gray-300 px-4 py-2">
                Login
              </button>
              <button onClick={() => navigate('/register')} className="rounded-md bg-primary-600 px-4 py-2 text-white">
                Register company
              </button>
            </div>
          </div>
        )}
      </nav>

      <header id="top" className="relative min-h-[92svh] overflow-hidden bg-gray-950">
        <img
          src="/images/Hero-Images/hero-employee-onboarding.jpg"
          alt="HR team using AuroraHR for employee onboarding"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gray-950/68" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white to-transparent" />

        <div className="relative mx-auto flex min-h-[92svh] max-w-7xl flex-col justify-center px-4 pb-24 pt-28 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur">
              <ShieldCheckIcon className="h-5 w-5 text-primary-200" />
              Built for India HR operations, GCC launches, and fast-scaling teams
            </div>

            <h1 className="max-w-3xl text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              AuroraHR
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-gray-100 sm:text-2xl">
              A modern HRMS for companies that need clean implementation, real workflows, role-based workspaces,
              and a dependable employee lifecycle from registration to exit.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center justify-center rounded-md bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-primary-700"
              >
                Register company
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center rounded-md border border-white/70 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur hover:bg-white/20"
              >
                Login to workspace
              </button>
              <button
                onClick={requestDemo}
                className="inline-flex items-center justify-center rounded-md border border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
              >
                Request demo
              </button>
            </div>
          </div>

          <div className="mt-14 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {proofMetrics.map((metric) => (
              <div key={metric.label} className="rounded-md border border-white/20 bg-white/10 p-4 text-white backdrop-blur">
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="mt-1 text-sm text-gray-200">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main>
        <section className="-mt-12 px-4 pb-16 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl">
            <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
              <div className="p-6 sm:p-8 lg:p-10">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Current product depth</p>
                <h2 className="mt-3 text-3xl font-bold text-gray-900">
                  Not a brochure tool. A working HR operating layer.
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  AuroraHR already supports registration, onboarding, employee records, masters, attendance, leave,
                  probation, performance, exit, HR Connect, reports, documents, demo mode, role-based dashboards,
                  and production tenant pilots.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    'Owner implementation console',
                    'HR operations workspace',
                    'Manager approval queue',
                    'Employee self-service',
                    'Demo data mode',
                    'Production pilot import',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <CheckCircleIcon className="h-5 w-5 flex-none text-success-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-950 p-4 sm:p-6">
                <img
                  src="/images/Product-Screenshots/Screenshot-2026-03-26-at-10.07.33-AM.png"
                  alt="AuroraHR dashboard sample"
                  className="h-full min-h-[300px] w-full rounded-md object-cover object-left-top"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Platform capabilities</p>
              <h2 className="mt-3 text-4xl font-bold text-gray-900">A complete HRMS around real work, not isolated screens.</h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Each module has been tested as a role-based journey: employee action, manager approval, HR intervention,
                leadership visibility, and reporting evidence.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {capabilities.map((capability) => (
                <article key={capability.title} className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                  <div className="grid min-h-full md:grid-cols-[0.92fr_1.08fr]">
                    <div className="p-6">
                      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                        <capability.icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{capability.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-gray-600">{capability.description}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {capability.points.map((point) => (
                          <span key={point} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="min-h-[230px] bg-gray-100">
                      <img src={capability.image} alt={`${capability.title} visual`} className="h-full w-full object-cover object-left-top" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="journeys" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Registration to onboarding</p>
                <h2 className="mt-3 text-4xl font-bold text-gray-900">
                  The first journey is intentionally simple.
                </h2>
                <p className="mt-4 text-lg leading-8 text-gray-600">
                  The landing page should move a buyer cleanly into company registration, then into verification,
                  onboarding, configuration, user invites, and daily operations.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <button
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center justify-center rounded-md bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700"
                  >
                    Start registration
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:border-primary-300 hover:text-primary-700"
                  >
                    Existing customer login
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {journeySteps.map((step, index) => (
                  <article key={step.title} className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                    <div className="relative h-44">
                      <img src={step.image} alt={step.title} className="h-full w-full object-cover" />
                      <div className="absolute left-4 top-4 rounded-md bg-white px-2.5 py-1 text-sm font-bold text-primary-700 shadow-sm">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{step.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="gcc" className="bg-gray-950 px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary-200">Built for serious adoption</p>
                <h2 className="mt-3 text-4xl font-bold">Designed for GCC launches, SMEs, and startup scale.</h2>
                <p className="mt-4 text-lg leading-8 text-gray-300">
                  AuroraHR is positioned for organizations that need the discipline of enterprise HR without waiting
                  months for a heavyweight implementation. It fits a Western MNC setting up in India, an SME bringing
                  order to people operations, or a startup preparing for its next growth stage.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {personaCards.map((card) => (
                    <div key={card.title} className="rounded-md border border-white/15 bg-white/10 p-5">
                      <card.icon className="h-7 w-7 text-primary-200" />
                      <h3 className="mt-4 text-base font-bold">{card.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-300">{card.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-md border border-white/15 bg-white/10 p-4">
                <img
                  src="/images/Hero-Images/hero-happy-employees.jpg"
                  alt="Employees collaborating in a modern workplace"
                  className="h-[420px] w-full rounded-md object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Trust and control</p>
                <h2 className="mt-3 text-3xl font-bold text-gray-900">The essentials commercial buyers ask for.</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
                {[
                  {
                    title: 'Authentic multi-tenancy',
                    description: 'Tenant-aware data access and production pilot workflows keep company records separated.',
                    icon: FingerPrintIcon,
                  },
                  {
                    title: 'Role-based UX',
                    description: 'Owners, HR managers, senior employees, managers, and employees see the work that matters to them.',
                    icon: UserPlusIcon,
                  },
                  {
                    title: 'Operational evidence',
                    description: 'Visual QA, screenshots, workflow reports, and seeded demo journeys support investor and customer demos.',
                    icon: DocumentTextIcon,
                  },
                  {
                    title: 'Security-conscious account flows',
                    description: 'Login, profile management, password change, reset hooks, and invite flows are treated as product-critical paths.',
                    icon: LockClosedIcon,
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-md border border-gray-200 p-6">
                    <item.icon className="h-7 w-7 text-primary-700" />
                    <h3 className="mt-4 text-lg font-bold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Commercial path</p>
              <h2 className="mt-3 text-4xl font-bold text-gray-900">Start with a pilot. Grow into production.</h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Pricing should support evaluation, real-company pilots, and implementation-heavy GCC rollouts.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <article
                  key={plan.name}
                  className={`rounded-md border bg-white p-7 shadow-sm ${
                    plan.featured ? 'border-primary-600 ring-2 ring-primary-100' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{plan.description}</p>
                    </div>
                    {plan.featured && <span className="rounded-md bg-success-50 px-2.5 py-1 text-xs font-bold text-success-700">Best fit</span>}
                  </div>
                  <div className="mt-6 text-3xl font-bold text-gray-900">{plan.price}</div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm text-gray-700">
                        <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-none text-success-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={plan.name === 'GCC Launch' ? requestDemo : () => navigate('/register')}
                    className={`mt-7 w-full rounded-md px-4 py-3 font-semibold ${
                      plan.featured ? 'bg-primary-600 text-white hover:bg-primary-700' : 'border border-gray-300 text-gray-800 hover:border-primary-300'
                    }`}
                  >
                    {plan.action}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-primary-700 px-4 py-20 text-white sm:px-6 lg:px-8">
          <img
            src="/images/Hero-Images/hero-team-collaboration.jpg"
            alt="Team reviewing HR data"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-primary-800/82" />
          <div className="relative mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold">Give every buyer a clear next step.</h2>
            <p className="mt-4 text-lg leading-8 text-primary-50">
              New companies register and onboard. Existing users login. Decision makers request a guided demo.
              The product journey stays simple while the platform depth remains visible.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 font-semibold text-primary-700 hover:bg-gray-100"
              >
                Register company
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center rounded-md border border-white/70 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                Login
              </button>
              <button
                onClick={requestDemo}
                className="inline-flex items-center justify-center rounded-md border border-white/35 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                Request demo
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-950 px-4 py-12 text-gray-300 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <img src="/images/AuroraHR-logo-with-tagline.png" alt="AuroraHR" className="h-12 w-auto rounded-sm bg-white px-2 py-1" />
            <p className="mt-4 max-w-md text-sm leading-6 text-gray-400">
              AuroraHR helps organizations launch, operate, and improve HR with strong workflows, role clarity,
              and a practical path from pilot to production.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white">Platform</h3>
            <div className="mt-3 space-y-2 text-sm">
              <button onClick={() => scrollToSection('platform')} className="block hover:text-white">Capabilities</button>
              <button onClick={() => scrollToSection('journeys')} className="block hover:text-white">User journeys</button>
              <button onClick={() => scrollToSection('pricing')} className="block hover:text-white">Pricing</button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white">Access</h3>
            <div className="mt-3 space-y-2 text-sm">
              <button onClick={() => navigate('/register')} className="block hover:text-white">Register</button>
              <button onClick={() => navigate('/login')} className="block hover:text-white">Login</button>
              <button onClick={requestDemo} className="block hover:text-white">Request demo</button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white">Audience</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-400">
              <div>India GCC launch teams</div>
              <div>Indian SMEs</div>
              <div>Scaling startups</div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-sm text-gray-500">
          © 2026 AuroraHR. Illuminate The Journey. Grow Every Person.
        </div>
      </footer>
    </div>
  );
}
