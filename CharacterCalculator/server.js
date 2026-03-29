const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const ROOT_DIRS = [
  path.resolve(__dirname),
  path.resolve(__dirname, '..')
];

const mimeTypes = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.txt': 'text/plain'
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
  const rawUrl = (req.url || '').split('?')[0].split('#')[0];
  const requestPath = rawUrl === '/' ? '/index.html' : rawUrl;
  // Friendly aliases for StoreAssist in local development.
  const normalizedAliasPath = requestPath.replace(/^\/storeassist(?=\/|$)/i, '/StoreAssist');
  const resolvedRequestPath = /^\/StoreAssist$/i.test(normalizedAliasPath)
    ? '/StoreAssist/index.html'
    : normalizedAliasPath;
  const normalizedRequestPath = decodeURIComponent(resolvedRequestPath);

  const candidatePaths = [];
  ROOT_DIRS.forEach(rootDir => {
    const filePath = path.join(rootDir, normalizedRequestPath);
    const realPath = path.resolve(filePath);
    if (realPath.startsWith(rootDir)) {
      candidatePaths.push({ rootDir, filePath, realPath });
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
