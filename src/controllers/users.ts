import { randomUUID } from 'crypto';
import { User } from '../services/db.js';
import { getDb } from '../services/db.js';

export async function getUserByUsername(username: string): Promise<User | null> {
  const currentDb = await getDb();

  if (!Array.isArray(currentDb.data.users)) {
    currentDb.data.users = [];
  }

  const normalized = username.replace(/^@/, '').toLowerCase();
  return currentDb.data.users.find(
    (u) => (u.username || '').replace(/^@/, '').toLowerCase() === normalized
  ) || null;
}

export async function linkTelegramUser(username: string, telegram_id: string, chat_id: string): Promise<User> {
  const currentDb = await getDb();

  if (!Array.isArray(currentDb.data.users)) {
    currentDb.data.users = [];
  }

  const normalized = username.replace(/^@/, '').toLowerCase();
  const existing = currentDb.data.users.find(
    (u) => (u.username || '').replace(/^@/, '').toLowerCase() === normalized
  );

  if (existing) {
    existing.telegram_id = telegram_id;
    existing.chat_id = chat_id;
    await currentDb.write();
    return existing;
  }

  const user: User = {
    id: randomUUID(),
    username,
    telegram_id,
    chat_id,
    created_at: new Date().toISOString()
  };
  currentDb.data.users.push(user);
  await currentDb.write();
  return user;
}
