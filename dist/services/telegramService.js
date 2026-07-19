import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const TOKEN = process.env.TELEGRAM_TOKEN;
const DEFAULT_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API_BASE = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;
export async function sendTelegramMessage(chatId = DEFAULT_CHAT_ID || '', text) {
    if (!API_BASE || !chatId) {
        console.log('Telegram not configured.');
        return;
    }
    try {
        await axios.post(`${API_BASE}/sendMessage`, {
            chat_id: chatId,
            text,
            parse_mode: 'HTML'
        });
    }
    catch (error) {
        console.error('Telegram send error', error);
    }
}
