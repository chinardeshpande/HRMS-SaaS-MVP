import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  SparklesIcon,
  UserGroupIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import BrandedScreenshot from '../components/landing/BrandedScreenshot';
import { adoptionJourneys } from '../data/adoptionJourneys';
import { differentiators } from '../data/differentiators';
import { platformPillars } from '../data/platformPillars';

type Capability = {
  moduleId: string;
  title: string;
  description: string;
  image: string;
  icon: typeof UserGroupIcon;
  points: string[];
};

const navigation = [
  { label: 'Home', target: 'top' },
  { label: 'Platform', target: 'platform' },
  { label: 'Uniqueness', target: 'unique' },
  { label: 'Ease of Adoption', target: 'journeys' },
  { label: 'Contact Us', target: 'contact' },
];

const capabilities: Capability[] = [
  {
    moduleId: 'organization',
    title: 'Implementation console for a clean company launch',
    description:
      'Set up a new company with masters, departments, designations, users, reporting relationships, approval flows, document templates, and onboarding readiness from one operating layer.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.07.33-AM.png',
    icon: BuildingOffice2Icon,
    points: ['Company setup', 'Masters migration', 'Role-based access'],
  },
  {
    moduleId: 'employee-management',
    title: 'Employee lifecycle that behaves like a real HR operating system',
    description:
      'Manage employee records, joining, probation, transfers, promotions, compensation context, documents, performance cycles, and exits without scattering data across spreadsheets.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.15.14-AM.png',
    icon: UserGroupIcon,
    points: ['Employee 360', 'Lifecycle history', 'Document vault'],
  },
  {
    moduleId: 'attendance',
    title: 'Attendance and leave with approval depth',
    description:
      'Support employee self-service, manager approvals, HR intervention, bulk updates, monthly views, balances, regularization, and operational reporting for distributed Indian teams.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.16.04-AM.png',
    icon: ClockIcon,
    points: ['Daily operations', 'Leave balances', 'Manager approvals'],
  },
  {
    moduleId: 'performance',
    title: 'Performance, probation, and exit workflows with accountability',
    description:
      'Convert sensitive HR events into structured cases with owners, status, evidence, approvals, and review steps so teams can run the process consistently.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.16.58-AM.png',
    icon: ClipboardDocumentCheckIcon,
    points: ['Review cycles', 'Probation cases', 'Exit clearance'],
  },
  {
    moduleId: 'hr-connect',
    title: 'HR Connect for communication and service moments',
    description:
      'Bring HR announcements, employee conversations, group collaboration, tickets, appointments, and technical hooks for chat, audio, and video-led service into the HR workspace.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.21.10-AM.png',
    icon: ChatBubbleLeftRightIcon,
    points: ['Wall feeds', 'Chat context', 'Appointments'],
  },
  {
    moduleId: 'dashboard',
    title: 'Documents, reports, and analytics for leadership confidence',
    description:
      'Generate HR documents, preserve employee records, and surface dashboards that help founders, HR leaders, and GCC leadership understand operational health quickly.',
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.08.18-AM.png',
    icon: ChartBarIcon,
    points: ['Standard letters', 'Analytics views', 'Audit trail'],
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
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('top');
  const [activePlatformTab, setActivePlatformTab] = useState<'depth' | 'capabilities' | 'modules' | 'trust'>('depth');
  const [activeUniqueTab, setActiveUniqueTab] = useState<'unique' | 'differentiators'>('unique');
  const [contactForm, setContactForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    interest: 'GCC launch',
    preferredDate: '',
    preferredTime: '',
    message: '',
  });

  useEffect(() => {
    const sectionIds = navigation.map((item) => item.target);
    const onScroll = () => {
      setScrolled(window.scrollY > 24);

      let currentSection = 'top';
      sectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= 120) {
          currentSection = id;
        }
      });

      setActiveSection(currentSection);
    };

    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const nav = document.querySelector('nav');
    const navHeight = nav instanceof HTMLElement ? nav.getBoundingClientRect().height : 64;
    const contentElement = id === 'top' ? element : element.firstElementChild;
    const targetElement = contentElement instanceof HTMLElement ? contentElement : element;
    const top = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const routeState = location.state as { scrollTo?: string; uniqueTab?: 'unique' | 'differentiators' } | null;
    if (routeState?.uniqueTab) {
      setActiveUniqueTab(routeState.uniqueTab);
    }
    const sectionFromState = routeState?.scrollTo;
    const sectionFromHash = location.hash?.replace('#', '');
    const target = sectionFromState || sectionFromHash;
    if (!target) return;
    window.setTimeout(() => scrollToSection(target), 80);
    window.setTimeout(() => scrollToSection(target), 450);
  }, [location.hash, location.state]);

  const requestDemo = () => {
    scrollToSection('contact');
  };

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = [
      'Hi Anupama,',
      '',
      'A new AuroraHR website enquiry has been submitted.',
      '',
      `Name: ${contactForm.name}`,
      `Company: ${contactForm.company}`,
      `Email: ${contactForm.email}`,
      `Phone: ${contactForm.phone}`,
      `Interest: ${contactForm.interest}`,
      `Preferred demo date: ${contactForm.preferredDate || 'Not specified'}`,
      `Preferred demo time: ${contactForm.preferredTime || 'Not specified'}`,
      '',
      'Message:',
      contactForm.message || 'Not specified',
    ].join('\n');

    window.location.href = `mailto:Anupama.Bhat@acvsolutions.in?subject=${encodeURIComponent(
      `AuroraHR enquiry - ${contactForm.company || contactForm.name || 'Website lead'}`
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="bg-white text-gray-900">
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur transition-shadow ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => scrollToSection('top')} className="flex items-center">
            <img
              src="/images/AuroraHR_logo.svg?v=20260514b"
              alt="AuroraHR"
              className="h-10 w-auto transition-all"
            />
          </button>

          <div className="hidden items-center gap-1 rounded-full border border-gray-200 bg-white/80 p-1 text-sm font-semibold text-gray-600 shadow-sm lg:flex">
            {navigation.map((item) => (
              <button
                key={item.target}
                onClick={() => scrollToSection(item.target)}
                className={`rounded-full px-4 py-2 transition ${
                  activeSection === item.target
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'hover:bg-primary-50 hover:text-primary-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary-700"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              Sign Up / Register
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="text-gray-800 lg:hidden"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-lg lg:hidden">
            <div className="flex flex-col gap-2 text-left text-sm font-semibold text-gray-700">
              {navigation.map((item) => (
                <button
                  key={item.target}
                  onClick={() => scrollToSection(item.target)}
                  className={`rounded-md px-3 py-3 text-left ${
                    activeSection === item.target ? 'bg-primary-50 text-primary-800' : 'hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="mt-2 grid gap-2 border-t border-gray-100 pt-3">
                <button onClick={() => navigate('/login')} className="rounded-md border border-gray-300 px-4 py-3">
                  Sign In
                </button>
                <button onClick={() => navigate('/register')} className="rounded-md bg-primary-600 px-4 py-3 text-white">
                  Sign Up / Register
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <header id="top" className="relative overflow-hidden bg-white pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_9%_11%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(14,165,233,0.13),transparent_28%),linear-gradient(135deg,rgba(248,253,255,1),rgba(230,244,250,0.9))]" />
        <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl items-center px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="grid w-full overflow-hidden rounded-md border border-white/80 bg-white/72 shadow-2xl shadow-primary-900/10 backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
            <div className="flex items-center p-5 sm:p-7 lg:p-7 xl:p-8">
              <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-primary-200 bg-white/75 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-800 shadow-sm backdrop-blur sm:text-xs">
                Built for serious adoption
              </div>
              <h1 className="mt-3 max-w-3xl text-[2rem] font-bold leading-[1.04] text-gray-950 sm:text-5xl lg:text-[3.05rem] xl:text-[3.25rem]">
                A clean HR foundation for GCC launches, SMEs, and startup scale.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-700 sm:text-base lg:text-base lg:leading-6">
                Launch people operations quickly with role-based workspaces, employee lifecycle workflows,
                documents, HR Connect, and leadership visibility without forcing payroll or recruitment lock-in.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { label: 'Fast implementation', path: '/platform/implementation-ready' },
                  { label: 'Human HR journeys', path: '/platform/human-hr-journeys' },
                  { label: 'Tenant-safe operations', path: '/platform/workflow-depth' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className="rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800 transition hover:border-primary-300 hover:bg-primary-100"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-900/15 hover:bg-primary-700"
                >
                  Register company
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </button>
                <button
                  onClick={requestDemo}
                  className="inline-flex items-center justify-center rounded-md border border-primary-200 bg-white/75 px-5 py-2.5 text-sm font-semibold text-primary-800 shadow-sm backdrop-blur hover:border-primary-300 hover:bg-white"
                >
                  Request demo
                </button>
              </div>

              <div className="mt-[34px] hidden gap-3 md:grid md:grid-cols-3">
                {personaCards.map((card) => (
                  <div
                    key={card.title}
                    className="max-h-36 overflow-hidden rounded-md border border-gray-200/80 bg-white/86 p-3 shadow-md shadow-primary-900/5 backdrop-blur"
                  >
                    <card.icon className="h-5 w-5 text-primary-700" />
                    <h2 className="mt-2 text-sm font-bold leading-tight text-gray-950">{card.title}</h2>
                    <p className="mt-2 max-h-12 overflow-hidden text-[11px] leading-4 text-gray-600">{card.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-primary-900 md:hidden">
                <div className="rounded-md border border-primary-100 bg-white/80 px-2 py-2">GCCs</div>
                <div className="rounded-md border border-primary-100 bg-white/80 px-2 py-2">SMEs</div>
                <div className="rounded-md border border-primary-100 bg-white/80 px-2 py-2">Startups</div>
              </div>
              </div>
            </div>

            <div className="order-first flex h-[176px] flex-col bg-white sm:h-[260px] lg:order-none lg:h-[620px] xl:h-[640px]">
              <div className="relative min-h-0 flex-1">
                <img
                  src="/images/Hero-Images/hero-happy-employees.jpg"
                  alt="Employees collaborating in a modern workplace"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/18 via-transparent to-transparent lg:bg-gradient-to-r lg:from-primary-50/25 lg:via-transparent lg:to-transparent" />
              </div>
              <div className="bg-primary-50/80 pt-3">
                <div className="min-h-36 rounded-md border border-gray-200/80 bg-white/86 p-3 shadow-md shadow-primary-900/5 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Practical HRMS</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs leading-5 text-gray-700 lg:text-sm">
                    <span>Focused on</span>
                    {['HR operations', 'lifecycle workflows', 'documents', 'collaboration', 'adoption'].map((attribute, index) => (
                      <span key={attribute} className="inline-flex items-center">
                        <span className="rounded-full border border-primary-100 bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-800 lg:text-xs">
                          {attribute}
                        </span>
                        {index < 4 && <span className="ml-1 text-gray-400">,</span>}
                      </span>
                    ))}
                    <span>.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="platform" className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Platform capabilities</p>
              <h2 className="mt-3 text-4xl font-bold text-gray-900">The HR foundation for a company that is ready to operate.</h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                AuroraHR is organized around the operating moments HR teams handle every week: clean data,
                employee self-service, manager approvals, HR exceptions, documents, communication, and leadership visibility.
              </p>
              </div>
              <div className="grid gap-2 rounded-md border border-gray-200 bg-white p-1 text-sm font-semibold text-gray-600 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { id: 'depth', label: 'Current Product Depth' },
                  { id: 'capabilities', label: 'Platform Capabilities' },
                  { id: 'modules', label: 'Explore Modules' },
                  { id: 'trust', label: 'Trust & Control' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePlatformTab(tab.id as 'depth' | 'capabilities' | 'modules' | 'trust')}
                    className={`rounded-md px-4 py-2.5 text-left transition sm:text-center ${
                      activePlatformTab === tab.id ? 'bg-primary-600 text-white shadow-sm' : 'hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activePlatformTab === 'depth' && (
              <div className="mt-10 overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl">
                <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="p-6 sm:p-8 lg:p-10">
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Current product depth</p>
                    <h3 className="mt-3 text-3xl font-bold text-gray-900">
                      Not a brochure tool. A working HR operating layer.
                    </h3>
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
                    <BrandedScreenshot
                      src="/images/Product-Screenshots/Screenshot-2026-03-26-at-10.07.33-AM.png"
                      alt="AuroraHR dashboard sample"
                      className="h-full min-h-[300px] w-full rounded-md"
                      imageClassName="h-full min-h-[300px] w-full rounded-md object-cover object-left-top"
                    />
                  </div>
                </div>
              </div>
            )}

            {activePlatformTab === 'capabilities' && (
              <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {platformPillars.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => navigate(`/platform/${feature.id}`)}
                    className="group rounded-md border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg"
                  >
                    <feature.icon className="h-7 w-7 text-primary-700" />
                    <h3 className="mt-5 text-lg font-bold text-gray-900 group-hover:text-primary-700">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{feature.description}</p>
                    <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary-700">
                      Open page
                      <ArrowRightIcon className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activePlatformTab === 'modules' && (
              <div className="mt-10">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Explore the modules</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">Each capability opens into a focused product page.</h3>
                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  {capabilities.map((capability) => (
                    <article
                      key={capability.title}
                      onClick={() => navigate(`/features/${capability.moduleId}`)}
                      className="group cursor-pointer overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <BrandedScreenshot
                        src={capability.image}
                        alt={`${capability.title} visual`}
                        className="h-44 bg-gray-100"
                        imageClassName="h-full w-full object-cover object-left-top"
                      />
                      <div className="p-6">
                        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                          <capability.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-700">{capability.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-gray-600">{capability.description}</p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {capability.points.map((point) => (
                            <span key={point} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                              {point}
                            </span>
                          ))}
                        </div>
                        <div className="mt-5 inline-flex items-center text-sm font-semibold text-primary-700">
                          View capability
                          <ArrowRightIcon className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {activePlatformTab === 'trust' && (
              <div className="mt-10 grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Trust and control</p>
                  <h3 className="mt-3 text-3xl font-bold text-gray-900">The essentials commercial buyers ask for.</h3>
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
                    <div key={item.title} className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                      <item.icon className="h-7 w-7 text-primary-700" />
                      <h4 className="mt-4 text-lg font-bold text-gray-900">{item.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="journeys" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Registration to adoption</p>
              <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <h2 className="text-4xl font-bold text-gray-900">A simple path from first visit to mature HR operations.</h2>
                  <p className="mt-4 text-lg leading-8 text-gray-600">
                  The onboarding journey is designed to feel obvious: register, configure, migrate, operate,
                  train with demo mode, and then scale the HR operating model.
                </p>
                </div>
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center justify-center rounded-md bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700"
                >
                  Start registration
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </button>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {adoptionJourneys.map((journey, index) => (
                    <article
                      key={journey.id}
                      onClick={() => navigate(`/journeys/${journey.id}`)}
                    className="group cursor-pointer rounded-md border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg"
                    >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                        {String(index + 1).padStart(2, '0')}
                        </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <journey.icon className="h-5 w-5 text-primary-700" />
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{journey.shortTitle}</p>
                        </div>
                        <h3 className="mt-1 text-base font-bold leading-snug text-gray-900 group-hover:text-primary-700">{journey.title}</h3>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr]">
                      <div className="relative h-24 overflow-hidden rounded-md bg-gray-100">
                          <img src={journey.image} alt={journey.title} className="h-full w-full object-cover" />
                        </div>
                      <div>
                        <p className="text-sm leading-6 text-gray-600">{journey.description}</p>
                        <div className="mt-3 inline-flex items-center text-sm font-semibold text-primary-700">
                            View adoption stage
                            <ArrowRightIcon className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
            </div>
          </div>
        </section>

        <section id="unique" className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
                  {activeUniqueTab === 'unique' ? 'What is unique' : 'Key differentiators'}
                </p>
                <h2 className="mt-3 text-4xl font-bold text-gray-900">
                  {activeUniqueTab === 'unique'
                    ? 'Focused HR software that avoids the all-in-one trap.'
                    : 'Three product choices that make AuroraHR feel different.'}
                </h2>
                <p className="mt-4 text-lg leading-8 text-gray-600">
                  {activeUniqueTab === 'unique'
                    ? 'AuroraHR is intentionally human-centric, HR-focused, and ecosystem-friendly. It gives each persona a clean workspace while leaving room for the customer’s existing payroll, recruitment, finance, identity, and collaboration systems.'
                    : 'The strongest parts of AuroraHR are the connective ideas that make HR work easier: context-rich collaboration, document-backed lifecycle actions, and timeline-led process UX.'}
                </p>
              </div>
              <div className="grid gap-2 rounded-md border border-gray-200 bg-white p-1 text-sm font-semibold text-gray-600 shadow-sm sm:grid-cols-2">
                {[
                  { id: 'unique', label: 'What is Unique' },
                  { id: 'differentiators', label: 'Key Differentiators' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveUniqueTab(tab.id as 'unique' | 'differentiators')}
                    className={`rounded-md px-4 py-2.5 text-left transition sm:text-center ${
                      activeUniqueTab === tab.id ? 'bg-primary-600 text-white shadow-sm' : 'hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeUniqueTab === 'unique' && (
              <div className="mt-10 grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
                <div>
                <div className="mt-8 rounded-md border border-primary-200 bg-primary-700 p-6 text-white shadow-lg">
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary-100">Scope discipline</p>
                  <h3 className="mt-2 text-2xl font-bold">Payroll and recruitment are not missing. They are intentionally left out.</h3>
                  <p className="mt-3 text-sm leading-6 text-primary-50">
                    For GCCs, SMEs, and startups, this is an advantage. Customers can keep their preferred payroll,
                    ATS, finance, and communication stack while AuroraHR becomes the focused people-operations layer
                    for lifecycle, workflows, documents, collaboration, and reporting.
                  </p>
                </div>
              </div>

                <div className="grid gap-4">
                  {[
                    {
                      title: 'Intuitive by role',
                      description: 'Owners, HR teams, managers, and employees see focused dashboards instead of one overloaded workspace.',
                      icon: UserGroupIcon,
                    },
                    {
                      title: 'Human-centric UX',
                      description: 'The product follows real HR moments: joining, attendance, leave, probation, performance, documents, communication, and exit.',
                      icon: SparklesIcon,
                    },
                    {
                      title: 'Built for GCCs, SMEs, and startups',
                      description: 'The platform supports serious implementation without forcing enterprise-suite complexity on teams that need speed and clarity.',
                      icon: GlobeAltIcon,
                    },
                    {
                      title: 'Co-exists instead of locking customers in',
                      description: 'Leaving payroll and recruitment out of core scope makes integration easier and avoids forcing buyers into one complex HR monolith.',
                      icon: ChatBubbleLeftRightIcon,
                    },
                  ].map((item) => (
                    <div key={item.title} className="grid gap-4 rounded-md border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-[48px_1fr]">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                        <item.icon className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeUniqueTab === 'differentiators' && (
              <div className="mt-10">
                <div className="grid gap-5 lg:grid-cols-3">
                  {differentiators.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/differentiators/${item.id}`)}
                      className="group rounded-md border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg"
                    >
                        <item.icon className="h-7 w-7 text-primary-700" />
                        <h4 className="mt-4 text-lg font-bold leading-tight text-gray-900">{item.title}</h4>
                        <p className="mt-3 line-clamp-4 text-sm leading-6 text-gray-600">{item.description}</p>
                      <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary-700">
                        View differentiator
                        <ArrowRightIcon className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
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

        <section id="contact" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Contact us</p>
              <h2 className="mt-3 text-4xl font-bold text-gray-900">Request a focused AuroraHR conversation.</h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Share your context and a preferred time slot. For now, the enquiry will be routed by email to
                Anupama Bhat while we build the full lead-management admin panel later.
              </p>
              <div className="mt-8 rounded-md border border-primary-100 bg-primary-50 p-5">
                <h3 className="text-base font-bold text-gray-900">Best for</h3>
                <div className="mt-4 grid gap-3 text-sm text-gray-700">
                  {['Western MNCs planning India GCCs', 'Indian SMEs professionalizing HR', 'Startups building HR operating discipline'].map((item) => (
                    <div key={item} className="flex gap-2">
                      <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-none text-success-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="rounded-md border border-gray-200 bg-gray-50 p-5 shadow-sm sm:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-gray-700">
                  Name
                  <input
                    required
                    value={contactForm.name}
                    onChange={(event) => setContactForm((form) => ({ ...form, name: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    placeholder="Your name"
                  />
                </label>
                <label className="text-sm font-semibold text-gray-700">
                  Company
                  <input
                    required
                    value={contactForm.company}
                    onChange={(event) => setContactForm((form) => ({ ...form, company: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    placeholder="Company name"
                  />
                </label>
                <label className="text-sm font-semibold text-gray-700">
                  Work email
                  <input
                    required
                    type="email"
                    value={contactForm.email}
                    onChange={(event) => setContactForm((form) => ({ ...form, email: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    placeholder="name@company.com"
                  />
                </label>
                <label className="text-sm font-semibold text-gray-700">
                  Phone
                  <input
                    value={contactForm.phone}
                    onChange={(event) => setContactForm((form) => ({ ...form, phone: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    placeholder="+91 ..."
                  />
                </label>
                <label className="text-sm font-semibold text-gray-700 md:col-span-2">
                  What are you exploring?
                  <select
                    value={contactForm.interest}
                    onChange={(event) => setContactForm((form) => ({ ...form, interest: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  >
                    <option>GCC launch</option>
                    <option>SME HR operations</option>
                    <option>Startup HR scale-up</option>
                    <option>Product demo</option>
                    <option>Implementation discussion</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-gray-700">
                  Preferred date
                  <input
                    type="date"
                    value={contactForm.preferredDate}
                    onChange={(event) => setContactForm((form) => ({ ...form, preferredDate: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </label>
                <label className="text-sm font-semibold text-gray-700">
                  Preferred time
                  <input
                    type="time"
                    value={contactForm.preferredTime}
                    onChange={(event) => setContactForm((form) => ({ ...form, preferredTime: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </label>
                <label className="text-sm font-semibold text-gray-700 md:col-span-2">
                  Message
                  <textarea
                    value={contactForm.message}
                    onChange={(event) => setContactForm((form) => ({ ...form, message: event.target.value }))}
                    className="mt-2 min-h-28 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    placeholder="Tell us what you want to evaluate, implement, or discuss."
                  />
                </label>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="submit" className="inline-flex items-center justify-center rounded-md bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700">
                  Send enquiry
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 hover:border-primary-300 hover:text-primary-700"
                >
                  Sign Up / Register
                </button>
              </div>
              <p className="mt-4 text-xs leading-5 text-gray-500">
                This temporary form opens an email draft to Anupama.Bhat@acvsolutions.in. Lead capture, analytics, and admin workflows will be added later.
              </p>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white px-4 py-12 text-gray-600 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <img src="/images/AuroraHR_logo.svg?v=20260514b" alt="AuroraHR" className="h-12 w-auto" />
            <p className="mt-4 max-w-md text-sm leading-6 text-gray-600">
              AuroraHR helps organizations launch, operate, and improve HR with strong workflows, role clarity,
              and a practical path from pilot to production.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Platform</h3>
            <div className="mt-3 space-y-2 text-sm">
              <button onClick={() => scrollToSection('platform')} className="block hover:text-primary-700">Capabilities</button>
              <button onClick={() => scrollToSection('journeys')} className="block hover:text-primary-700">User journeys</button>
              <button onClick={() => scrollToSection('unique')} className="block hover:text-primary-700">What is unique</button>
              <button onClick={() => scrollToSection('pricing')} className="block hover:text-primary-700">Pricing</button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Access</h3>
            <div className="mt-3 space-y-2 text-sm">
              <button onClick={() => navigate('/register')} className="block hover:text-primary-700">Register</button>
              <button onClick={() => navigate('/login')} className="block hover:text-primary-700">Login</button>
              <button onClick={requestDemo} className="block hover:text-primary-700">Request demo</button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Audience</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <div>India GCC launch teams</div>
              <div>Indian SMEs</div>
              <div>Scaling startups</div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-gray-200 pt-6 text-sm text-gray-500">
          © 2026 AuroraHR. Illuminate The Journey. Grow Every Person.
        </div>
      </footer>
    </div>
  );
}
