import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  Bars3Icon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  GlobeAltIcon,
  LockClosedIcon,
  SparklesIcon,
  UserGroupIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { brand } from "../config/brand";
import { adoptionJourneys } from "../data/adoptionJourneys";
import { differentiators } from "../data/differentiators";
import { platformPillars } from "../data/platformPillars";
import "./LandingPage.css";

const navItems = [
  ["Product tour", "modules"],
  ["Platform", "platform"],
  ["Uniqueness", "unique"],
  ["Ease of adoption", "adoption"],
  ["Who it’s for", "people"],
  ["Contact", "contact"],
] as const;

const features = [
  {
    icon: UserGroupIcon,
    route: "/features/employee-management",
    title: "One employee story",
    copy: "A living record for every person—from joining and probation to performance, documents, mobility, and exit.",
  },
  {
    icon: ClockIcon,
    route: "/features/attendance",
    title: "Everyday work, simplified",
    copy: "Attendance, leave, approvals, and exceptions designed around the way Indian teams actually operate.",
  },
  {
    icon: ChatBubbleLeftRightIcon,
    route: "/features/hr-connect",
    title: "HR that stays connected",
    copy: "Announcements, conversations, helpdesk requests, and people moments in one familiar workspace.",
  },
  {
    icon: ChartBarIcon,
    route: "/features/dashboard",
    title: "Clarity for leaders",
    copy: "Operational dashboards and trustworthy records that turn scattered HR activity into confident decisions.",
  },
];

const audiences = [
  {
    id: "india-gccs",
    eyebrow: "Build",
    title: "India GCCs",
    copy: "Stand up a strong people-operations foundation without inheriting enterprise-suite complexity.",
  },
  {
    id: "indian-smes",
    eyebrow: "Modernise",
    title: "Indian SMEs",
    copy: "Move beyond spreadsheets with clean records, approvals, documents, and role clarity.",
  },
  {
    id: "growing-teams",
    eyebrow: "Scale",
    title: "Growing teams",
    copy: "Add the right structure early while keeping the employee experience fast and friendly.",
  },
];

const modules = [
  {
    id: "dashboard",
    label: "Command centre",
    eyebrow: "Role-aware dashboards",
    title: "Start every day with the right priorities in view.",
    copy: "AuraHR brings workforce signals, approvals, upcoming people moments, and recent activity together—shaped around what each role needs to see and do next.",
    image: "/images/Product-Screenshots/latest/dashboard.png",
    points: ["Workforce overview", "Pending approvals", "Upcoming milestones"],
  },
  {
    id: "attendance",
    label: "Time & attendance",
    eyebrow: "Everyday operations",
    title: "Turn daily attendance into a clean operating rhythm.",
    copy: "Track presence, exceptions, late arrivals, leave, and work hours from a single company view—with the controls HR teams need for mass actions, sync, and export.",
    image: "/images/Product-Screenshots/latest/attendance.png",
    points: ["Daily company view", "Exception management", "Bulk HR actions"],
  },
  {
    id: "leave",
    label: "Leave",
    eyebrow: "Employee self-service",
    title: "Make leave balances and approvals effortless to understand.",
    copy: "Employees see their balances clearly. Managers get team context. HR can govern company-wide requests and policy outcomes without losing the human thread.",
    image: "/images/Product-Screenshots/latest/leave.png",
    points: ["Live balances", "Manager approvals", "Policy visibility"],
  },
  {
    id: "performance",
    label: "Performance",
    eyebrow: "Growth with accountability",
    title: "Connect goals, evidence, reviews, and development.",
    copy: "Run structured cycles from goal-setting through development planning, with weighted goals, measurable KPIs, progress signals, and a visible review journey.",
    image: "/images/Product-Screenshots/latest/performance.png",
    points: ["Goals and KPIs", "Review cycles", "Development plans"],
  },
  {
    id: "lifecycle",
    label: "Lifecycle",
    eyebrow: "One employee story",
    title: "Preserve the context behind every people decision.",
    copy: "Joining, probation, movements, compensation, performance, documents, and exit become one continuous, auditable employee history—not disconnected transactions.",
    image: "/images/Product-Screenshots/latest/employee-register.png",
    points: [
      "Employee 360°",
      "Timeline-led journeys",
      "Document-backed events",
    ],
  },
  {
    id: "connect",
    label: "HR Connect",
    eyebrow: "A connected workplace",
    title: "Bring communication and HR service into the flow of work.",
    copy: "Give teams a shared space for announcements, conversations, groups, appointments, and helpdesk cases—without separating communication from employee context.",
    image: "/images/Product-Screenshots/latest/hr-connect.png",
    points: ["Company feed", "Contextual chat", "HR helpdesk"],
  },
  {
    id: "manu",
    label: "Meet Manu",
    eyebrow: "The AI of AuraHR",
    title: "Intelligence inside the work—not a chatbot beside HR.",
    copy: "Manu understands the screen you are on, the role you hold, and the company context you are allowed to see. She helps people find answers, understand workflows, retrieve evidence, and prepare thoughtful drafts without stepping around trusted HR controls.",
    image: "/images/Product-Screenshots/latest/manu-assistant.png",
    points: ["Permission-aware", "Tenant-safe", "Evidence-led"],
  },
];

const capabilityStories = [
  {
    id: "governed-documents",
    eyebrow: "Governed documents",
    title: "Keep workforce evidence organized and ready.",
    copy: "Company policies and employee records live in a structured library with ownership, verification, expiry, preview, and download controls.",
    image: "/images/Product-Screenshots/latest/document-library.png",
  },
  {
    id: "lifecycle-workflows",
    eyebrow: "Lifecycle workflows",
    title: "Guide every new joiner from offer to impact.",
    copy: "Onboarding keeps candidate details, joining readiness, task ownership, documents, and day-one progress visible in one shared flow.",
    image: "/images/Product-Screenshots/latest/onboarding.png",
  },
  {
    id: "people-intelligence",
    eyebrow: "People intelligence",
    title: "Turn HR activity into leadership clarity.",
    copy: "Role-aware analytics bring workforce signals, trends, and operational priorities together without spreadsheet archaeology.",
    image: "/images/Product-Screenshots/latest/analytics.png",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeModule, setActiveModule] = useState(modules[0]);
  const [contact, setContact] = useState({
    name: "",
    company: "",
    email: "",
    message: "",
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const routeState = location.state as { scrollTo?: string } | null;
    const target = routeState?.scrollTo || location.hash.replace("#", "");
    if (!target) return;
    window.setTimeout(() => scrollTo(target), 100);
  }, [location.hash, location.state]);

  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  const showModule = (id: string) => {
    const module = modules.find((item) => item.id === id);
    if (module) setActiveModule(module);
    scrollTo("modules");
  };

  const submitContact = (event: FormEvent) => {
    event.preventDefault();
    const body = `Hi Anupama,\n\nI would like to explore AuraHR.\n\nName: ${contact.name}\nCompany: ${contact.company}\nEmail: ${contact.email}\n\n${contact.message}`;
    window.location.href = `mailto:Anupama.Bhat@acvsolutions.in?subject=${encodeURIComponent(`AuraHR enquiry — ${contact.company}`)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="aura-site">
      <nav
        className={`aura-nav ${scrolled ? "aura-nav--scrolled" : ""}`}
        aria-label="Main navigation"
      >
        <div className="aura-shell aura-nav__inner">
          <button
            className="aura-lockup"
            onClick={() => scrollTo("top")}
            aria-label="AuraHR home"
          >
            <img src={brand.mark} alt="" />
            <span>
              Aura<span>HR</span>
            </span>
          </button>
          <div className="aura-nav__links">
            {navItems.map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="aura-nav__actions">
            <button
              className="aura-text-button"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
            <button
              className="aura-button aura-button--small"
              onClick={() => scrollTo("contact")}
            >
              Book a walkthrough
            </button>
          </div>
          <button
            className="aura-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            {menuOpen ? <XMarkIcon /> : <Bars3Icon />}
          </button>
        </div>
        {menuOpen && (
          <div className="aura-mobile-menu">
            {navItems.map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}>
                {label}
              </button>
            ))}
            <button onClick={() => navigate("/login")}>Sign in</button>
          </div>
        )}
      </nav>

      <header id="top" className="aura-hero">
        <div className="aura-orb aura-orb--one" />
        <div className="aura-orb aura-orb--two" />
        <div className="aura-shell aura-hero__grid">
          <div className="aura-hero__copy">
            <div className="aura-kicker">
              <SparklesIcon /> People operations, beautifully clear
            </div>
            <h1>
              Your people. Their journeys. <em>One beautiful workspace.</em>
            </h1>
            <p>
              AuraHR brings employee journeys, everyday operations, documents,
              and collaboration into one calm, connected workspace—built for
              ambitious teams in India.
            </p>
            <div className="aura-hero__actions">
              <button
                className="aura-button"
                onClick={() => scrollTo("contact")}
              >
                See AuraHR in action <ArrowRightIcon />
              </button>
              <button
                className="aura-button aura-button--ghost"
                onClick={() => showModule("manu")}
              >
                Meet Manu, our AI
              </button>
            </div>
            <div className="aura-trust-row">
              <span>
                <CheckCircleIcon /> Human-centred by design
              </span>
              <span>
                <FingerPrintIcon /> Tenant-safe
              </span>
              <span>
                <DocumentTextIcon /> Audit-ready records
              </span>
            </div>
          </div>
          <div
            className="aura-product-stage"
            aria-label="AuraHR product preview"
          >
            <div className="aura-stage__glow" />
            <div className="aura-browser">
              <div className="aura-browser__bar">
                <i />
                <i />
                <i />
                <span>app.aurahrms.com</span>
              </div>
              <img
                src="/images/Product-Screenshots/latest/dashboard.png"
                alt="AuraHR role-aware dashboard"
              />
            </div>
            <div className="aura-float-card aura-float-card--top">
              <span className="aura-float-icon">
                <CheckCircleIcon />
              </span>
              <div>
                <b>Lifecycle complete</b>
                <small>Probation milestone recorded</small>
              </div>
            </div>
            <div className="aura-float-card aura-float-card--bottom">
              <span className="aura-avatars">
                <i>A</i>
                <i>R</i>
                <i>S</i>
              </span>
              <div>
                <b>One connected team</b>
                <small>HR · Managers · Employees</small>
              </div>
            </div>
          </div>
        </div>
        <div className="aura-shell aura-hero__foot">
          <span>Made for the moments that matter</span>
          <div />
          <span>Onboard</span>
          <span>Support</span>
          <span>Grow</span>
          <span>Celebrate</span>
        </div>
      </header>

      <main>
        <section id="product" className="aura-section aura-product">
          <div className="aura-shell">
            <div className="aura-section-heading">
              <span>The AuraHR platform</span>
              <h2>
                Everything your people team needs.
                <br />
                Nothing it doesn’t.
              </h2>
              <p>
                Purposeful tools, connected by a single employee story and a
                design language people enjoy using.
              </p>
            </div>
            <div className="aura-feature-grid">
              {features.map(({ icon: Icon, route, title, copy }, index) => (
                <button key={title} className="aura-feature-card" onClick={() => navigate(route)}>
                  <div
                    className={`aura-feature-icon aura-feature-icon--${index + 1}`}
                  >
                    <Icon />
                  </div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <span className="aura-feature-card__link">
                    Discover more <ArrowRightIcon />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="aura-section aura-platform-depth">
          <div className="aura-shell">
            <div className="aura-section-heading aura-section-heading--left">
              <span>The platform beneath the experience</span>
              <h2>The HR foundation for a company ready to operate.</h2>
              <p>
                AuraHR is not a collection of disconnected forms. It brings
                implementation, human workflows, operational depth, and
                leadership visibility into one accountable operating layer.
              </p>
            </div>
            <div className="aura-platform-map" aria-label="AuraHR platform pillars">
              <div className="aura-platform-map__core">
                <img src={brand.reversedMark} alt="" />
                <strong>AuraHR</strong>
                <span>One employee story</span>
              </div>
              {platformPillars.map((pillar, index) => {
                const Icon = pillar.icon;
                return (
                  <button
                    key={pillar.id}
                    className={`aura-platform-node aura-platform-node--${index + 1}`}
                    onClick={() => navigate(`/platform/${pillar.id}`)}
                  >
                    <span><Icon /></span>
                    <b>{pillar.title}</b>
                    <small>{pillar.description}</small>
                    <em>Explore pillar <ArrowRightIcon /></em>
                  </button>
                );
              })}
            </div>
            <div className="aura-depth-strip">
              <div>
                <strong>A working HR operating layer</strong>
                <span>Registration · employee records · attendance · leave · lifecycle · collaboration · reports</span>
              </div>
              <div>
                {["Owner implementation console", "Role-aware workspaces", "Production-ready tenancy"].map((item) => (
                  <span key={item}><CheckCircleIcon /> {item}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="aura-section aura-modules">
          <div id="modules" className="aura-shell aura-modules__content">
            <div className="aura-section-heading aura-section-heading--left">
              <span>See AuraHR at work</span>
              <h2 className="aura-modules__title">Designed around real HR moments.</h2>
              <p>
                Explore the connected modules that turn day-to-day people
                operations into calm, accountable journeys.
              </p>
            </div>
            <div
              className="aura-module-tabs"
              role="tablist"
              aria-label="AuraHR modules"
            >
              {modules.map((module) => (
                <button
                  key={module.id}
                  role="tab"
                  aria-selected={activeModule.id === module.id}
                  onClick={() => setActiveModule(module)}
                >
                  {module.label}
                </button>
              ))}
            </div>
            <div className="aura-module-stage">
              <div className="aura-module-copy">
                <span className="aura-eyebrow">{activeModule.eyebrow}</span>
                <h3>{activeModule.title}</h3>
                <p>{activeModule.copy}</p>
                <ul>
                  {activeModule.points.map((point) => (
                    <li key={point}>
                      <CheckCircleIcon />
                      {point}
                    </li>
                  ))}
                </ul>
                <button
                  className="aura-button aura-button--ghost"
                  onClick={() => scrollTo("contact")}
                >
                  Explore this journey <ArrowRightIcon />
                </button>
              </div>
              <div className="aura-module-screen" key={activeModule.id}>
                <div className="aura-module-screen__bar">
                  <i />
                  <i />
                  <i />
                  <span>{activeModule.label}</span>
                </div>
                <img
                  src={activeModule.image}
                  alt={`${activeModule.label} in AuraHR`}
                />
              </div>
            </div>
            <p className="aura-demo-note">
              <SparklesIcon /> Product views use representative demo data. Your
              AuraHR workspace is configured around your organization, roles,
              and policies.
            </p>
          </div>
        </section>

        <section id="unique" className="aura-section aura-unique">
          <div className="aura-shell">
            <div className="aura-unique__hero">
              <div className="aura-unique__image">
                <img
                  src="/images/Hero-Images/hero-team-collaboration.jpg"
                  alt="A collaborative people team at work"
                />
                <div className="aura-unique__quote">
                  <SparklesIcon />
                  <span>Built around how HR actually happens—not around software menus.</span>
                </div>
              </div>
              <div className="aura-unique__copy">
                <span className="aura-eyebrow">What makes AuraHR different</span>
                <h2>Serious operational depth, with a genuinely human interface.</h2>
                <p>
                  Employees request. Managers approve. HR resolves exceptions.
                  Leadership reviews outcomes. AuraHR gives each role the right
                  context while preserving one connected record underneath.
                </p>
            <div className="aura-trust-stack">
                  <button onClick={() => navigate('/stories/authentic-multi-tenancy')}><FingerPrintIcon /><span><b>Authentic multi-tenancy</b><small>Company records and demo journeys remain safely separated.</small></span><ArrowRightIcon /></button>
                  <button onClick={() => navigate('/stories/role-based-experience')}><UserPlusIcon /><span><b>Role-based experience</b><small>Focused workspaces for owners, HR, managers, and employees.</small></span><ArrowRightIcon /></button>
                  <button onClick={() => navigate('/stories/trust-by-design')}><LockClosedIcon /><span><b>Trust by design</b><small>Account flows, evidence, ownership, and audit context are product-critical.</small></span><ArrowRightIcon /></button>
                </div>
              </div>
            </div>
            <div className="aura-differentiator-grid">
              {differentiators.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => navigate(`/differentiators/${item.id}`)}>
                    <span><Icon /></span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <em>See why it matters <ArrowRightIcon /></em>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section id="adoption" className="aura-section aura-adoption">
          <div className="aura-shell">
            <div className="aura-section-heading">
              <span>Ease of adoption</span>
              <h2>From first visit to mature HR operations.</h2>
              <p>
                A clear implementation path makes adoption feel natural:
                register, configure, migrate, operate, train safely, and scale.
              </p>
            </div>
            <div className="aura-adoption-path" aria-label="AuraHR adoption journey">
              {adoptionJourneys.map((journey, index) => {
                const Icon = journey.icon;
                return (
                  <button key={journey.id} onClick={() => navigate(`/journeys/${journey.id}`)}>
                    <span className="aura-adoption-path__number">0{index + 1}</span>
                    <span className="aura-adoption-path__icon"><Icon /></span>
                    <b>{journey.shortTitle}</b>
                    <small>{journey.description}</small>
                    <em>Open journey <ArrowRightIcon /></em>
                  </button>
                );
              })}
            </div>
            <div className="aura-adoption-story">
              <div>
                <span className="aura-eyebrow">Adoption confidence</span>
                <h3>Train with good data. Go live with clarity.</h3>
                <p>
                  AuraHR’s curated demo workspace lets buyers, leaders, HR
                  teams, managers, and employees learn complete journeys
                  without touching live company records.
                </p>
                <button className="aura-button aura-button--ghost" onClick={() => navigate("/journeys/demo-and-training")}>Explore demo-led adoption <ArrowRightIcon /></button>
              </div>
              <img src="/images/Hero-Images/hero-employee-onboarding.jpg" alt="A new employee being welcomed by colleagues" />
            </div>
          </div>
        </section>

        <section id="capabilities" className="aura-section aura-capabilities">
          <div className="aura-shell">
            <div className="aura-section-heading">
              <span>More than a system of record</span>
              <h2>One workspace. The full people-operations story.</h2>
              <p>
                From workforce evidence to onboarding and leadership insight,
                AuraHR keeps every important moment connected to the people it
                serves.
              </p>
            </div>
            <div className="aura-capability-grid">
              {capabilityStories.map((story) => (
                <button key={story.title} onClick={() => navigate(`/stories/${story.id}`)}>
                  <div className="aura-capability-screen">
                    <img src={story.image} alt={`${story.eyebrow} in AuraHR`} />
                  </div>
                  <div className="aura-capability-copy">
                    <span className="aura-eyebrow">{story.eyebrow}</span>
                    <h3>{story.title}</h3>
                    <p>{story.copy}</p>
                    <span className="aura-card-link">Explore capability <ArrowRightIcon /></span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="people" className="aura-section aura-people-story">
          <div className="aura-shell">
            <div className="aura-people-story__grid">
              <div className="aura-people-story__copy">
                <span className="aura-eyebrow">Built for ambitious teams</span>
                <h2>Technology that supports the people behind the work.</h2>
                <p>
                  Western MNCs building India GCCs, Indian SMEs
                  professionalizing HR, and new-age teams scaling quickly all
                  need the same thing: enough structure to inspire confidence,
                  without losing warmth or speed.
                </p>
                <button className="aura-button" onClick={() => scrollTo("contact")}>Plan your AuraHR journey <ArrowRightIcon /></button>
              </div>
              <div className="aura-people-collage">
                <img src="/images/Hero-Images/hero-leadership.jpg" alt="Leadership team reviewing people operations" />
                <img src="/images/Hero-Images/hero-happy-employees.jpg" alt="Employees collaborating in a modern workplace" />
                <div><GlobeAltIcon /><b>Global governance</b><span>Local operating clarity</span></div>
                <div><BuildingOffice2Icon /><b>Practical adoption</b><span>Built for real HR teams</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="aura-section aura-showcase">
          <div className="aura-shell aura-showcase__grid">
            <div className="aura-showcase__copy">
              <span className="aura-eyebrow">One source of truth</span>
              <h2>Every employee journey, visible at a glance.</h2>
              <p>
                AuraHR turns milestones, performance moments, and changes into
                an elegant timeline. Teams get context. Employees get
                continuity. Leaders get confidence.
              </p>
              <ul>
                <li>
                  <CheckCircleIcon />
                  Complete employee 360° view
                </li>
                <li>
                  <CheckCircleIcon />
                  Document-backed lifecycle events
                </li>
                <li>
                  <CheckCircleIcon />
                  Clear ownership and audit trails
                </li>
              </ul>
              <button className="aura-button aura-button--ghost" onClick={() => navigate('/features/probation')}>
                Explore lifecycle visibility <ArrowRightIcon />
              </button>
            </div>
            <div className="aura-showcase__screen">
              <img
                src="/images/Product-Screenshots/latest/probation.png"
                alt="Probation management journey in AuraHR"
              />
            </div>
          </div>
        </section>

        <section id="why" className="aura-section aura-why">
          <div className="aura-shell aura-why__grid">
            <div className="aura-why__visual">
              <div className="aura-ring">
                <span>
                  <img src={brand.reversedMark} alt="" />
                </span>
                <i>Clarity</i>
                <i>Care</i>
                <i>Control</i>
              </div>
            </div>
            <div className="aura-why__copy">
              <span className="aura-eyebrow aura-eyebrow--light">
                Why AuraHR
              </span>
              <h2>
                Serious HR operations.
                <br />A genuinely human experience.
              </h2>
              <p>
                Most systems make people adapt to software. AuraHR does the
                reverse: focused role-based spaces, familiar journeys, and
                thoughtful details that make adoption feel natural.
              </p>
              <div className="aura-metric-grid">
                <button onClick={() => navigate('/stories/authentic-multi-tenancy')}>
                  <strong>One</strong>
                  <span>connected people workspace</span>
                </button>
                <button onClick={() => navigate('/stories/role-based-experience')}>
                  <strong>Every</strong>
                  <span>role gets a focused view</span>
                </button>
                <button onClick={() => navigate('/stories/trust-by-design')}>
                  <strong>Zero</strong>
                  <span>need for HR-suite clutter</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className="aura-section aura-journeys">
          <div className="aura-shell">
            <div className="aura-section-heading">
              <span>One platform, four clear perspectives</span>
              <h2>
                Focused for every role.
                <br />
                Connected for the whole company.
              </h2>
            </div>
            <div className="aura-journey-grid">
              <button onClick={() => navigate('/stories/employees')}>
                <span>01</span>
                <h3>Employees</h3>
                <p>
                  Self-service, documents, leave, attendance, conversations,
                  goals, and personal milestones—without HR dependency.
                </p>
                <span className="aura-card-link">Explore employee experience <ArrowRightIcon /></span>
              </button>
              <button onClick={() => navigate('/stories/managers')}>
                <span>02</span>
                <h3>Managers</h3>
                <p>
                  Team context, approvals, performance conversations, probation
                  decisions, and actions that never lose their owner.
                </p>
                <span className="aura-card-link">Explore manager experience <ArrowRightIcon /></span>
              </button>
              <button onClick={() => navigate('/stories/hr-teams')}>
                <span>03</span>
                <h3>HR teams</h3>
                <p>
                  Governed records, workflows, exceptions, communication,
                  templates, cases, and audit-ready operational control.
                </p>
                <span className="aura-card-link">Explore HR experience <ArrowRightIcon /></span>
              </button>
              <button onClick={() => navigate('/stories/leadership')}>
                <span>04</span>
                <h3>Leadership</h3>
                <p>
                  Reliable workforce signals, organizational memory, readiness
                  views, and clarity without spreadsheet archaeology.
                </p>
                <span className="aura-card-link">Explore leadership view <ArrowRightIcon /></span>
              </button>
            </div>
          </div>
        </section>

        <section id="teams" className="aura-section aura-teams">
          <div className="aura-shell">
            <div className="aura-section-heading aura-section-heading--left">
              <span>Built for your next chapter</span>
              <h2>Start strong. Grow with clarity.</h2>
            </div>
            <div className="aura-audience-grid">
              {audiences.map((item, index) => (
                <button key={item.title} onClick={() => navigate(`/stories/${item.id}`)}>
                  <span>
                    0{index + 1} · {item.eyebrow}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                  <ArrowRightIcon />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="aura-section aura-contact">
          <div className="aura-shell aura-contact__panel">
            <div>
              <span className="aura-eyebrow aura-eyebrow--light">
                Let’s talk people
              </span>
              <h2>See what clearer HR feels like.</h2>
              <p>
                Tell us where your team is today. We’ll show you how AuraHR can
                help you build a more connected tomorrow.
              </p>
              <div className="aura-contact__note">
                <SparklesIcon />
                <span>
                  <b>A focused, practical walkthrough</b>
                  <small>
                    No generic sales deck. We’ll discuss your real HR journeys.
                  </small>
                </span>
              </div>
            </div>
            <form onSubmit={submitContact}>
              <label>
                Your name
                <input
                  required
                  value={contact.name}
                  onChange={(e) =>
                    setContact({ ...contact, name: e.target.value })
                  }
                  placeholder="Your name"
                />
              </label>
              <label>
                Company
                <input
                  required
                  value={contact.company}
                  onChange={(e) =>
                    setContact({ ...contact, company: e.target.value })
                  }
                  placeholder="Company name"
                />
              </label>
              <label className="aura-form-wide">
                Work email
                <input
                  required
                  type="email"
                  value={contact.email}
                  onChange={(e) =>
                    setContact({ ...contact, email: e.target.value })
                  }
                  placeholder="you@company.com"
                />
              </label>
              <label className="aura-form-wide">
                What would you like to improve?
                <textarea
                  value={contact.message}
                  onChange={(e) =>
                    setContact({ ...contact, message: e.target.value })
                  }
                  placeholder="Tell us a little about your team…"
                />
              </label>
              <button className="aura-button aura-form-wide" type="submit">
                Book my walkthrough <ArrowRightIcon />
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="aura-footer">
        <div className="aura-shell aura-footer__inner">
          <div>
            <div className="aura-lockup aura-lockup--light">
              <img src={brand.reversedMark} alt="" />
              <span>
                Aura<span>HR</span>
              </span>
            </div>
            <p>People operations. Humanly intelligent.</p>
          </div>
          <div>
            <b>Product</b>
            <button onClick={() => scrollTo("product")}>Platform</button>
            <button onClick={() => scrollTo("why")}>Why AuraHR</button>
          </div>
          <div>
            <b>Company</b>
            <button onClick={() => scrollTo("contact")}>Contact</button>
            <button onClick={() => navigate("/login")}>Customer sign in</button>
          </div>
        </div>
        <div className="aura-shell aura-footer__bottom">
          <span>© 2026 AuraHR by ACV Solutions</span>
          <span>Clarity for every people journey.</span>
        </div>
      </footer>
    </div>
  );
}
