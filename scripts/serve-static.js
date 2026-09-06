import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT ?? 4173);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

createServer((request, response) => {
  const requestPath = request.url?.split('?')[0] ?? '/';
  const relativePath = requestPath === '/' ? 'public/index.html' : requestPath.replace(/^\//, '');
  const path = normalize(join(root, relativePath));

  if (!path.startsWith(root) || !existsSync(path) || statSync(path).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, { 'Content-Type': contentTypes[extname(path)] ?? 'application/octet-stream' });
  createReadStream(path).pipe(response);
}).listen(port, () => {
  console.log(`AI Radar dashboard available at http://localhost:${port}`);
});
