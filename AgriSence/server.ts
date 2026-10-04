import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import chatHandler from './api/chat.js';
import pestHandler from './api/pest-diagnosis.js';
import translationHandler from './api/translate-ui.js';
import marketHandler from './api/market-prices.js';
import portalHandler from './api/portal.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: [path.join(dirname, '.env.local'), path.join(dirname, '.env')] });

const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(express.json({ limit: '4.4mb' }));
app.post('/api/chat', chatHandler);
app.post('/api/pest-diagnosis', pestHandler);
app.post('/api/translate-ui', translationHandler);
app.post('/api/portal', portalHandler);

app.get('/api/market-prices', marketHandler);
app.use('/api', (_req, res) => { res.status(404).json({ error: 'API endpoint not found.' }); });
app.use(((error, _req, res, _next) => {
  const tooLarge = error.type === 'entity.too.large';
  res.status(tooLarge ? 413 : 400).json({ error: tooLarge ? 'The request is too large. Use a smaller photo.' : 'The request body must be valid JSON.' });
}) as express.ErrorRequestHandler);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(dirname, 'dist')));
    app.get('*', (_req, res) => { res.sendFile(path.join(dirname, 'dist', 'index.html')); });
  }
  await new Promise<void>((resolve, reject) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[AgriSence] Guide AI and Pest Vision AI listening on http://localhost:${PORT}`);
      resolve();
    });
    server.once('error', reject);
  });
}

startServer().catch((error) => {
  console.error('Failed to start AgriSence:', error);
  process.exit(1);
});
