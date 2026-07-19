"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var db_1 = require("../services/db");
var telegramService_1 = require("../services/telegramService");
function addMinutes(iso, minutes) {
    var date = new Date(iso);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
}
exports.default = {
    registerRoutes: function (app) {
        app.get('/api/services', this.services.bind(this));
        app.get('/api/reservations', this.list.bind(this));
        app.get('/api/reservations/export', this.exportCsv.bind(this));
        app.post('/api/reservations', this.create.bind(this));
        app.delete('/api/reservations/:id', this.remove.bind(this));
        app.patch('/api/reservations/:id', this.confirm.bind(this));
        app.post('/api/reservations/:id/confirm', this.confirm.bind(this));
        app.get('/api/reservations/:id', this.getById.bind(this));
    },
    services: function (_req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var services;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, db_1.getServices)()];
                    case 1:
                        services = _a.sent();
                        return [2 /*return*/, res.json({ services: services })];
                }
            });
        });
    },
    list: function (_req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var reservations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, db_1.getAllReservations)()];
                    case 1:
                        reservations = _a.sent();
                        return [2 /*return*/, res.json({ reservations: reservations })];
                }
            });
        });
    },
    exportCsv: function (_req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var reservations, header, rows, csv;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, db_1.getAllReservations)()];
                    case 1:
                        reservations = _a.sent();
                        header = ['id', 'cliente', 'telefono', 'servicio', 'inicio', 'estado'];
                        rows = reservations.map(function (reservation) { return [
                            reservation.id,
                            reservation.customer_name,
                            reservation.phone,
                            reservation.service_id,
                            reservation.start_iso,
                            reservation.status
                        ]; });
                        csv = __spreadArray([header], rows, true).map(function (row) { return row.map(function (value) { return "\"".concat(String(value).replace(/"/g, '""'), "\""); }).join(','); })
                            .join('\n');
                        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                        res.setHeader('Content-Disposition', 'attachment; filename="reservations.csv"');
                        return [2 /*return*/, res.send(csv)];
                }
            });
        });
    },
    create: function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, serviceId_1, customerName, _b, phone, startIso, name_1, cleanPhone, parsedStart, services, service, endIso, overlaps, reservation, targetChat, error_1, error_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 8, , 9]);
                        _a = req.body, serviceId_1 = _a.serviceId, customerName = _a.customerName, _b = _a.phone, phone = _b === void 0 ? '' : _b, startIso = _a.startIso;
                        name_1 = String(customerName || '').trim();
                        cleanPhone = String(phone || '').trim();
                        parsedStart = new Date(startIso);
                        if (!serviceId_1 || !name_1 || !startIso) {
                            return [2 /*return*/, res.status(400).json({ error: 'Faltan datos: servicio, nombre y fecha' })];
                        }
                        if (name_1.length < 3) {
                            return [2 /*return*/, res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres.' })];
                        }
                        if (!/^\d{9,}$/.test(cleanPhone)) {
                            return [2 /*return*/, res.status(400).json({ error: 'El teléfono debe ser numérico y tener al menos 9 dígitos.' })];
                        }
                        if (Number.isNaN(parsedStart.getTime()) || parsedStart <= new Date()) {
                            return [2 /*return*/, res.status(400).json({ error: 'La fecha debe ser futura y válida.' })];
                        }
                        return [4 /*yield*/, (0, db_1.getServices)()];
                    case 1:
                        services = _c.sent();
                        service = services.find(function (item) { return Number(item.id) === Number(serviceId_1); });
                        if (!service) {
                            return [2 /*return*/, res.status(404).json({ error: 'Servicio no encontrado' })];
                        }
                        endIso = addMinutes(startIso, service.duration_minutes);
                        return [4 /*yield*/, (0, db_1.findOverlaps)(service.id, startIso, endIso)];
                    case 2:
                        overlaps = _c.sent();
                        if (overlaps.length > 0) {
                            return [2 /*return*/, res.status(409).json({ error: 'Horario no disponible', overlaps: overlaps })];
                        }
                        return [4 /*yield*/, (0, db_1.addReservation)({
                                service_id: service.id,
                                customer_name: name_1,
                                phone: cleanPhone,
                                start_iso: startIso,
                                end_iso: endIso,
                                status: 'pending',
                                chat_id: process.env.TELEGRAM_CHAT_ID || null
                            })];
                    case 3:
                        reservation = _c.sent();
                        targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
                        if (!targetChat) return [3 /*break*/, 7];
                        _c.label = 4;
                    case 4:
                        _c.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, (0, telegramService_1.sendTelegramMessage)(String(targetChat), "Nueva reserva\nID: ".concat(reservation.id, "\nCliente: ").concat(reservation.customer_name, "\nServicio: ").concat(service.name, "\nInicio: ").concat(reservation.start_iso))];
                    case 5:
                        _c.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _c.sent();
                        console.error('Error enviando Telegram', error_1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, res.status(201).json({ reservation: reservation })];
                    case 8:
                        error_2 = _c.sent();
                        console.error('Error creando reserva', error_2);
                        return [2 /*return*/, res.status(500).json({ error: 'Error interno' })];
                    case 9: return [2 /*return*/];
                }
            });
        });
    },
    remove: function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, reservation, removed, targetChat, error_3, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        id = Number(req.params.id);
                        if (!id) {
                            return [2 /*return*/, res.status(400).json({ error: 'ID inválido' })];
                        }
                        return [4 /*yield*/, (0, db_1.getReservationById)(id)];
                    case 1:
                        reservation = _a.sent();
                        if (!reservation) {
                            return [2 /*return*/, res.status(404).json({ error: 'Reserva no encontrada' })];
                        }
                        return [4 /*yield*/, (0, db_1.deleteReservation)(id)];
                    case 2:
                        removed = _a.sent();
                        if (!removed) {
                            return [2 /*return*/, res.status(404).json({ error: 'Reserva no encontrada' })];
                        }
                        targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
                        if (!targetChat) return [3 /*break*/, 6];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, (0, telegramService_1.sendTelegramMessage)(String(targetChat), "Reserva cancelada\nID: ".concat(reservation.id, "\nCliente: ").concat(reservation.customer_name, "\nInicio: ").concat(reservation.start_iso))];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        console.error('Error enviando Telegram (cancelación)', error_3);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, res.json({ ok: true, deletedId: id })];
                    case 7:
                        error_4 = _a.sent();
                        console.error('Error eliminando reserva', error_4);
                        return [2 /*return*/, res.status(500).json({ error: 'Error interno' })];
                    case 8: return [2 /*return*/];
                }
            });
        });
    },
    confirm: function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, reservation, updated, targetChat, error_5, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        id = Number(req.params.id);
                        if (!id) {
                            return [2 /*return*/, res.status(400).json({ error: 'ID inválido' })];
                        }
                        return [4 /*yield*/, (0, db_1.getReservationById)(id)];
                    case 1:
                        reservation = _a.sent();
                        if (!reservation) {
                            return [2 /*return*/, res.status(404).json({ error: 'Reserva no encontrada' })];
                        }
                        return [4 /*yield*/, (0, db_1.updateReservationStatus)(id, 'confirmed')];
                    case 2:
                        updated = _a.sent();
                        targetChat = reservation.chat_id || process.env.TELEGRAM_CHAT_ID || '';
                        if (!targetChat) return [3 /*break*/, 6];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, (0, telegramService_1.sendTelegramMessage)(String(targetChat), "Reserva confirmada\nID: ".concat(reservation.id, "\nCliente: ").concat(reservation.customer_name, "\nInicio: ").concat(reservation.start_iso))];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_5 = _a.sent();
                        console.error('Error enviando Telegram (confirmación)', error_5);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, res.json({ ok: true, reservation: updated })];
                    case 7:
                        error_6 = _a.sent();
                        console.error('Error confirmando reserva', error_6);
                        return [2 /*return*/, res.status(500).json({ error: 'Error interno' })];
                    case 8: return [2 /*return*/];
                }
            });
        });
    },
    getById: function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, reservation, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = Number(req.params.id);
                        if (!id) {
                            return [2 /*return*/, res.status(400).json({ error: 'ID inválido' })];
                        }
                        return [4 /*yield*/, (0, db_1.getReservationById)(id)];
                    case 1:
                        reservation = _a.sent();
                        if (!reservation) {
                            return [2 /*return*/, res.status(404).json({ error: 'Reserva no encontrada' })];
                        }
                        return [2 /*return*/, res.json({ reservation: reservation })];
                    case 2:
                        error_7 = _a.sent();
                        console.error('Error obteniendo reserva', error_7);
                        return [2 /*return*/, res.status(500).json({ error: 'Error interno' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
};
