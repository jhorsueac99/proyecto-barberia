import { getAllReservations, getServices, markReminderSent } from './db.js';
import { formatAppointment } from './schedule.js';
import { sendTelegramMessage } from './telegramService.js';

const REMINDER_INTERVAL_MS = 15 * 60 * 1000;

export async function sendPendingReminders() {
  const [reservations, services] = await Promise.all([getAllReservations(), getServices()]);
  const now = Date.now();

  for (const reservation of reservations) {
    const hoursUntilAppointment = (new Date(reservation.start_iso).getTime() - now) / 3_600_000;
    const shouldRemind = reservation.status !== 'cancelled' && !reservation.reminder_sent_at && hoursUntilAppointment >= 23 && hoursUntilAppointment <= 25;
    if (!shouldRemind) continue;

    const service = services.find((item) => item.id === reservation.service_id);
    await sendTelegramMessage(
      reservation.chat_id || '',
      `⏰ Recordatorio de reserva\nID: ${reservation.id}\nCliente: ${reservation.customer_name}\nServicio: ${service?.name || 'No disponible'}\nInicio: ${formatAppointment(reservation.start_iso)}`
    );
    await markReminderSent(reservation.id);
  }
}

export function startReminderScheduler() {
  void sendPendingReminders().catch((error) => console.error('Error enviando recordatorios - reminderService.ts:26', error));
  setInterval(() => void sendPendingReminders().catch((error) => console.error('Error enviando recordatorios - reminderService.ts:27', error)), REMINDER_INTERVAL_MS);
}
