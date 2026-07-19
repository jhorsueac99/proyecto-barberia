"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegramMessage = sendTelegramMessage;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const TOKEN = process.env.TELEGRAM_TOKEN;
const DEFAULT_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API_BASE = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;
async function sendTelegramMessage(chatId = DEFAULT_CHAT_ID || '', text) {
    if (!API_BASE || !chatId) {
        console.log('Telegram not configured.');
        return;
    }
    try {
        await axios_1.default.post(`${API_BASE}/sendMessage`, {
            chat_id: chatId,
            text,
            parse_mode: 'HTML'
        });
    }
    catch (error) {
        console.error('Telegram send error', error);
    }
}
