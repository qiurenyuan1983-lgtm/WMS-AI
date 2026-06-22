import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const target = process.argv[2] || '/src/mock/handler.ts';

const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error' });

const timeout = setTimeout(() => {
  console.error('TIMEOUT loading', target);
  process.exit(2);
}, 45000);

try {
  await server.ssrLoadModule(target);
  clearTimeout(timeout);
  console.log('OK', target);
} catch (error) {
  clearTimeout(timeout);
  console.error('FAIL', target, error);
  process.exitCode = 1;
} finally {
  await server.close();
}
