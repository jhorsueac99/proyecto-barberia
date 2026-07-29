import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { Low } from 'lowdb';
const DB_PATH = path.resolve(process.cwd(), 'src', 'data.json');
class WriteFileAdapter {
    constructor(file) {
        this.file = file;
    }
    async read() {
        try {
            const data = await fs.readFile(this.file, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    async write(data) {
        await fs.writeFile(this.file, JSON.stringify(data, null, 2), 'utf-8');
    }
}
const defaultData = {
    services: [
        { id: 'corte_clasico', name: 'Corte clásico', price: 12, duration_minutes: 30, description: 'Corte tradicional con acabado limpio.' },
        { id: 'corte_clasico_degrade', name: 'Corte clásico degrade', price: 15, duration_minutes: 35, description: 'Corte clásico con efecto degrade moderno.' },
        { id: 'corte_degradado_cejas', name: 'Corte degradado + cejas', price: 18, duration_minutes: 40, description: 'Corte degradado con perfilado de cejas incluido.' },
        { id: 'vip_degradado_cejas_exfoliante', name: 'Servicio VIP', price: 25, duration_minutes: 50, description: 'Degradado + cejas + exfoliante facial premium.' },
        { id: 'presidencial_completo', name: 'Servicio Presidencial completo', price: 30, duration_minutes: 60, description: 'Degradado + cejas + exfoliante + mascarilla negra + lavado de cabello + bebida de cortesía.' }
    ],
    reservations: []
};
let db = null;
async function getDb() {
    if (!db) {
        const adapter = new WriteFileAdapter(DB_PATH);
        db = new Low(adapter);
    }
    await db.read();
    if (!db.data) {
        db.data = { ...defaultData, services: [...defaultData.services], reservations: [] };
    }
    db.data.services = [...defaultData.services];
    if (!Array.isArray(db.data.reservations)) {
        db.data.reservations = [];
    }
    db.data.reservations.forEach((reservation) => {
        reservation.cancel_token || (reservation.cancel_token = randomUUID());
        reservation.reminder_sent_at ?? (reservation.reminder_sent_at = null);
    });
    await db.write();
    return db;
}
export async function initDb() {
    await getDb();
}
export async function getServices() {
    const currentDb = await getDb();
    return currentDb.data?.services ?? [];
}
export async function getAllReservations() {
    const currentDb = await getDb();
    return currentDb.data?.reservations ?? [];
}
export async function addReservation(reservation) {
    const currentDb = await getDb();
    const nextId = (currentDb.data.reservations.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1;
    const created_at = new Date().toISOString();
    const newReservation = { id: nextId, ...reservation, created_at };
    currentDb.data.reservations.push(newReservation);
    await currentDb.write();
    return newReservation;
}
export async function findOverlaps(serviceId, startIso, endIso) {
    const currentDb = await getDb();
    const reservations = currentDb.data.reservations || [];
    return reservations.filter((reservation) => {
        return (reservation.service_id === serviceId &&
            reservation.status !== 'cancelled' &&
            ((reservation.start_iso <= startIso && reservation.end_iso > startIso) ||
                (reservation.start_iso < endIso && reservation.end_iso >= endIso) ||
                (reservation.start_iso >= startIso && reservation.end_iso <= endIso)));
    });
}
export async function getReservationById(id) {
    const currentDb = await getDb();
    const reservation = (currentDb.data.reservations || []).find((item) => item.id === id);
    return reservation || null;
}
export async function updateReservationStatus(id, status) {
    const currentDb = await getDb();
    const index = (currentDb.data.reservations || []).findIndex((item) => item.id === id);
    if (index === -1) {
        return null;
    }
    currentDb.data.reservations[index].status = status;
    await currentDb.write();
    return currentDb.data.reservations[index];
}
export async function getReservationByCancelToken(cancelToken) {
    const currentDb = await getDb();
    return currentDb.data.reservations.find((item) => item.cancel_token === cancelToken) || null;
}
export async function markReminderSent(id) {
    const currentDb = await getDb();
    const reservation = currentDb.data.reservations.find((item) => item.id === id);
    if (!reservation)
        return null;
    reservation.reminder_sent_at = new Date().toISOString();
    await currentDb.write();
    return reservation;
}
