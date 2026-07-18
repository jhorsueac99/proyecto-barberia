"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
exports.getServices = getServices;
exports.getAllReservations = getAllReservations;
exports.addReservation = addReservation;
exports.deleteReservation = deleteReservation;
exports.findOverlaps = findOverlaps;
exports.getReservationById = getReservationById;
exports.updateReservationStatus = updateReservationStatus;
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.join(__dirname, '..', 'data.json');
const defaultData = {
    services: [
        { id: 1, name: 'Corte clásico', duration_minutes: 30 },
        { id: 2, name: 'Corte + barba', duration_minutes: 45 },
        { id: 3, name: 'Afeitado', duration_minutes: 20 }
    ],
    reservations: []
};
let lowdbModule = null;
let db = null;
async function getDb() {
    if (!lowdbModule) {
        lowdbModule = await Promise.resolve().then(() => __importStar(require('lowdb')));
    }
    if (!db) {
        const { Low, JSONFile } = lowdbModule;
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
    await db.write();
    return db;
}
async function initDb() {
    await getDb();
}
async function getServices() {
    const currentDb = await getDb();
    return currentDb.data?.services ?? [];
}
async function getAllReservations() {
    const currentDb = await getDb();
    return currentDb.data?.reservations ?? [];
}
async function addReservation(reservation) {
    const currentDb = await getDb();
    const nextId = (currentDb.data.reservations.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1;
    const created_at = new Date().toISOString();
    const newReservation = { id: nextId, ...reservation, created_at };
    currentDb.data.reservations.push(newReservation);
    await currentDb.write();
    return newReservation;
}
async function deleteReservation(id) {
    const currentDb = await getDb();
    const before = currentDb.data.reservations.length;
    currentDb.data.reservations = currentDb.data.reservations.filter((item) => item.id !== id);
    await currentDb.write();
    return before !== currentDb.data.reservations.length;
}
async function findOverlaps(serviceId, startIso, endIso) {
    const currentDb = await getDb();
    const reservations = currentDb.data.reservations || [];
    return reservations.filter((reservation) => {
        return (reservation.service_id === serviceId &&
            ((reservation.start_iso <= startIso && reservation.end_iso > startIso) ||
                (reservation.start_iso < endIso && reservation.end_iso >= endIso) ||
                (reservation.start_iso >= startIso && reservation.end_iso <= endIso)));
    });
}
async function getReservationById(id) {
    const currentDb = await getDb();
    const reservation = (currentDb.data.reservations || []).find((item) => item.id === id);
    return reservation || null;
}
async function updateReservationStatus(id, status) {
    const currentDb = await getDb();
    const index = (currentDb.data.reservations || []).findIndex((item) => item.id === id);
    if (index === -1) {
        return null;
    }
    currentDb.data.reservations[index].status = status;
    await currentDb.write();
    return currentDb.data.reservations[index];
}
