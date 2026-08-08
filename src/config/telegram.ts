export const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export const ADMIN_ID = process.env.ADMIN_ID || process.env.TELEGRAM_CHAT_ID || '';

export function getAdminId() {
  return process.env.ADMIN_ID || process.env.TELEGRAM_CHAT_ID || '';
}
