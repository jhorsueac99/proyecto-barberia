import { formatAppointment } from '../services/schedule.js';
import { sendTelegramMessage } from '../services/telegramService.js';
import { getAdminId } from '../config/telegram.js';

type NotifyReservation = {
  telegram_id?: string | null;
  customer_name: string;
  service_name: string;
  start_iso: string;
};

function sendClientMessage(reservation: NotifyReservation, message: string) {
  const clientChat = reservation.telegram_id || '';
  if (!clientChat) return;
  return sendTelegramMessage(clientChat, message);
}

function sendAdminMessage(message: string) {
  const adminChat = getAdminId();
  if (!adminChat) return;
  return sendTelegramMessage(adminChat, message);
}

export async function notifyReservationCreated(reservation: NotifyReservation, cancelUrl: string) {
  const service = reservation.service_name;
  const fecha = formatAppointment(reservation.start_iso);

  const clientMessage = `Tu cita ha sido creada 🎉\nServicio: ${service}\nFecha: ${fecha}\nCancelar: ${cancelUrl}`;
  const adminMessage = `📅 Nueva reserva\nServicio: ${service}\nFecha: ${fecha}\nCliente: ${reservation.customer_name}\nCancelar: ${cancelUrl}`;

  try {
    await sendClientMessage(reservation, clientMessage);
  } catch (error) {
    console.error('Error enviando Telegram al cliente (creación) - notify.ts', error);
  }

  try {
    await sendAdminMessage(adminMessage);
  } catch (error) {
    console.error('Error enviando Telegram al admin (creación) - notify.ts', error);
  }
}

export async function notifyReservationConfirmed(reservation: NotifyReservation, cancelUrl: string) {
  const service = reservation.service_name;
  const fecha = formatAppointment(reservation.start_iso);

  const clientMessage = `Tu cita ha sido confirmada ✅\nServicio: ${service}\nFecha: ${fecha}\nCancelar: ${cancelUrl}`;
  const adminMessage = `✅ Cita confirmada\nServicio: ${service}\nFecha: ${fecha}\nCliente: ${reservation.customer_name}`;

  try {
    await sendClientMessage(reservation, clientMessage);
  } catch (error) {
    console.error('Error enviando Telegram al cliente (confirmación) - notify.ts', error);
  }

  try {
    await sendAdminMessage(adminMessage);
  } catch (error) {
    console.error('Error enviando Telegram al admin (confirmación) - notify.ts', error);
  }
}

export async function notifyReservationCancelled(reservation: NotifyReservation) {
  const service = reservation.service_name;
  const fecha = formatAppointment(reservation.start_iso);

  const clientMessage = `Tu cita ha sido cancelada ❌\nServicio: ${service}\nFecha: ${fecha}`;
  const adminMessage = `❌ Cita cancelada\nServicio: ${service}\nFecha: ${fecha}\nCliente: ${reservation.customer_name}`;

  try {
    await sendClientMessage(reservation, clientMessage);
  } catch (error) {
    console.error('Error enviando Telegram al cliente (cancelación) - notify.ts', error);
  }

  try {
    await sendAdminMessage(adminMessage);
  } catch (error) {
    console.error('Error enviando Telegram al admin (cancelación) - notify.ts', error);
  }
}
