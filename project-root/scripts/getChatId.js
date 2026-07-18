// scripts/getChatId.js
const axios = require('axios');
require('dotenv').config();

const TOKEN = process.env.TELEGRAM_TOKEN;
if (!TOKEN) {
  console.error('Pon TELEGRAM_TOKEN en .env - getChatId.js:7');
  process.exit(1);
}

async function main() {
  try {
    const res = await axios.get(`https://api.telegram.org/bot${TOKEN}/getUpdates`);
    const updates = res.data.result || [];
    if (updates.length === 0) {
      console.log('No hay updates. Pide al usuario que envíe un mensaje al bot. - getChatId.js:16');
      return;
    }
    const ids = new Set();
    updates.forEach(u => {
      if (u.message && u.message.chat && u.message.chat.id) ids.add(u.message.chat.id);
      if (u.callback_query && u.callback_query.from && u.callback_query.from.id) ids.add(u.callback_query.from.id);
    });
    console.log('Chat IDs encontrados: - getChatId.js:24');
    ids.forEach(id => console.log(id));
  } catch (err) {
    console.error('Error al llamar getUpdates: - getChatId.js:27', err.response ? err.response.data : err.message);
  }
}

main();
