import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

export async function sendReservationMail(reserva) {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: reserva.email,
    subject: 'Confirmación de Reserva Barbería',
    text: `Hola ${reserva.nombre}, tu reserva para ${reserva.servicio} el día ${reserva.fecha} ha sido registrada exitosamente.`
  });
}
