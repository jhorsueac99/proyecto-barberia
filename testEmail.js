import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_API_KEY
  }
});

const fromEmail = process.env.MAILGUN_USER || 'postmaster@TU_DOMINIO.mailgun.org';

const mailOptions = {
  from: fromEmail,
  to: process.env.MAILGUN_TO_EMAIL || fromEmail,
  subject: 'Prueba de correo Barbería',
  text: 'Hola Alexander, este es un test de Nodemailer con Mailgun.'
};

transporter.sendMail(mailOptions)
  .then((info) => {
    console.log('Correo enviado:', info);
  })
  .catch((error) => {
    console.error('Error al enviar:', error);
  });
