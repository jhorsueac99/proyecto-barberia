import 'dotenv/config';
import nodemailer from 'nodemailer';

let transporter;

if (process.env.MAIL_PROVIDER === 'mailgun') {
  transporter = nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    port: 587,
    auth: {
      user: process.env.MAILGUN_USER,
      pass: process.env.MAILGUN_API_KEY
    }
  });
} else {
  throw new Error('MAIL_PROVIDER no configurado correctamente');
}

export async function sendReservationMail(reserva) {
  await transporter.sendMail({
    from: process.env.MAILGUN_USER,
    to: reserva.email,
    subject: 'Confirmación de Reserva Barbería',
    text: `Hola ${reserva.nombre}, tu reserva para ${reserva.servicio} el día ${reserva.fecha} ha sido registrada exitosamente.`
  });
}
