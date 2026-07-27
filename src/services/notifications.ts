import nodemailer from 'nodemailer';

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
  } catch (error) {
    console.error('Error enviando email', error);
  }
}
