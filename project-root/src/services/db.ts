// src/services/db.ts (fragmentos a añadir o reemplazar)
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data.json');

type Service = { id: number; name: string; duration_minutes: number };
type Reservation = {
  id: number;
  service_id: number;
  customer_name: string;
  phone: string;
  start_iso: string;
  end_iso: string;
  status: string;
  chat_id?: string | null;
  created_at?: string;
};

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    const init = { services: [], reservations: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(db: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function initDb() {
  const db = readDb();
  if (!Array.isArray(db.services)) db.services = [];
  if (!Array.isArray(db.reservations)) db.reservations = [];
  writeDb(db);
}

export function getServices(): Service[] {
  const db = readDb();
  return db.services || [];
}

export function addReservation(res: Omit<Reservation, 'id' | 'created_at'>): Reservation {
  const db = readDb();
  const nextId = (db.reservations.reduce((m: number, r: any) => Math.max(m, r.id), 0) || 0) + 1;
  const created_at = new Date().toISOString();
  const newRes: Reservation = { id: nextId, ...res, created_at };
  db.reservations.push(newRes);
  writeDb(db);
  return newRes;
}

export function findOverlaps(serviceId: number, startIso: string, endIso: string) {
  const db = readDb();
  const reservations: Reservation[] = db.reservations || [];
  return reservations.filter(r => r.service_id === serviceId && (
    (r.start_iso <= startIso && r.end_iso > startIso) ||
    (r.start_iso < endIso && r.end_iso >= endIso) ||
    (r.start_iso >= startIso && r.end_iso <= endIso)
  ));
}

export function getReservationById(id: number): Reservation | null {
  const db = readDb();
  return (db.reservations || []).find((r: Reservation) => r.id === id) || null;
}

export function updateReservationStatus(id: number, status: string) {
  const db = readDb();
  const idx = (db.reservations || []).findIndex((r: any) => r.id === id);
  if (idx === -1) return null;
  db.reservations[idx].status = status;
  db.reservations[idx].updated_at = new Date().toISOString();
  writeDb(db);
  return db.reservations[idx];
}

export function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    const init = { services: [], reservations: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}
