"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const reservations_1 = __importDefault(require("./controllers/reservations"));
const db_1 = require("./services/db");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = path_1.default.resolve(process.cwd(), 'src', 'public');
app.use(express_1.default.json());
app.use(express_1.default.static(publicDir));
app.get('/api/ping', (_req, res) => {
    res.json({ ok: true, message: 'pong' });
});
reservations_1.default.registerRoutes(app);
(async () => {
    await (0, db_1.initDb)();
    app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
    });
})();
