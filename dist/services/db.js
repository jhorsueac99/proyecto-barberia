import path from 'path';
import { randomUUID } from 'crypto';
import { JSONFile, Low } from 'lowdb';
const DB_PATH = path.resolve(process.cwd(), 'src', 'data.json');
const defaultData = {
    services: [
        { id: 1, name: 'Corte clásico', duration_minutes: 30 },
        { id: 2, name: 'Corte + barba', duration_minutes: 45 },
        { id: 3, name: 'Afeitado', duration_minutes: 20 }
    ],
    reservations: []
};
let db = null;
async function getDb() {
    if (!db) {
        const adapter = new JSONFile(DB_PATH);
        db = new Low(adapter);
    }
    await db.read();
    if (!db.data) {
        db.data = { ...defaultData, services: [...defaultData.services], reservations: [] };
    }
    if (!Array.isArray(db.data.services)) {
        db.data.services = [...defaultData.services];
    }
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
