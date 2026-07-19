"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../services/db");
const telegramService_1 = require("../services/telegramService");
function addMinutes(iso, minutes) {
    const date = new Date(iso);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
}
exports.default = {
    registerRoutes(app) {
        app.get('/api/services', this.services.bind(this));
        app.get('/api/reservations', this.list.bind(this));
        app.get('/api/reservations/export', this.exportCsv.bind(this));
        app.post('/api/reservations', this.create.bind(this));
        app.delete('/api/reservations/:id', this.remove.bind(this));
        app.patch('/api/reservations/:id', this.confirm.bind(this));
        app.post('/api/reservations/:id/confirm', this.confirm.bind(this));
        app.get('/api/reservations/:id', this.getById.bind(this));
    },
    async services(_req, res) {
        const services = await (0, db_1.getServices)();
        return res.json({ services });
    },
    async list(_req, res) {
        const reservations = await (0, db_1.getAllReservations)();
        return res.json({ reservations });
    },
    async exportCsv(_req, res) {
        const reservations = await (0, db_1.getAllReservations)();
        const header = ['id', 'cliente', 'telefono', 'servicio', 'inicio', 'estado'];
        const rows = reservations.map((reservation) => [
            reservation.id,
            reservation.customer_name,
            reservation.phone,
            reservation.service_id,
            reservation.start_iso,
            reservation.status
        ]);
        const csv = [header, ...rows]
            .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="reservations.csv"');
        return res.send(csv);
    },
    async create(req, res) {
        try {
            const { serviceId, customerName, phone = '', startIso } = req.body;
            const name = String(customerName || '').trim();
            const cleanPhone = String(phone || '').trim();
            const parsedStart = new Date(startIso);
            if (!serviceId || !name || !startIso) {
                return res.status(400).json({ error: 'Faltan datos: servicio, nombre y fecha' });
            }
            if (name.length < 3) {
                return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres.' });
            }
            if (!/^\d{9,}$/.test(cleanPhone)) {
                return res.status(400).json({ error: 'El teléfono debe ser numérico y tener al menos 9 dígitos.' });
            }
            if (Number.isNaN(parsedStart.getTime()) || parsedStart <= new Date()) {
                return res.status(400).json({ error: 'La fecha debe ser futura y válida.' });
            }
            const services = await (0, db_1.getServices)();
            const service = services.find((item) => Number(item.id) === Number(serviceId));
            if (!service) {
                return res.status(404).json({ error: 'Servicio no encontrado' });
            }
            const endIso = addMinutes(startIso, service.duration_minutes);
            const overlaps = await (0, db_1.findOverlaps)(service.id, startIso, endIso);
            if (overlaps.length > 0) {
                return res.status(409).json({ error: 'Horario no disponible', overlaps });
            }
            const reservation = await (0, db_1.addReservation)({
                service_id: service.id,
                customer_name: name,
                phone: cleanPhone,
                start_iso: startIso,
                end_iso: endIso,
                status: 'pending',
                chat_id: process.env.TELEGRAM_CHAT_ID || null
            });
            const targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
            if (targetChat) {
                try {
                    await (0, telegramService_1.sendTelegramMessage)(String(targetChat), `Nueva reserva\nID: ${reservation.id}\nCliente: ${reservation.customer_name}\nServicio: ${service.name}\nInicio: ${reservation.start_iso}`);
                }
                catch (error) {
                    console.error('Error enviando Telegram', error);
                }
            }
            return res.status(201).json({ reservation });
        }
        catch (error) {
            console.error('Error creando reserva', error);
            return res.status(500).json({ error: 'Error interno' });
        }
    },
    async remove(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const reservation = await (0, db_1.getReservationById)(id);
            if (!reservation) {
                return res.status(404).json({ error: 'Reserva no encontrada' });
            }
            const removed = await (0, db_1.deleteReservation)(id);
            if (!removed) {
                return res.status(404).json({ error: 'Reserva no encontrada' });
            }
            const targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
            if (targetChat) {
                try {
                    await (0, telegramService_1.sendTelegramMessage)(String(targetChat), `Reserva cancelada\nID: ${reservation.id}\nCliente: ${reservation.customer_name}\nInicio: ${reservation.start_iso}`);
                }
                catch (error) {
                    console.error('Error enviando Telegram (cancelación)', error);
                }
            }
            return res.json({ ok: true, deletedId: id });
        }
        catch (error) {
            console.error('Error eliminando reserva', error);
            return res.status(500).json({ error: 'Error interno' });
        }
    },
    async confirm(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const reservation = await (0, db_1.getReservationById)(id);
            if (!reservation) {
                return res.status(404).json({ error: 'Reserva no encontrada' });
            }
            const updated = await (0, db_1.updateReservationStatus)(id, 'confirmed');
            const targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
            if (targetChat) {
                try {
                    await (0, telegramService_1.sendTelegramMessage)(String(targetChat), `Reserva confirmada\nID: ${reservation.id}\nCliente: ${reservation.customer_name}\nInicio: ${reservation.start_iso}`);
                }
                catch (error) {
                    console.error('Error enviando Telegram (confirmación)', error);
                }
            }
            return res.json({ ok: true, reservation: updated });
        }
        catch (error) {
            console.error('Error confirmando reserva', error);
            return res.status(500).json({ error: 'Error interno' });
        }
    },
    async getById(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const reservation = await (0, db_1.getReservationById)(id);
            if (!reservation) {
                return res.status(404).json({ error: 'Reserva no encontrada' });
            }
            return res.json({ reservation });
        }
        catch (error) {
            console.error('Error obteniendo reserva', error);
            return res.status(500).json({ error: 'Error interno' });
        }
    }
};
