import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.TELEGRAM_TOKEN;
const API_BASE = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;


export async function sendTelegramMessage(chatId: string, text: string) {
  if (!API_BASE || !chatId) {
    console.log('Telegram not configured. - telegramService.ts:11');
    return;
  }
  try {
    await axios.post(`${API_BASE}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    });
  } catch (err) {
    console.error('Telegram send error - telegramService.ts:21', err);
  }
}
