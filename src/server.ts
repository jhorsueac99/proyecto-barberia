import 'dotenv/config';
import express from 'express';
import path from 'path';
import reservations from './controllers/reservations';
import { initDb } from './services/db';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, message: 'pong' });
});

reservations.registerRoutes(app);

(async () => {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
})();
