import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:5184';
const SESSION_API_URL = process.env.QA_SESSION_API_URL || BASE_URL;
const OUT_DIR = process.env.QA_OUT_DIR || 'docs/qa/responsive-polish-2026-05-19';
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots');
const PLAYWRIGHT_IMPORT_PATH =
  process.env.PLAYWRIGHT_IMPORT_PATH ||
  '/Users/chinar.deshpande06/Temp/Chin/2026/chinar-ined-portfolio-v3/node_modules/playwright/index.mjs';
const CHROMIUM_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  '/Users/chinar.deshpande06/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell';

const { chromium } = await import(PLAYWRIGHT_IMPORT_PATH);

const viewports = [
  ['mobile', 390, 844],
  ['tablet', 768, 1024],
  ['desktop', 1440, 900],
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
  ['hr-connect', '/hr-connect'],
  ['reports', '/reports'],
  ['documents', '/documents'],
  ['settings', '/settings'],
];

await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

async function createDemoSession() {
  const response = await fetch(`${SESSION_API_URL}/api/v1/demo/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ persona: 'hr' }),
  });

  if (!response.ok) {
    throw new Error(`Demo session request failed: ${response.status} ${response.statusText}`);
  }

  const body = await response.json();
  const session = body?.data || body;
  if (!session?.user || !session?.tokens) {
    throw new Error('Demo session response did not include user and tokens');
  }

  return session;
}

async function installDemoSession(page, session) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate((demoSession) => {
    window.localStorage.setItem('user', JSON.stringify(demoSession.user));
    window.localStorage.setItem('tokens', JSON.stringify(demoSession.tokens));
    window.localStorage.setItem(
      'demoSession',
      JSON.stringify({ persona: 'hr', startedAt: new Date().toISOString() })
    );
    window.localStorage.removeItem('auroraDemoJourneyState');
  }, session);
}

const browser = await chromium.launch({
  headless: true,
  executablePath: CHROMIUM_PATH,
});

const results = [];
const demoSession = await createDemoSession();

async function capture(page, viewportName, routeName, routePath, kind, errors) {
  await page.goto(`${BASE_URL}${routePath}`, { waitUntil: 'networkidle', timeout: 30000 });
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

    return {
      title,
      primaryHeading,
      scrollWidth,
      viewportWidth,
      hasHorizontalOverflow: scrollWidth > viewportWidth + 2,
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
    status: data.hasHorizontalOverflow || errors.length ? 'needs-review' : 'captured',
    errors: [...errors],
    ...data,
  });
  errors.length = 0;
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
  count: results.length,
  needsReview: results.filter((result) => result.status === 'needs-review').length,
  horizontalOverflow: results
    .filter((result) => result.hasHorizontalOverflow)
    .map((result) => `${result.viewport}:${result.route}`),
  consoleOrPageErrors: results
    .filter((result) => result.errors.length)
    .map((result) => ({ route: `${result.viewport}:${result.route}`, errors: result.errors })),
};

console.log(JSON.stringify(summary, null, 2));

if (summary.needsReview > 0) {
  process.exitCode = 1;
}
