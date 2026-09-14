import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const port = Number(process.env.PORT || 5173);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const filename = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (filename !== root && !filename.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const content = await readFile(filename);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(filename)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    }).end(content);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('File unavailable');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Pocket Flow frontend: http://127.0.0.1:${port}`);
});
