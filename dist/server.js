import 'dotenv/config';
import express from 'express';
import path from 'path';
import reservations from './controllers/reservations.js';
import { initDb } from './services/db.js';
import { startReminderScheduler } from './services/reminderService.js';
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Faltan credenciales de correo en .env');
}
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.resolve(process.cwd(), 'src', 'public');
app.use(express.json());
app.use(express.static(publicDir));
app.get('/api/ping', (_req, res) => {
    res.json({ ok: true, message: 'pong' });
});
reservations.registerRoutes(app);
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        res.json({ success: true });
    }
    else {
        res.json({ success: false });
    }
});
(async () => {
    await initDb();
    startReminderScheduler();
    app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT} - server.ts:25`);
    });
})();
