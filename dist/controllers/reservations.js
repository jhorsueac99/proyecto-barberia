import { randomUUID } from 'crypto';
import { addReservation, findHourBlocked, getAllReservations, getReservationById, getReservationByCancelToken, getServices } from '../services/db.js';
import { confirmReservation, cancelReservation } from '../services/reservationService.js';
import { scheduleReminder } from '../services/reminderService.js';
import { formatAppointment, isBusinessHours } from '../services/schedule.js';
import { sendTelegramMessage } from '../services/telegramService.js';
import { sendWhatsAppMessage } from '../services/whatsappService.js';
import { isTwilioEnabled, sendTemplateMessage } from '../services/twilioService.js';
export async function crearReserva(req, res) {
    const reserva = await addReservation(req.body);
    res.status(201).json({ message: 'Reserva creada', reserva });
}
function addMinutes(iso, minutes) {
    const date = new Date(iso);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
}
function nextBusinessSlot(startIso, durationMinutes) {
    const candidate = new Date(startIso);
    candidate.setMinutes(0, 0, 0);
    candidate.setHours(candidate.getHours() + 1);
    for (let i = 0; i < 7 * 24; i++) {
        const end = new Date(candidate.getTime() + durationMinutes * 60 * 1000);
        if (isBusinessHours(candidate.toISOString(), end.toISOString())) {
            return candidate.toISOString();
        }
        candidate.setHours(candidate.getHours() + 1);
    }
    return new Date(startIso).toISOString();
}
function requireAdmin(req, res, next) {
    const adminPin = process.env.ADMIN_PIN;
    if (!adminPin || req.header('x-admin-pin') === adminPin) {
        next();
        return;
    }
    res.status(401).json({ error: 'PIN de administrador incorrecto.' });
}
function withServiceName(reservation, services) {
    const service = services.find((s) => s.id === reservation.service_id);
    return {
        ...reservation,
        service_name: service?.name || 'Servicio no disponible',
        service_description: service?.description || ''
    };
}
function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character);
}
export default {
    registerRoutes(app) {
        app.get('/api/services', this.services.bind(this));
        app.get('/api/reservations', this.list.bind(this));
        app.get('/api/reservations/export', requireAdmin, this.exportCsv.bind(this));
        app.post('/api/reservations', this.create.bind(this));
        app.delete('/api/reservations/:id', requireAdmin, this.remove.bind(this));
        app.patch('/api/reservations/:id', requireAdmin, this.confirm.bind(this));
        app.post('/api/reservations/:id/confirm', requireAdmin, this.confirm.bind(this));
        app.get('/api/reservations/:id', requireAdmin, this.getById.bind(this));
        app.get('/cancel/:token', this.cancelPage.bind(this));
        app.post('/api/cancel/:token', this.cancelByToken.bind(this));
    },
    async services(_req, res) {
        const services = await getServices();
        return res.json(services);
    },
    async list(req, res) {
        const adminPin = process.env.ADMIN_PIN;
        const hasAdminPin = adminPin ? req.header('x-admin-pin') === adminPin : false;
        const telegramId = String(req.header('x-telegram-id') || req.query.telegramId || '');
        const telegramUsername = String(req.header('x-telegram-username') || req.query.telegramUsername || '');
        if (adminPin && !hasAdminPin && !telegramId && !telegramUsername) {
            return res.status(401).json({ error: 'No autorizado. Proporciona el PIN de administrador o tu Telegram.' });
        }
        const [allReservations, services] = await Promise.all([getAllReservations(), getServices()]);
        if (hasAdminPin || (!adminPin && !telegramId && !telegramUsername)) {
            return res.json({ reservations: allReservations.map((reservation) => withServiceName(reservation, services)) });
        }
        let ownReservations;
        if (telegramUsername) {
            if (!/^@[A-Za-z0-9_]{4,}$/.test(telegramUsername)) {
                return res.status(401).json({ error: 'Username de Telegram inválido.' });
            }
            const normalized = telegramUsername.replace(/^@/, '').toLowerCase();
            ownReservations = allReservations.filter((reservation) => (reservation.telegram_username || '').replace(/^@/, '').toLowerCase() === normalized);
        }
        else {
            if (!/^\d{5,}$/.test(telegramId)) {
                return res.status(401).json({ error: 'ID de Telegram inválido.' });
            }
            ownReservations = allReservations.filter((reservation) => reservation.telegram_id === telegramId || reservation.chat_id === telegramId);
        }
        const sanitized = ownReservations.map((reservation) => {
            const { phone: _phone, telegram_id: _telegramId, chat_id: _chatId, ...rest } = reservation;
            return withServiceName(rest, services);
        });
        return res.json({ reservations: sanitized });
    },
    async exportCsv(_req, res) {
        const [reservations, services] = await Promise.all([getAllReservations(), getServices()]);
        const header = ['id', 'cliente', 'telefono', 'servicio', 'inicio', 'estado'];
        const rows = reservations.map((reservation) => [
            reservation.id,
            reservation.customer_name,
            reservation.phone,
            services.find((service) => service.id === reservation.service_id)?.name || reservation.service_id,
            formatAppointment(reservation.start_iso),
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
        console.log('Controlador ejecutado: crear');
        try {
            const { serviceId, customerName, phone = '', startIso, barberiaId = 'barberiaA', telegramUsername = '', shortNoticeAccepted = false } = req.body;
            const name = String(customerName || '').trim();
            const cleanPhone = String(phone || '').trim();
            const cleanUsername = String(telegramUsername || '').trim();
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
            if (cleanUsername && !/^@[A-Za-z0-9_]{4,}$/.test(cleanUsername)) {
                return res.status(400).json({ error: 'El username de Telegram debe comenzar con @ y contener caracteres válidos (ej. @usuario).' });
            }
            if (Number.isNaN(parsedStart.getTime()) || parsedStart <= new Date()) {
                return res.status(400).json({ error: 'La fecha debe ser futura y válida.' });
            }
            const shortNoticeWarning = 'Las citas reservadas con menos de 2 horas de anticipación no pueden cancelarse sin penalización.';
            const services = await getServices();
            const service = services.find((item) => item.id === serviceId);
            if (!service) {
                return res.status(404).json({ error: 'Servicio no encontrado' });
            }
            let start = startIso;
            let end = addMinutes(startIso, service.duration_minutes);
            let adjusted = false;
            if (!isBusinessHours(start, end)) {
                start = nextBusinessSlot(start, service.duration_minutes);
                end = addMinutes(start, service.duration_minutes);
                adjusted = true;
            }
            const shortNotice = new Date(start).getTime() - Date.now() < 2 * 60 * 60 * 1000;
            if (shortNotice && !shortNoticeAccepted) {
                return res.status(400).json({ error: 'Debes aceptar la política de aviso corto para continuar con la reserva.' });
            }
            const existing = await findHourBlocked(start);
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Ya existe una cita en esta hora. Por favor elige otra franja.' });
            }
            const reservation = await addReservation({
                service_id: service.id,
                service_name: service.name,
                service_price: service.price,
                service_description: service.description || null,
                customer_name: name,
                phone: cleanPhone,
                start_iso: start,
                end_iso: end,
                status: 'pending',
                telegram_username: cleanUsername || undefined,
                chat_id: process.env.TELEGRAM_CHAT_ID || null,
                cancel_token: randomUUID(),
                reminder_sent_at: null,
                barberiaId,
                short_notice: shortNotice,
                short_notice_accepted: Boolean(shortNoticeAccepted)
            });
            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
            const cancelUrl = `${baseUrl}/cancel/${reservation.cancel_token}`;
            const targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
            if (targetChat) {
                try {
                    await sendTelegramMessage(String(targetChat), `📅 Nueva reserva\nID: ${reservation.id}\nCliente: ${reservation.customer_name}\nTeléfono: ${reservation.phone}\nServicio: ${service.name}\nInicio: ${formatAppointment(reservation.start_iso)}\nCancelar: ${cancelUrl}`);
                }
                catch (error) {
                    console.error('Error enviando Telegram - reservations.ts:144', error);
                }
            }
            try {
                await sendWhatsAppMessage(reservation.phone, `Hola ${reservation.customer_name}, tu reserva de ${service.name} para el ${formatAppointment(reservation.start_iso)} fue registrada exitosamente. ID: ${reservation.id}`);
            }
            catch (error) {
                console.error('Error enviando WhatsApp (creación) - reservations.ts', error);
            }
            if (isTwilioEnabled()) {
                try {
                    await sendTemplateMessage(reservation.barberiaId || 'barberiaA', 'reservation_created', {
                        customer_name: reservation.customer_name,
                        service_name: service.name,
                        start_iso: formatAppointment(reservation.start_iso),
                        phone: reservation.phone
                    });
                }
                catch (error) {
                    console.error('Error enviando WhatsApp Twilio (creación) - reservations.ts', error);
                }
            }
            scheduleReminder(reservation);
            const adjustedMessage = adjusted
                ? `La hora seleccionada estaba fuera del horario de atención y fue ajustada a ${formatAppointment(start)}.`
                : undefined;
            return res.status(201).json({ reservation: withServiceName(reservation, services), cancelUrl, warning: shortNotice ? shortNoticeWarning : undefined, adjusted: adjustedMessage });
        }
        catch (error) {
            console.error('Error creando reserva - reservations.ts:150', error);
            return res.status(500).json({ error: 'Error interno' });
        }
    },
    async remove(req, res) {
        console.log('Controlador ejecutado: cancelar');
        try {
            const id = Number(req.params.id);
            if (!id) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const reservation = await getReservationById(id);
            if (!reservation) {
                return res.status(404).json({ error: 'Reserva no encontrada' });
            }
            const { reservation: updated, late } = await cancelReservation(id);
            const cancelMessage = late
                ? '⚠️ La cita fue cancelada muy cerca de la hora programada. La franja se ha liberado para otro cliente.'
                : '❌ La cita ha sido cancelada. La franja se ha liberado.';
            const targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
            if (targetChat) {
                try {
                    await sendTelegramMessage(String(targetChat), `${cancelMessage}\nID: ${reservation.id}\nCliente: ${reservation.customer_name}\nServicio: ${reservation.service_name}\nInicio: ${formatAppointment(reservation.start_iso)}`);
                }
                catch (error) {
                    console.error('Error enviando Telegram (cancelación) - reservations.ts:174', error);
                }
            }
            try {
                await sendWhatsAppMessage(reservation.phone, cancelMessage);
            }
            catch (error) {
                console.error('Error enviando WhatsApp (cancelación) - reservations.ts', error);
            }
            if (isTwilioEnabled()) {
                try {
                    await sendTemplateMessage(reservation.barberiaId || 'barberiaA', 'reservation_cancelled', {
                        customer_name: reservation.customer_name,
                        service_name: reservation.service_name,
                        start_iso: formatAppointment(reservation.start_iso),
                        phone: reservation.phone
                    });
                }
                catch (error) {
                    console.error('Error enviando WhatsApp Twilio (cancelación) - reservations.ts', error);
                }
            }
            return res.json({ ok: true, reservation: updated });
        }
        catch (error) {
            console.error('Error eliminando reserva - reservations.ts:180', error);
            return res.status(500).json({ error: 'Error interno' });
        }
    },
    async confirm(req, res) {
        console.log('Controlador ejecutado: confirmar');
        try {
            const id = Number(req.params.id);
            if (!id) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const reservation = await getReservationById(id);
            if (!reservation) {
                return res.status(404).json({ error: 'Reserva no encontrada' });
            }
            let updated;
            try {
                updated = await confirmReservation(id);
            }
            catch (error) {
                return res.status(409).json({ error: error.message });
            }
            const targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
            if (targetChat) {
                try {
                    await sendTelegramMessage(String(targetChat), `✅ Reserva confirmada\nID: ${reservation.id}\nCliente: ${reservation.customer_name}\nInicio: ${formatAppointment(reservation.start_iso)}`);
                }
                catch (error) {
                    console.error('Error enviando Telegram (confirmación) - reservations.ts:207', error);
                }
            }
            try {
                await sendWhatsAppMessage(reservation.phone, `Hola ${reservation.customer_name}, tu reserva (ID ${reservation.id}) ha sido CONFIRMADA. Te esperamos el ${formatAppointment(reservation.start_iso)}.`);
            }
            catch (error) {
                console.error('Error enviando WhatsApp (confirmación) - reservations.ts', error);
            }
            if (isTwilioEnabled()) {
                try {
                    await sendTemplateMessage(reservation.barberiaId || 'barberiaA', 'reservation_confirmed', {
                        customer_name: reservation.customer_name,
                        service_name: reservation.service_name,
                        start_iso: formatAppointment(reservation.start_iso),
                        phone: reservation.phone
                    });
                }
                catch (error) {
                    console.error('Error enviando WhatsApp Twilio (confirmación) - reservations.ts', error);
                }
            }
            return res.json({ ok: true, reservation: updated });
        }
        catch (error) {
            console.error('Error confirmando reserva - reservations.ts:213', error);
            return res.status(500).json({ error: 'Error interno' });
        }
    },
    async getById(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const reservation = await getReservationById(id);
            if (!reservation) {
                return res.status(404).json({ error: 'Reserva no encontrada' });
            }
            return res.json({ reservation });
        }
        catch (error) {
            console.error('Error obteniendo reserva - reservations.ts:232', error);
            return res.status(500).json({ error: 'Error interno' });
        }
    },
    async cancelPage(req, res) {
        try {
            const reservation = await getReservationByCancelToken(req.params.token);
            if (!reservation)
                return res.status(404).send('Enlace de cancelación no válido.');
            if (reservation.status === 'cancelled')
                return res.send('Esta reserva ya fue cancelada.');
            return res.send(`<!doctype html><html lang="es"><meta charset="utf-8"><title>Cancelar reserva</title><body style="font-family:system-ui;max-width:500px;margin:4rem auto;padding:1rem"><h1>Cancelar reserva</h1><p>¿Deseas cancelar la reserva de <strong>${escapeHtml(reservation.customer_name)}</strong>?</p><form method="post" action="/api/cancel/${reservation.cancel_token}"><button style="padding:.75rem 1rem;background:#b91c1c;color:white;border:0;border-radius:.5rem;cursor:pointer">Cancelar reserva</button></form></body></html>`);
        }
        catch (error) {
            console.error('Error en cancelPage - reservations.ts', error);
            return res.status(500).send('Error interno');
        }
    },
    async cancelByToken(req, res) {
        console.log('Controlador ejecutado: cancelar');
        try {
            const reservation = await getReservationByCancelToken(req.params.token);
            if (!reservation)
                return res.status(404).json({ error: 'Enlace de cancelación no válido.' });
            if (reservation.status === 'cancelled')
                return res.json({ ok: true, message: 'La reserva ya estaba cancelada.' });
            const { late } = await cancelReservation(reservation.id);
            const cancelMessage = late
                ? '⚠️ La cita fue cancelada muy cerca de la hora programada. La franja se ha liberado para otro cliente.'
                : '❌ La cita ha sido cancelada. La franja se ha liberado.';
            const targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
            if (targetChat) {
                try {
                    await sendTelegramMessage(targetChat, `${cancelMessage}\nID: ${reservation.id}\nCliente: ${reservation.customer_name}\nServicio: ${reservation.service_name}`);
                }
                catch (error) {
                    console.error('Error enviando Telegram (cancelByToken) - reservations.ts', error);
                }
            }
            try {
                await sendWhatsAppMessage(reservation.phone, cancelMessage);
            }
            catch (error) {
                console.error('Error enviando WhatsApp (cancelByToken) - reservations.ts', error);
            }
            if (isTwilioEnabled()) {
                try {
                    await sendTemplateMessage(reservation.barberiaId || 'barberiaA', 'reservation_cancelled', {
                        customer_name: reservation.customer_name,
                        service_name: reservation.service_name,
                        start_iso: formatAppointment(reservation.start_iso),
                        phone: reservation.phone
                    });
                }
                catch (error) {
                    console.error('Error enviando WhatsApp Twilio (cancelByToken) - reservations.ts', error);
                }
            }
            return res.json({ ok: true, message: 'Reserva cancelada correctamente.' });
        }
        catch (error) {
            console.error('Error en cancelByToken - reservations.ts', error);
            return res.status(500).json({ error: 'Error interno' });
        }
    }
};
