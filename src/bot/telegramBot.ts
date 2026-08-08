import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME } from '../config/telegram.js';
import { cancelReservationByTelegramId } from '../services/reservationService.js';
import { linkTelegramUser } from '../services/db.js';

interface BotMessage {
  chat: { id: number };
  from?: { id: number; username?: string };
}

export function startTelegramBot() {
  const token = TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('Bot de Telegram no configurado (TELEGRAM_BOT_TOKEN).');
    return null;
  }

  const username = (TELEGRAM_BOT_USERNAME || '').replace(/^@/, '');
  const bot = new TelegramBot(token, { polling: true });

  async function linkClient(msg: BotMessage) {
    const from = msg.from;
    if (!from) return;

    const telegramId = String(from.id);
    const clientUsername = from.username;

    try {
      if (clientUsername) {
        const linked = await linkTelegramUser(clientUsername, telegramId);
        if (linked.length > 0) {
          console.log(`✅ Bot de Telegram: vinculado @${clientUsername} (${telegramId}) a ${linked.length} reserva(s).`);
        }
        return { telegramId, clientUsername, linked };
      }
      console.log(`Bot de Telegram: mensaje de ${telegramId} sin username; no se puede vincular por nombre.`);
      return { telegramId, clientUsername: null, linked: [] };
    } catch (error) {
      console.error('Error vinculando Telegram - telegramBot.ts', error);
      return { telegramId, clientUsername: clientUsername || null, linked: [] };
    }
  }

  // Vincular automáticamente el Telegram ID numérico con el username del cliente
  bot.on('message', async (msg) => {
    await linkClient(msg);

    const text = (msg.text || '').trim();
    if (text && !text.startsWith('/')) {
      bot.sendMessage(msg.chat.id, 'Para comenzar, escribe /start y tu cuenta quedará vinculada automáticamente.');
    }
  });

  // Comando /start: vincula la cuenta y confirma
  bot.onText(/\/start/, async (msg) => {
    await linkClient(msg);
    bot.sendMessage(msg.chat.id, '¡Perfecto! Tu cuenta de Telegram ha sido vinculada. Ahora recibirás recordatorios de tus citas.');
    console.log(`✅ Bot de Telegram: bienvenida enviada a ${msg.chat.id}`);
  });

  // Comando /myid
  bot.onText(/\/myid/, (msg) => {
    bot.sendMessage(msg.chat.id, `Tu Telegram ID es: ${msg.chat.id}`);
    console.log(`✅ Bot de Telegram: ID enviado a ${msg.chat.id} → ${msg.chat.id}`);
  });

  // Comando /cancel
  bot.onText(/\/cancel/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const result = await cancelReservationByTelegramId(chatId);

      if (result) {
        bot.sendMessage(chatId, '❌ Tu cita ha sido cancelada. La franja horaria está disponible para otros clientes.');
      } else {
        bot.sendMessage(chatId, '⚠️ No tienes ninguna cita activa para cancelar.');
      }
    } catch (error) {
      console.error('Error cancelando cita desde el bot - telegramBot.ts', error);
      bot.sendMessage(chatId, 'Ocurrió un error al cancelar tu cita. Inténtalo más tarde.');
    }
  });

  // Comando /help
  bot.onText(/\/help/, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      'Comandos disponibles:\n/start - Bienvenida\n/myid - Obtener tu ID\n/cancel - Cancelar cita\n/help - Ver ayuda'
    );
  });

  bot.onText(/\/username/, (msg) => {
    bot.sendMessage(msg.chat.id, `Username del bot: @${username || 'no configurado'}`);
  });

  console.log(`Bot de Telegram listo (${username ? `@${username}` : 'sin username'}).`);
  return bot;
}
