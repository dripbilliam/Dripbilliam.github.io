const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8000;
const ROOT_DIRS = [
  path.resolve(__dirname)
];

const ACCESS_CONTROL_CONFIG_PATH = path.resolve(__dirname, 'access-control.json');

const loadAccessControlConfig = () => {
  try {
    return require(ACCESS_CONTROL_CONFIG_PATH) || {};
  } catch (err) {
    console.warn(`[access-control] Failed to load ${ACCESS_CONTROL_CONFIG_PATH}: ${err.message}`);
    return {};
  }
};

const loadMapAllowedIps = () => {
  const envAllowlist = process.env.IP_ALLOWLIST || process.env.MAP_IP_ALLOWLIST;
  if (envAllowlist) {
    return envAllowlist
      .split(',')
      .map(ip => ip.trim())
      .filter(Boolean);
  }

  const accessControlConfig = loadAccessControlConfig();
  if (Array.isArray(accessControlConfig?.ipAllowlist)) {
    return accessControlConfig.ipAllowlist
      .map(ip => String(ip).trim())
      .filter(Boolean);
  }

  return ['24.79.236.17', '127.0.0.1', '::1'];
};

const MAP_ALLOWED_IPS = new Set(
  loadMapAllowedIps()
);

const normalizeClientIp = (value) => {
  if (!value) {
    return '';
  }

  let ip = String(value).trim();

  if (ip.startsWith('[') && ip.includes(']')) {
    ip = ip.slice(1, ip.indexOf(']'));
  }

  if (ip.includes(':') && ip.includes('.') && ip.lastIndexOf(':') > ip.lastIndexOf('.')) {
    ip = ip.slice(0, ip.lastIndexOf(':'));
  }

  if (ip.startsWith('::ffff:')) {
    ip = ip.slice('::ffff:'.length);
  }

  return ip;
};

const getClientIps = (req) => {
  const ips = [];
  const forwardedFor = req.headers['x-forwarded-for'];

  if (forwardedFor) {
    String(forwardedFor)
      .split(',')
      .map(value => normalizeClientIp(value))
      .filter(Boolean)
      .forEach(value => ips.push(value));
  }

  const remoteAddress = normalizeClientIp(req.socket?.remoteAddress || req.connection?.remoteAddress || '');
  if (remoteAddress) {
    ips.push(remoteAddress);
  }

  return ips;
};

const isMapRequest = (requestPath) => /^\/map(?:\/|$)/i.test(requestPath);

const isAllowedMapIp = (req) => getClientIps(req).some(ip => MAP_ALLOWED_IPS.has(ip));

const mimeTypes = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL and strip query/hash
  const fullUrl = req.url || '';
  const queryIndex = fullUrl.indexOf('?');
  const queryPart = queryIndex >= 0 ? fullUrl.slice(queryIndex) : '';
  const rawUrl = fullUrl.split('?')[0].split('#')[0];
  const requestPath = rawUrl === '/' ? '/index.html' : rawUrl;

  if (isMapRequest(requestPath) && !isAllowedMapIp(req)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Friendly aliases for StoreAssist in local development.
  const normalizedAliasPath = requestPath.replace(/^\/storeassist(?=\/|$)/i, '/StoreAssist');
  const resolvedRequestPath = /^\/StoreAssist$/i.test(normalizedAliasPath)
    ? '/StoreAssist/index.html'
    : normalizedAliasPath;
  const normalizedRequestPath = decodeURIComponent(resolvedRequestPath);

  const candidatePaths = [];

  const addCandidatePath = (rootDir, relativePath) => {
    const safeRelativePath = String(relativePath || '').replace(/^[/\\]+/, '');
    const filePath = path.join(rootDir, safeRelativePath);
    const realPath = path.resolve(filePath);
    if (realPath.startsWith(rootDir)) {
      candidatePaths.push({ rootDir, filePath, realPath });
    }
  };

  const requestLooksLikeDirectory =
    normalizedRequestPath.endsWith('/') || !path.extname(normalizedRequestPath);

  // Ensure directory URLs end with a trailing slash so relative asset paths resolve correctly.
  if (requestLooksLikeDirectory && !normalizedRequestPath.endsWith('/')) {
    const location = `${resolvedRequestPath}/${queryPart}`;
    res.writeHead(301, { Location: location });
    res.end();
    return;
  }

  ROOT_DIRS.forEach(rootDir => {
    addCandidatePath(rootDir, normalizedRequestPath);

    if (requestLooksLikeDirectory) {
      const indexPath = normalizedRequestPath.endsWith('/')
        ? `${normalizedRequestPath}index.html`
        : `${normalizedRequestPath}/index.html`;
      addCandidatePath(rootDir, indexPath);
    }
  });

  const tryRead = (index) => {
    if (index >= candidatePaths.length) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + req.url);
      return;
    }

    const candidate = candidatePaths[index];
    fs.readFile(candidate.filePath, (err, data) => {
      if (err) {
        tryRead(index + 1);
        return;
      }

      const ext = path.extname(candidate.filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': data.length
      });
      res.end(data);
    });
  };

  tryRead(0);
});

// Set higher timeout limits for large files
server.timeout = 30000; // 30 seconds
server.keepAliveTimeout = 30000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Press Ctrl+C to stop`);
});
