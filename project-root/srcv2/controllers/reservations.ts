// src/controllers/reservations.ts
import { Express, Request, Response } from 'express';
import {
  getServices,
  addReservation,
  findOverlaps,
  getReservationById,
  updateReservationStatus
} from '../services/db';
import { sendTelegramMessage } from '../services/telegramService';

function addMinutes(iso: string, minutes: number) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

export default {
  registerRoutes(app: Express) {
    app.post('/api/reservations', this.create.bind(this));
    app.post('/api/reservations/:id/confirm', this.confirm.bind(this));
    app.get('/api/reservations/:id', this.getById.bind(this));
  },

  async create(req: Request, res: Response) {
    try {
      // Debug: ver qué llega desde el frontend
      console.log('Nueva petición de reserva - reservations.ts:28');
      console.log('BODY recibido: - reservations.ts:29', req.body);

      const { serviceId, customerName, phone, startIso, chatId } = req.body;
      if (!serviceId || !customerName || !phone || !startIso) {
        return res.status(400).json({ error: 'Faltan datos' });
      }

      const services = getServices();
      console.log('Servicios disponibles: - reservations.ts:37', services.map(s => ({ id: s.id, name: s.name })));

      // Normalizar tipos al comparar ids
      const service = services.find(s => Number(s.id) === Number(serviceId));
      if (!service) {
        console.warn(`Servicio no encontrado. serviceId recibido: ${serviceId} - reservations.ts:42`);
        return res.status(404).json({
          error: 'Servicio no encontrado',
          serviceIdReceived: serviceId,
          availableServiceIds: services.map(s => s.id)
        });
      }

      const endIso = addMinutes(startIso, service.duration_minutes);
      const overlaps = findOverlaps(service.id, startIso, endIso);
      if (overlaps.length > 0) {
        return res.status(409).json({ error: 'Horario no disponible', overlaps });
      }

      const reservation = addReservation({
        service_id: service.id,
        customer_name: customerName,
        phone,
        start_iso: startIso,
        end_iso: endIso,
        status: 'pending',
        chat_id: chatId || null
      });

      const targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
      const text = `Nueva reserva\nID: ${reservation.id}\nCliente: ${reservation.customer_name}\nServicio: ${service.name}\nInicio: ${reservation.start_iso}`;
      if (targetChat) {
        try {
          await sendTelegramMessage(String(targetChat), text);
        } catch (err) {
          console.error('Error enviando Telegram: - reservations.ts:72', err);
        }
      }

      return res.status(201).json({ reservation });
    } catch (err) {
      console.error('Error creando reserva - reservations.ts:78', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  },

  async confirm(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ error: 'ID inválido' });

      const reservation = getReservationById(id);
      if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });

      updateReservationStatus(id, 'confirmed');

      const text = `Reserva confirmada\nID: ${reservation.id}\nCliente: ${reservation.customer_name}\nInicio: ${reservation.start_iso}`;
      const targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
      if (targetChat) {
        try {
          await sendTelegramMessage(String(targetChat), text);
        } catch (err) {
          console.error('Error enviando Telegram (confirm): - reservations.ts:99', err);
        }
      }

      return res.json({ ok: true, reservation: { ...reservation, status: 'confirmed' } });
    } catch (err) {
      console.error('Error confirmando reserva - reservations.ts:105', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ error: 'ID inválido' });
      const reservation = getReservationById(id);
      if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });
      return res.json({ reservation });
    } catch (err) {
      console.error('Error obteniendo reserva - reservations.ts:118', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }
};
