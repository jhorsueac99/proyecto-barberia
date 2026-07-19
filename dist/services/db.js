"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
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
var path_1 = __importDefault(require("path"));
var DB_PATH = path_1.default.resolve(process.cwd(), 'src', 'data.json');
var defaultData = {
    services: [
        { id: 1, name: 'Corte clásico', duration_minutes: 30 },
        { id: 2, name: 'Corte + barba', duration_minutes: 45 },
        { id: 3, name: 'Afeitado', duration_minutes: 20 }
    ],
    reservations: []
};
var lowdbModule = null;
var db = null;
function getDb() {
    return __awaiter(this, void 0, void 0, function () {
        var Low, JSONFile, adapter;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!lowdbModule) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('lowdb')); })];
                case 1:
                    lowdbModule = _a.sent();
                    _a.label = 2;
                case 2:
                    if (!db) {
                        Low = lowdbModule.Low, JSONFile = lowdbModule.JSONFile;
                        adapter = new JSONFile(DB_PATH);
                        db = new Low(adapter);
                    }
                    return [4 /*yield*/, db.read()];
                case 3:
                    _a.sent();
                    if (!db.data) {
                        db.data = __assign(__assign({}, defaultData), { services: __spreadArray([], defaultData.services, true), reservations: [] });
                    }
                    if (!Array.isArray(db.data.services)) {
                        db.data.services = __spreadArray([], defaultData.services, true);
                    }
                    if (!Array.isArray(db.data.reservations)) {
                        db.data.reservations = [];
                    }
                    return [4 /*yield*/, db.write()];
                case 4:
                    _a.sent();
                    return [2 /*return*/, db];
            }
        });
    });
}
function initDb() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getServices() {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _c.sent();
                    return [2 /*return*/, (_b = (_a = currentDb.data) === null || _a === void 0 ? void 0 : _a.services) !== null && _b !== void 0 ? _b : []];
            }
        });
    });
}
function getAllReservations() {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _c.sent();
                    return [2 /*return*/, (_b = (_a = currentDb.data) === null || _a === void 0 ? void 0 : _a.reservations) !== null && _b !== void 0 ? _b : []];
            }
        });
    });
}
function addReservation(reservation) {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, nextId, created_at, newReservation;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _a.sent();
                    nextId = (currentDb.data.reservations.reduce(function (max, item) { return Math.max(max, item.id); }, 0) || 0) + 1;
                    created_at = new Date().toISOString();
                    newReservation = __assign(__assign({ id: nextId }, reservation), { created_at: created_at });
                    currentDb.data.reservations.push(newReservation);
                    return [4 /*yield*/, currentDb.write()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, newReservation];
            }
        });
    });
}
function deleteReservation(id) {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, before;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _a.sent();
                    before = currentDb.data.reservations.length;
                    currentDb.data.reservations = currentDb.data.reservations.filter(function (item) { return item.id !== id; });
                    return [4 /*yield*/, currentDb.write()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, before !== currentDb.data.reservations.length];
            }
        });
    });
}
function findOverlaps(serviceId, startIso, endIso) {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, reservations;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _a.sent();
                    reservations = currentDb.data.reservations || [];
                    return [2 /*return*/, reservations.filter(function (reservation) {
                            return (reservation.service_id === serviceId &&
                                ((reservation.start_iso <= startIso && reservation.end_iso > startIso) ||
                                    (reservation.start_iso < endIso && reservation.end_iso >= endIso) ||
                                    (reservation.start_iso >= startIso && reservation.end_iso <= endIso)));
                        })];
            }
        });
    });
}
function getReservationById(id) {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, reservation;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _a.sent();
                    reservation = (currentDb.data.reservations || []).find(function (item) { return item.id === id; });
                    return [2 /*return*/, reservation || null];
            }
        });
    });
}
function updateReservationStatus(id, status) {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _a.sent();
                    index = (currentDb.data.reservations || []).findIndex(function (item) { return item.id === id; });
                    if (index === -1) {
                        return [2 /*return*/, null];
                    }
                    currentDb.data.reservations[index].status = status;
                    return [4 /*yield*/, currentDb.write()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, currentDb.data.reservations[index]];
            }
        });
    });
}
