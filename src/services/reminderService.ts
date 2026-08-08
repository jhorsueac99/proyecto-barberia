import { getAllReservations, getServices, markReminderSent } from './db.js';
import { formatAppointment } from './schedule.js';
import { sendTelegramMessage, sendReminder as sendReminderTelegram } from './telegramService.js';
import { sendReminder as sendReminderWhatsApp } from './whatsappService.js';

const REMINDER_INTERVAL_MS = 15 * 60 * 1000;
const SIXTY_MINUTES = 60 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

export async function sendReminder(reservation: any) {
  const [whatsapp, telegram] = await Promise.allSettled([
    sendReminderWhatsApp(reservation),
    sendReminderTelegram(reservation)
  ]);

  if (whatsapp.status === 'rejected') console.error('Error recordatorio WhatsApp - reminderService.ts', whatsapp.reason);
  if (telegram.status === 'rejected') console.error('Error recordatorio Telegram - reminderService.ts', telegram.reason);
}

export function scheduleReminder(reservation: any) {
  const diffMs = new Date(reservation.start_iso).getTime() - Date.now();

  if (diffMs <= 0) return;

  const schedule = (delayMs: number) => {
    const timer = setTimeout(() => {
      void sendReminder(reservation).catch((error) => console.error('Error enviando recordatorio - reminderService.ts', error));
    }, delayMs);
    timer.unref();
  };

  if (diffMs >= SIXTY_MINUTES) {
    schedule(diffMs - SIXTY_MINUTES);
    return;
  }

  if (diffMs > TEN_MINUTES) {
    schedule(Math.max(diffMs - THIRTY_MINUTES, 0));
    return;
  }

  void sendReminder(reservation).catch((error) => console.error('Error enviando recordatorio inmediato - reminderService.ts', error));
}

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
