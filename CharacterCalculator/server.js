const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

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

  // Parse URL
  let filePath = req.url === '/' ? '/characterPlanner.html' : req.url;
  filePath = path.join(__dirname, filePath);

  // Prevent directory traversal
  const realPath = path.resolve(filePath);
  const realDir = path.resolve(__dirname);
  if (!realPath.startsWith(realDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + req.url);
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Content-Length': data.length
    });
    res.end(data);
  });
});

// Set higher timeout limits for large files
server.timeout = 30000; // 30 seconds
server.keepAliveTimeout = 30000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Press Ctrl+C to stop`);
});
