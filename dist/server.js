import 'dotenv/config';
import express from 'express';
import path from 'path';
import reservations from './controllers/reservations.js';
import { initDb } from './services/db.js';
import { startReminderScheduler } from './services/reminderService.js';
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.resolve(process.cwd(), 'src', 'public');
app.use(express.json());
app.use(express.static(publicDir));
app.get('/api/ping', (_req, res) => {
    res.json({ ok: true, message: 'pong' });
});
reservations.registerRoutes(app);
(async () => {
    await initDb();
    startReminderScheduler();
    app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT} - server.ts:25`);
    });
})();
