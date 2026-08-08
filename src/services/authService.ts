export function verifyTelegramUser(telegramId: string | undefined | null): boolean {
  if (!telegramId) return false;

  const normalized = String(telegramId).trim();
  return /^\d{5,}$/.test(normalized);
}
