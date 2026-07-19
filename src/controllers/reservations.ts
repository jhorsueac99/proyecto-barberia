import { Express, NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import {
  addReservation,
  findOverlaps,
  getAllReservations,
  getReservationById,
  getReservationByCancelToken,
  getServices,
  updateReservationStatus
} from '../services/db.js';
import { formatAppointment, isBusinessHours } from '../services/schedule.js';
import { sendTelegramMessage } from '../services/telegramService.js';

function addMinutes(iso: string, minutes: number) {
  const date = new Date(iso);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin || req.header('x-admin-pin') === adminPin) {
    next();
    return;
  }

  res.status(401).json({ error: 'PIN de administrador incorrecto.' });
}

function withServiceName(reservation: any, services: Awaited<ReturnType<typeof getServices>>) {
  return {
    ...reservation,
    service_name: services.find((service) => service.id === reservation.service_id)?.name || 'Servicio no disponible'
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character);
}

export default {
  registerRoutes(app: Express) {
    app.get('/api/services', this.services.bind(this));
    app.get('/api/reservations', requireAdmin, this.list.bind(this));
    app.get('/api/reservations/export', requireAdmin, this.exportCsv.bind(this));
    app.post('/api/reservations', this.create.bind(this));
    app.delete('/api/reservations/:id', requireAdmin, this.remove.bind(this));
    app.patch('/api/reservations/:id', requireAdmin, this.confirm.bind(this));
    app.post('/api/reservations/:id/confirm', requireAdmin, this.confirm.bind(this));
    app.get('/api/reservations/:id', requireAdmin, this.getById.bind(this));
    app.get('/cancel/:token', this.cancelPage.bind(this));
    app.post('/api/cancel/:token', this.cancelByToken.bind(this));
  },

  async services(_req: Request, res: Response) {
    const services = await getServices();
    return res.json({ services });
  },

  async list(_req: Request, res: Response) {
    const [reservations, services] = await Promise.all([getAllReservations(), getServices()]);
    return res.json({ reservations: reservations.map((reservation) => withServiceName(reservation, services)) });
  },

  async exportCsv(_req: Request, res: Response) {
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

  async create(req: Request, res: Response) {
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

      const services = await getServices();
      const service = services.find((item) => Number(item.id) === Number(serviceId));
      if (!service) {
        return res.status(404).json({ error: 'Servicio no encontrado' });
      }

      const endIso = addMinutes(startIso, service.duration_minutes);
      if (!isBusinessHours(startIso, endIso)) {
        return res.status(400).json({ error: 'Atendemos de lunes a sábado, de 9:00 a.m. a 8:00 p.m. (hora Perú).' });
      }
      const overlaps = await findOverlaps(service.id, startIso, endIso);
      if (overlaps.length > 0) {
        return res.status(409).json({ error: 'Horario no disponible', overlaps });
      }

      const reservation = await addReservation({
        service_id: service.id,
        customer_name: name,
        phone: cleanPhone,
        start_iso: startIso,
        end_iso: endIso,
        status: 'pending',
        chat_id: process.env.TELEGRAM_CHAT_ID || null,
        cancel_token: randomUUID(),
        reminder_sent_at: null
      });

      const cancelUrl = `${req.protocol}://${req.get('host')}/cancel/${reservation.cancel_token}`;

      const targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
      if (targetChat) {
        try {
          await sendTelegramMessage(String(targetChat), `📅 Nueva reserva\nID: ${reservation.id}\nCliente: ${reservation.customer_name}\nServicio: ${service.name}\nInicio: ${formatAppointment(reservation.start_iso)}\nCancelar: ${cancelUrl}`);
        } catch (error) {
          console.error('Error enviando Telegram - reservations.ts:144', error);
        }
      }

      return res.status(201).json({ reservation: withServiceName(reservation, services), cancelUrl });
    } catch (error) {
      console.error('Error creando reserva - reservations.ts:150', error);
      return res.status(500).json({ error: 'Error interno' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const reservation = await getReservationById(id);
      if (!reservation) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      const updated = await updateReservationStatus(id, 'cancelled');

      const targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
      if (targetChat) {
        try {
          await sendTelegramMessage(String(targetChat), `❌ Reserva cancelada\nID: ${reservation.id}\nCliente: ${reservation.customer_name}\nInicio: ${formatAppointment(reservation.start_iso)}`);
        } catch (error) {
          console.error('Error enviando Telegram (cancelación) - reservations.ts:174', error);
        }
      }

      return res.json({ ok: true, reservation: updated });
    } catch (error) {
      console.error('Error eliminando reserva - reservations.ts:180', error);
      return res.status(500).json({ error: 'Error interno' });
    }
  },

  async confirm(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const reservation = await getReservationById(id);
      if (!reservation) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      if (reservation.status === 'cancelled') {
        return res.status(409).json({ error: 'No se puede confirmar una reserva cancelada.' });
      }

      const updated = await updateReservationStatus(id, 'confirmed');
      const targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
      if (targetChat) {
        try {
          await sendTelegramMessage(String(targetChat), `✅ Reserva confirmada\nID: ${reservation.id}\nCliente: ${reservation.customer_name}\nInicio: ${formatAppointment(reservation.start_iso)}`);
        } catch (error) {
          console.error('Error enviando Telegram (confirmación) - reservations.ts:207', error);
        }
      }

      return res.json({ ok: true, reservation: updated });
    } catch (error) {
      console.error('Error confirmando reserva - reservations.ts:213', error);
      return res.status(500).json({ error: 'Error interno' });
    }
  },

  async getById(req: Request, res: Response) {
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
    } catch (error) {
      console.error('Error obteniendo reserva - reservations.ts:232', error);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  async cancelPage(req: Request, res: Response) {
    const reservation = await getReservationByCancelToken(req.params.token);
    if (!reservation) return res.status(404).send('Enlace de cancelación no válido.');
    if (reservation.status === 'cancelled') return res.send('Esta reserva ya fue cancelada.');

    return res.send(`<!doctype html><html lang="es"><meta charset="utf-8"><title>Cancelar reserva</title><body style="font-family:system-ui;max-width:500px;margin:4rem auto;padding:1rem"><h1>Cancelar reserva</h1><p>¿Deseas cancelar la reserva de <strong>${escapeHtml(reservation.customer_name)}</strong>?</p><form method="post" action="/api/cancel/${reservation.cancel_token}"><button style="padding:.75rem 1rem;background:#b91c1c;color:white;border:0;border-radius:.5rem;cursor:pointer">Cancelar reserva</button></form></body></html>`);
  },

  async cancelByToken(req: Request, res: Response) {
    const reservation = await getReservationByCancelToken(req.params.token);
    if (!reservation) return res.status(404).json({ error: 'Enlace de cancelación no válido.' });
    if (reservation.status === 'cancelled') return res.json({ ok: true, message: 'La reserva ya estaba cancelada.' });

    await updateReservationStatus(reservation.id, 'cancelled');
    await sendTelegramMessage(reservation.chat_id || '', `❌ Reserva cancelada por enlace\nID: ${reservation.id}\nCliente: ${reservation.customer_name}`);
    return res.json({ ok: true, message: 'Reserva cancelada correctamente.' });
  }
};
