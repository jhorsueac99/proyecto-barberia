import nodemailer from 'nodemailer';
import { formatAppointment } from './schedule.js';

console.log('EMAIL_USER defined:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS defined:', !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

interface ReservationEmailData {
  customerName: string;
  reservationId: number;
  serviceName: string;
  startTime: string;
  cancelUrl: string;
}

export async function sendEmail(reservation: any, options?: { subject?: string; body?: string }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured.');
    return;
  }

  if (!reservation.email) {
    console.log('No email provided for reservation.');
    return;
  }

  const subject = options?.subject || 'Confirmación de reserva Barbería';
  const body = options?.body;

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const cancelUrl = `${baseUrl}/cancel/${reservation.cancel_token}`;

  const htmlBody = body
    ? `<p>${body.replace(/\n/g, '<br>')}</p>`
    : `
    <h2>Confirmación de reserva Barbería</h2>
    <p>Hola <strong>${reservation.customer_name}</strong>,</p>
    <p>Tu reserva ha sido creada:</p>
    <ul>
      <li><strong>ID:</strong> ${reservation.id}</li>
      <li><strong>Servicio:</strong> ${reservation.service_name || 'Servicio'}</li>
      <li><strong>Fecha y hora:</strong> ${formatAppointment(reservation.start_iso)}</li>
    </ul>
    <p>Si deseas cancelar, usa este enlace: <a href="${cancelUrl}">Cancelar reserva</a></p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: reservation.email,
      subject,
      html: htmlBody
    });
    console.log(`Correo enviado a ${reservation.email}`);
  } catch (error) {
    console.error('Error al enviar correo:', error);
  }
}

export async function sendReservationEmail(to: string, data: ReservationEmailData) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured.');
    return;
  }

  const { customerName, reservationId, serviceName, startTime, cancelUrl } = data;

  const htmlBody = `
    <h2>Confirmación de reserva Barbería</h2>
    <p>Hola <strong>${customerName}</strong>,</p>
    <p>Tu reserva ha sido creada:</p>
    <ul>
      <li><strong>ID:</strong> ${reservationId}</li>
      <li><strong>Servicio:</strong> ${serviceName}</li>
      <li><strong>Fecha y hora:</strong> ${startTime}</li>
    </ul>
    <p>Si deseas cancelar, usa este enlace: <a href="${cancelUrl}">Cancelar reserva</a></p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Confirmación de reserva Barbería',
      html: htmlBody
    });
    console.log(`Correo enviado a ${to}`);
  } catch (error) {
    console.error('Error al enviar correo:', error);
  }
}
