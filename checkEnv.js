import 'dotenv/config';

console.log('🔎 Verificación de variables de entorno:');
console.log('MAILGUN_USER:', process.env.MAILGUN_USER || '❌ No definida');
console.log('MAILGUN_API_KEY:', process.env.MAILGUN_API_KEY ? '✅ Definida' : '❌ No definida');
