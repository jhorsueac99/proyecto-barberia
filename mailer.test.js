import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_API_KEY
  }
});

async function testMail() {
  try {
    await transporter.sendMail({
      from: process.env.MAILGUN_USER,
      to: 'acalexanderj89@gmail.com',
      subject: 'Prueba Mailgun Barbería',
      text: 'Este es un correo de prueba enviado desde Render usando Mailgun.'
    });
    console.log('✅ Correo de prueba enviado correctamente');
  } catch (err) {
    console.error('❌ Error en envío de prueba:', err);
  }
}

testMail();
