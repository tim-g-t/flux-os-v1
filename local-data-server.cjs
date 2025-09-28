const fs = require('fs');
const http = require('http');
const path = require('path');

const LOCAL_FILE_PATH = '/Users/timtoepper/Downloads/code-of-website/patient-data.json';
const PORT = 5174;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/local-data' && req.method === 'GET') {
    // Try to read the local file
    fs.readFile(LOCAL_FILE_PATH, 'utf8', (err, data) => {
      if (err) {
        // File doesn't exist or can't be read - return 404
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Local file not found' }));
        return;
      }

      // Successfully read the file
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Local data server running on http://localhost:${PORT}`);
  console.log(`Will serve data from: ${LOCAL_FILE_PATH}`);
});