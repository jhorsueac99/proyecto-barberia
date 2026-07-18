import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data.json');

type Service = {
  id: number;
  name: string;
  duration_minutes: number;
};

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

type DBData = {
  services: Service[];
  reservations: Reservation[];
};

const defaultData: DBData = {
  services: [
    { id: 1, name: 'Corte clásico', duration_minutes: 30 },
    { id: 2, name: 'Corte + barba', duration_minutes: 45 },
    { id: 3, name: 'Afeitado', duration_minutes: 20 }
  ],
  reservations: []
};

let lowdbModule: typeof import('lowdb') | null = null;
let db: any = null;

async function getDb() {
  if (!lowdbModule) {
    lowdbModule = await import('lowdb');
  }

  if (!db) {
    const { Low, JSONFile } = lowdbModule;
    const adapter = new JSONFile<DBData>(DB_PATH);
    db = new Low<DBData>(adapter);
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

export async function deleteReservation(id: number): Promise<boolean> {
  const currentDb = await getDb();
  const before = currentDb.data.reservations.length;
  currentDb.data.reservations = currentDb.data.reservations.filter((item: Reservation) => item.id !== id);
  await currentDb.write();
  return before !== currentDb.data.reservations.length;
}

export async function findOverlaps(serviceId: number, startIso: string, endIso: string) {
  const currentDb = await getDb();
  const reservations: Reservation[] = currentDb.data.reservations || [];

  return reservations.filter((reservation) => {
    return (
      reservation.service_id === serviceId &&
      ((reservation.start_iso <= startIso && reservation.end_iso > startIso) ||
        (reservation.start_iso < endIso && reservation.end_iso >= endIso) ||
        (reservation.start_iso >= startIso && reservation.end_iso <= endIso))
    );
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
