import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER,
  subject: 'Prueba de correo Barbería',
  text: 'Hola Alexander, este es un test de Nodemailer.'
};

transporter.sendMail(mailOptions)
  .then((info) => {
    console.log('Correo enviado:', info);
  })
  .catch((error) => {
    console.error('Error al enviar:', error);
  });
