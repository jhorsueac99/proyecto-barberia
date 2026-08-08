import axios from 'axios';
import { formatAppointment } from './schedule.js';

const WHATSAPP_API_VERSION = 'v20.0';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || '';

export function normalizePhoneToInternational(phone: string, countryCode = '51') {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith(countryCode)) return digits;
  return `${countryCode}${digits}`;
}

export async function sendWhatsAppMessage(to: string, body: string) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.log('WhatsApp no configurado.');
    return;
  }

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_ID}/messages`;

  try {
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: normalizePhoneToInternational(to),
        type: 'text',
        text: { body }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`✅ WhatsApp enviado a ${to}`);
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error);
  }
}

export async function sendReminder(reservation: any) {
  await sendWhatsAppMessage(
    reservation.phone,
    `⏰ Recordatorio: Tu cita de ${reservation.service_name} es a las ${formatAppointment(reservation.start_iso)}.`
  );
}
