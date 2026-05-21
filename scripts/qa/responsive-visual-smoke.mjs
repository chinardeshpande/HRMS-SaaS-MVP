import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:5184';
const SESSION_API_URL = process.env.QA_SESSION_API_URL || BASE_URL;
const OUT_DIR = process.env.QA_OUT_DIR || 'docs/qa/responsive-visual-2026-05-21';
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots');
const QA_AUTH_EMAIL = process.env.QA_AUTH_EMAIL || 'anupama.bhat@acvsolutions.in';
const QA_AUTH_PASSWORD = process.env.QA_AUTH_PASSWORD || 'pass@Manu1120';
const PLAYWRIGHT_IMPORT_PATH =
  process.env.PLAYWRIGHT_IMPORT_PATH ||
  '/Users/chinar.deshpande06/Temp/Chin/2026/chinar-ined-portfolio-v3/node_modules/playwright/index.mjs';
const CHROMIUM_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  '/Users/chinar.deshpande06/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell';

const { chromium } = await import(PLAYWRIGHT_IMPORT_PATH);

const viewports = [
  ['mobile-360', 360, 800],
  ['mobile-390', 390, 844],
  ['mobile-414', 414, 896],
  ['tablet-768', 768, 1024],
  ['tablet-820', 820, 1180],
  ['laptop-1366', 1366, 768],
  ['desktop-1440', 1440, 900],
  ['wide-1920', 1920, 1080],
];

const publicRoutes = [
  ['landing', '/'],
  ['login', '/login'],
  ['register', '/signup'],
  ['forgot-password', '/forgot-password'],
];

const authRoutes = [
  ['dashboard', '/dashboard'],
  ['employees', '/employees'],
  ['attendance', '/attendance'],
  ['leave', '/leave'],
  ['onboarding', '/onboarding'],
  ['performance', '/performance'],
  ['exit', '/exit'],
  ['hr-connect', '/hr-connect'],
  ['reports', '/reports'],
  ['documents', '/documents'],
  ['my-hr-documents', '/my-hr-documents'],
  ['settings', '/settings'],
];

await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

async function createDemoSession() {
  const demoResponse = await fetch(`${SESSION_API_URL}/api/v1/demo/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ persona: 'hr' }),
  });

  if (demoResponse.ok) {
    const body = await demoResponse.json();
    const session = body?.data || body;
    if (!session?.user || !session?.tokens) {
      throw new Error('Demo session response did not include user and tokens');
    }
    return { ...session, source: 'demo' };
  }

  const response = await fetch(`${SESSION_API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: QA_AUTH_EMAIL, password: QA_AUTH_PASSWORD }),
  });

  if (!response.ok) {
    const demoText = await demoResponse.text().catch(() => '');
    throw new Error(
      `Demo session failed (${demoResponse.status}) and auth login failed (${response.status}). Demo response: ${demoText.slice(0, 240)}`
    );
  }

  const body = await response.json();
  const session = body?.data || body;
  if (!session?.user || !session?.tokens) {
    throw new Error('Auth login response did not include user and tokens');
  }

  return { ...session, source: 'auth' };
}

async function installDemoSession(page, session) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate((demoSession) => {
    window.localStorage.setItem('user', JSON.stringify(demoSession.user));
    window.localStorage.setItem('tokens', JSON.stringify(demoSession.tokens));
    window.localStorage.setItem('demoSession', JSON.stringify({ persona: 'hr', startedAt: new Date().toISOString() }));
    window.localStorage.removeItem('auroraDemoJourneyState');
  }, session);
}

async function apiGet(pathName, session) {
  const response = await fetch(`${SESSION_API_URL}/api/v1${pathName}`, {
    headers: {
      authorization: `Bearer ${session.tokens.token}`,
    },
  });
  if (!response.ok) return null;
  const body = await response.json();
  return body?.data || body;
}

const browser = await chromium.launch({
  headless: true,
  executablePath: CHROMIUM_PATH,
});

const results = [];
const demoSession = await createDemoSession();
const employeesResponse = await apiGet('/employees', demoSession);
const firstEmployee =
  (Array.isArray(employeesResponse) ? employeesResponse : employeesResponse?.employees || employeesResponse?.data?.employees || [])
    .find((employee) => employee.employeeId || employee.id);

if (firstEmployee) {
  const employeeId = firstEmployee.employeeId || firstEmployee.id;
  authRoutes.splice(2, 0, ['employee-detail', `/employees/${employeeId}`]);
}

async function capture(page, viewportName, routeName, routePath, kind, errors) {
  const routeErrors = [...errors];
  errors.length = 0;
  try {
    await page.goto(`${BASE_URL}${routePath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => undefined);
    await page.waitForTimeout(750);
  } catch (error) {
    routeErrors.push(error.message);
  }
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${viewportName}-${routeName}.png`),
    fullPage: false,
  });

  const data = await page.evaluate(() => {
    const title = document.title;
    const primaryHeading = document.querySelector('h1,h2')?.textContent?.trim() || '';
    const scrollWidth = document.documentElement.scrollWidth;
    const viewportWidth = window.innerWidth;
    const text = document.body.innerText.slice(0, 700);
    const fixedHeader = document.querySelector('nav,header')?.getBoundingClientRect();
    const visibleText = document.body.innerText;
    const oversizedElements = Array.from(document.querySelectorAll('body *'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string' ? element.className.slice(0, 120) : '',
          text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 90) || '',
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((item) => item.width > window.innerWidth + 2 || item.x < -2 || item.x + item.width > window.innerWidth + 2)
      .slice(0, 12);
    const clippedTextElements = Array.from(document.querySelectorAll('button,a,th,td,label,h1,h2,h3,p,span'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const className = typeof element.className === 'string' ? element.className : '';
        return {
          tag: element.tagName.toLowerCase(),
          className,
          text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 90) || '',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
        };
      })
      .filter((item) => {
        if (!item.text) return false;
        if (item.width <= 2 || item.height <= 2) return false;
        if (/line-clamp|sr-only/.test(item.className)) return false;
        return item.scrollWidth > item.clientWidth + 8 || item.scrollHeight > item.clientHeight + 8;
      })
      .slice(0, 12);

    return {
      title,
      primaryHeading,
      scrollWidth,
      viewportWidth,
      hasHorizontalOverflow: scrollWidth > viewportWidth + 2,
      hasMainContent: visibleText.trim().length > 80,
      hasNotFound: /page not found|404/i.test(visibleText),
      oversizedElements,
      clippedTextElements,
      bodyExcerpt: text,
      header: fixedHeader
        ? {
            x: fixedHeader.x,
            y: fixedHeader.y,
            width: fixedHeader.width,
            height: fixedHeader.height,
          }
        : null,
    };
  });

  results.push({
    viewport: viewportName,
    route: routeName,
    path: routePath,
    kind,
    status:
      data.hasHorizontalOverflow ||
      data.hasNotFound ||
      !data.hasMainContent ||
      data.clippedTextElements.length ||
      routeErrors.length
        ? 'needs-review'
        : 'captured',
    errors: routeErrors,
    ...data,
  });
}

for (const [viewportName, width, height] of viewports) {
  const page = await browser.newPage({
    viewport: { width, height },
    isMobile: viewportName === 'mobile',
  });
  page.setDefaultTimeout(15000);

  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text().slice(0, 300));
    }
  });

  for (const [routeName, routePath] of publicRoutes) {
    await capture(page, viewportName, routeName, routePath, 'public', errors);
  }

  await installDemoSession(page, demoSession);

  for (const [routeName, routePath] of authRoutes) {
    await capture(page, viewportName, routeName, routePath, 'auth-demo', errors);
  }

  await page.close();
}

await browser.close();

await fs.writeFile(path.join(OUT_DIR, 'results.json'), JSON.stringify(results, null, 2));

const summary = {
  target: BASE_URL,
  sessionSource: demoSession.source,
  count: results.length,
  needsReview: results.filter((result) => result.status === 'needs-review').length,
  horizontalOverflow: results
    .filter((result) => result.hasHorizontalOverflow)
    .map((result) => `${result.viewport}:${result.route}`),
  oversizedElements: results
    .filter((result) => result.oversizedElements.length)
    .map((result) => ({ route: `${result.viewport}:${result.route}`, elements: result.oversizedElements })),
  clippedTextElements: results
    .filter((result) => result.clippedTextElements.length)
    .map((result) => ({ route: `${result.viewport}:${result.route}`, elements: result.clippedTextElements })),
  consoleOrPageErrors: results
    .filter((result) => result.errors.length)
    .map((result) => ({ route: `${result.viewport}:${result.route}`, errors: result.errors })),
};

console.log(JSON.stringify(summary, null, 2));

if (summary.needsReview > 0) {
  process.exitCode = 1;
}
