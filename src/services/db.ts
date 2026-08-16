import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { Low } from 'lowdb';

const DB_PATH = path.resolve(process.cwd(), 'src', 'data.json');

class WriteFileAdapter<T> {
  constructor(private file: string) {}
  async read(): Promise<T | null> {
    try {
      const data = await fs.readFile(this.file, 'utf-8');
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }
  async write(data: T): Promise<void> {
    await fs.writeFile(this.file, JSON.stringify(data, null, 2), 'utf-8');
  }
}

export type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description?: string;
};

export type User = {
  id: string;
  username?: string;
  telegram_id: string;
  chat_id: string;
  created_at?: string;
};

export type Reservation = {
  id: number;
  service_id: string;
  service_name: string;
  service_price: number;
  service_description?: string | null;
  customer_name: string;
  phone: string;
  start_iso: string;
  end_iso: string;
  status: string;
  chat_id?: string | null;
  created_at?: string;
  cancel_token: string;
  reminder_sent_at?: string | null;
  barberiaId?: string;
  late_cancelled?: boolean;
  telegram_id?: string;
  telegram_username?: string;
  short_notice?: boolean;
  short_notice_accepted?: boolean;
};

type DBData = {
  services: Service[];
  reservations: Reservation[];
  users: User[];
};

const defaultData: DBData = {
  services: [
    { id: 'corte_clasico', name: 'Corte clásico', price: 12, duration_minutes: 30, description: 'Corte tradicional con acabado limpio.' },
    { id: 'corte_clasico_degrade', name: 'Corte clásico degrade', price: 15, duration_minutes: 35, description: 'Corte clásico con efecto degrade moderno.' },
    { id: 'corte_degradado_cejas', name: 'Corte degradado + cejas', price: 18, duration_minutes: 40, description: 'Corte degradado con perfilado de cejas incluido.' },
    { id: 'vip_degradado_cejas_exfoliante', name: 'Servicio VIP', price: 25, duration_minutes: 50, description: 'Degradado + cejas + exfoliante facial premium.' },
    { id: 'presidencial_completo', name: 'Servicio Presidencial completo', price: 30, duration_minutes: 60, description: 'Degradado + cejas + exfoliante + mascarilla negra + lavado de cabello + bebida de cortesía.' }
  ],
  reservations: [],
  users: []
};

let db: any = null;

export async function getDb() {
  if (!db) {
    const adapter = new WriteFileAdapter<DBData>(DB_PATH);
    db = new Low<DBData>(adapter);
  }

  await db.read();
  if (!db.data) {
    db.data = { ...defaultData, services: [...defaultData.services], reservations: [] };
  }

  db.data.services = [...defaultData.services];

  if (!Array.isArray(db.data.reservations)) {
    db.data.reservations = [];
  }

  if (!Array.isArray(db.data.users)) {
    db.data.users = [];
  }

  db.data.reservations.forEach((reservation: Reservation) => {
    reservation.cancel_token ||= randomUUID();
    reservation.reminder_sent_at ??= null;
  });

  await db.write();
  return db;
}

export async function initDb() {
  await getDb();
}

export async function getServices(): Promise<Service[]> {
  const currentDb = await getDb();
  return currentDb.data?.services ?? [];
}

export async function getAllReservations(): Promise<Reservation[]> {
  const currentDb = await getDb();
  return currentDb.data?.reservations ?? [];
}

export async function addReservation(reservation: Omit<Reservation, 'id' | 'created_at'>): Promise<Reservation> {
  const currentDb = await getDb();
  const nextId = (currentDb.data.reservations.reduce((max: number, item: Reservation) => Math.max(max, item.id), 0) || 0) + 1;
  const created_at = new Date().toISOString();
  const newReservation: Reservation = { id: nextId, ...reservation, created_at };

  currentDb.data.reservations.push(newReservation);
  await currentDb.write();
  return newReservation;
}

export async function findOverlaps(serviceId: string, startIso: string, endIso: string) {
  const currentDb = await getDb();
  const reservations: Reservation[] = currentDb.data.reservations || [];

  return reservations.filter((reservation) => {
    return (
      reservation.service_id === serviceId &&
      reservation.status !== 'cancelled' &&
      ((reservation.start_iso <= startIso && reservation.end_iso > startIso) ||
        (reservation.start_iso < endIso && reservation.end_iso >= endIso) ||
        (reservation.start_iso >= startIso && reservation.end_iso <= endIso))
    );
  });
}

export async function findHourBlocked(startIso: string): Promise<Reservation[]> {
  const currentDb = await getDb();
  const reservations: Reservation[] = currentDb.data.reservations || [];

  const start = new Date(startIso);
  const hourStart = new Date(start);
  hourStart.setMinutes(0, 0, 0);
  const hourEnd = new Date(hourStart);
  hourEnd.setHours(hourEnd.getHours() + 1);

  return reservations.filter((reservation) => {
    if (reservation.status === 'cancelled') return false;

    const reservationStart = new Date(reservation.start_iso);
    return reservationStart >= hourStart && reservationStart < hourEnd;
  });
}

export async function getReservationById(id: number): Promise<Reservation | null> {
  const currentDb = await getDb();
  const reservation = (currentDb.data.reservations || []).find((item: Reservation) => item.id === id);
  return reservation || null;
}

export async function updateReservationStatus(id: number, status: string) {
  const currentDb = await getDb();
  const index = (currentDb.data.reservations || []).findIndex((item: Reservation) => item.id === id);
  if (index === -1) {
    return null;
  }

  currentDb.data.reservations[index].status = status;
  await currentDb.write();
  return currentDb.data.reservations[index];
}

export async function cancelReservationWithFlag(id: number, late: boolean) {
  const currentDb = await getDb();
  const index = (currentDb.data.reservations || []).findIndex((item: Reservation) => item.id === id);
  if (index === -1) {
    return null;
  }

  currentDb.data.reservations[index].status = 'cancelled';
  currentDb.data.reservations[index].late_cancelled = late;
  await currentDb.write();
  return currentDb.data.reservations[index];
}

export async function getReservationByCancelToken(cancelToken: string): Promise<Reservation | null> {
  const currentDb = await getDb();
  return currentDb.data.reservations.find((item: Reservation) => item.cancel_token === cancelToken) || null;
}

export async function markReminderSent(id: number) {
  const currentDb = await getDb();
  const reservation = currentDb.data.reservations.find((item: Reservation) => item.id === id);
  if (!reservation) return null;

  reservation.reminder_sent_at = new Date().toISOString();
  await currentDb.write();
  return reservation;
}

export async function linkTelegramUser(username: string, telegramId: string): Promise<Reservation[]> {
  const currentDb = await getDb();
  const normalized = username.replace(/^@/, '').toLowerCase();
  const linked: Reservation[] = [];

  for (const reservation of currentDb.data.reservations) {
    const reservationUsername = (reservation.telegram_username || '').replace(/^@/, '').toLowerCase();
    if (reservationUsername && reservationUsername === normalized && reservation.status !== 'cancelled') {
      reservation.telegram_id = String(telegramId);
      reservation.chat_id = String(telegramId);
      linked.push(reservation);
    }
  }

  if (linked.length > 0) {
    await currentDb.write();
  }

  return linked;
}

export async function upsertUser(data: { id?: string; username?: string; telegram_id: string; chat_id: string }): Promise<User> {
  const currentDb = await getDb();
  const users: User[] = currentDb.data.users || [];
  const existing = users.find((u) => u.telegram_id === data.telegram_id);

  if (existing) {
    if (data.username) existing.username = data.username;
    existing.chat_id = data.chat_id;
    await currentDb.write();
    return existing;
  }

  const user: User = {
    id: data.id || String(Date.now()),
    username: data.username,
    telegram_id: data.telegram_id,
    chat_id: data.chat_id,
    created_at: new Date().toISOString()
  };
  users.push(user);
  await currentDb.write();
  return user;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const currentDb = await getDb();
  const normalized = username.replace(/^@/, '').toLowerCase();
  return (currentDb.data.users || []).find((u) => (u.username || '').replace(/^@/, '').toLowerCase() === normalized) || null;
}

export async function findUserByTelegramId(telegramId: string): Promise<User | null> {
  const currentDb = await getDb();
  return (currentDb.data.users || []).find((u) => u.telegram_id === telegramId) || null;
}
