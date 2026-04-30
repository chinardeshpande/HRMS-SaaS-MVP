const baseUrl = (process.env.FRONTEND_SMOKE_BASE_URL || 'https://aurorahr.in').replace(/\/$/, '');

const appShellRoutes = ['/', '/login', '/dashboard', '/my-hr-documents', '/settings'];

async function fetchText(path) {
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  const text = await response.text();

  return { response, text, url };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isAppShell(html) {
  return html.includes('<div id="root"></div>') && /<script[^>]+type=["']module["'][^>]+src=/.test(html);
}

function collectAssetPaths(html) {
  const assets = new Set();
  const patterns = [
    /<script[^>]+src=["']([^"']+)["'][^>]*>/g,
    /<link[^>]+href=["']([^"']+)["'][^>]*>/g,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const asset = match[1];
      if (asset.startsWith('/assets/') || asset.startsWith('/images/')) {
        assets.add(asset);
      }
    }
  }

  return [...assets];
}

async function checkAppShellRoutes() {
  let indexHtml = '';

  for (const route of appShellRoutes) {
    const { response, text, url } = await fetchText(route);
    assert(response.status === 200, `${url} returned ${response.status}`);
    assert(isAppShell(text), `${url} did not return the expected React app shell`);
    console.log(`OK ${response.status} ${route}`);

    if (route === '/') {
      indexHtml = text;
    }
  }

  return indexHtml;
}

async function checkAssets(indexHtml) {
  const assets = collectAssetPaths(indexHtml);
  assert(assets.length > 0, 'No production JS/CSS/image assets found in index HTML');

  for (const asset of assets) {
    const response = await fetch(`${baseUrl}${asset}`);
    const contentType = response.headers.get('content-type') || '';
    const body = await response.arrayBuffer();

    assert(response.status === 200, `${asset} returned ${response.status}`);
    assert(body.byteLength > 0, `${asset} returned an empty body`);

    if (asset.endsWith('.js')) {
      assert(contentType.includes('javascript'), `${asset} content-type was ${contentType}`);
    }

    if (asset.endsWith('.css')) {
      assert(contentType.includes('text/css'), `${asset} content-type was ${contentType}`);
    }

    console.log(`OK ${response.status} ${asset}`);
  }
}

async function main() {
  const indexHtml = await checkAppShellRoutes();
  await checkAssets(indexHtml);
}

main().catch((error) => {
  console.error('FRONTEND_SMOKE_ERROR', error.message || error);
  process.exitCode = 1;
});
