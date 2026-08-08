import twilio from 'twilio';
import { twilioConfigs } from '../config/twilioConfig.js';

export function isTwilioEnabled() {
  return process.env.ENABLE_TWILIO === 'true';
}

export function buildTemplateMessage(templateName: string, reserva: any): string {
  switch (templateName) {
    case 'reservation_confirmed':
      return `Hola ${reserva.customer_name}, tu reserva para ${reserva.service_name} el ${reserva.start_iso} ha sido CONFIRMADA.`;
    case 'reservation_cancelled':
      return `Hola ${reserva.customer_name}, tu reserva para ${reserva.service_name} el ${reserva.start_iso} ha sido CANCELADA.`;
    case 'reservation_created':
    default:
      return `Hola ${reserva.customer_name}, tu reserva para ${reserva.service_name} el ${reserva.start_iso} ha sido REGISTRADA.`;
  }
}

export async function sendMessage(phone: string, message: string, barberiaId: string = 'barberiaA') {
  const config = twilioConfigs[barberiaId] || twilioConfigs.barberiaA;

  try {
    if (!config.accountSid || !config.authToken) {
      console.log('Twilio WhatsApp no configurado.');
      return;
    }

    const client = twilio(config.accountSid, config.authToken);

    await client.messages.create({
      from: config.from,
      to: `whatsapp:+51${phone}`,
      body: message
    });
    console.log(`WhatsApp enviado desde ${barberiaId}:`, { phone, message });
  } catch (error: any) {
    console.error(`Error al enviar WhatsApp desde ${barberiaId}:`, error.message);
  }
}

export async function sendTemplateMessage(barberiaId: string, templateName: string, reserva: any) {
  await sendMessage(reserva.phone, buildTemplateMessage(templateName, reserva), barberiaId);
}
