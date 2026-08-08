# Rutas del sistema (Express)

Listado completo de los endpoints definidos en el proyecto, para probarlos en Postman.

> Base URL local: `http://localhost:3000`
> Base URL Render: `https://proyecto-barberia.onrender.com`

---

## `src/server.ts`

| Método | Path                | Controlador / Función                 | Notas                              |
| ------ | ------------------- | ------------------------------------- | ---------------------------------- |
| GET    | `/api/ping`         | Función inline (arrow)                | Health check: `{ ok: true, message: "pong" }` |
| POST   | `/api/admin/login`  | Función inline (arrow)                | Body: `{ "username", "password" }`. Valida contra `ADMIN_USER` / `ADMIN_PASS`. Devuelve `{ success: true/false }` |

---

## `src/controllers/reservations.ts` (registradas vía `registerRoutes`)

| Método | Path                          | Controlador / Función | Autenticación | Notas |
| ------ | ----------------------------- | --------------------- | ------------- | ----- |
| GET    | `/api/services`               | `services`            | No            | Devuelve la lista de servicios (array) |
| GET    | `/api/reservations`           | `list`                | Admin (header `x-admin-pin`) | Lista reservas con nombre de servicio |
| GET    | `/api/reservations/export`    | `exportCsv`           | Admin (header `x-admin-pin`) | Descarga CSV de reservas |
| POST   | `/api/reservations`           | `create`              | No            | Crea una reserva (ver body más abajo) |
| DELETE | `/api/reservations/:id`       | `remove`              | Admin (header `x-admin-pin`) | Cancela una reserva por ID |
| PATCH  | `/api/reservations/:id`       | `confirm`             | Admin (header `x-admin-pin`) | Confirma una reserva por ID |
| POST   | `/api/reservations/:id/confirm` | `confirm`           | Admin (header `x-admin-pin`) | Alternativa para confirmar |
| GET    | `/api/reservations/:id`       | `getById`             | Admin (header `x-admin-pin`) | Detalle de una reserva |
| GET    | `/cancel/:token`              | `cancelPage`          | No            | Página HTML de cancelación del cliente |
| POST   | `/api/cancel/:token`          | `cancelByToken`       | No            | Ejecuta la cancelación desde el enlace |

---

## Autenticación de administrador

Las rutas marcadas como "Admin" exigen el header:

```
x-admin-pin: TU_PIN_ADMIN
```

> Nota: el middleware `requireAdmin` usa la variable `ADMIN_PIN`. En producción se recomienda usar un token seguro.

---

## Body de ejemplo para `POST /api/reservations`

```json
{
  "serviceId": "corte_clasico",
  "customerName": "Alexander",
  "phone": "932868639",
  "startIso": "2026-08-07T15:00:00-05:00"
}
```

- `serviceId`: uno de los IDs de `GET /api/services` (`corte_clasico`, `corte_clasico_degrade`, `corte_degradado_cejas`, `vip_degradado_cejas_exfoliante`, `presidencial_completo`).
- `phone`: numérico, al menos 9 dígitos (sin `+51`, el sistema agrega el prefijo). Es obligatorio; el sistema ya no usa correo electrónico.
- `startIso`: fecha futura dentro del horario de atención (lunes a sábado, 9:00 a.m. – 8:00 p.m., hora Perú).

---

## Flujo de notificaciones al probar

- Crear reserva → WhatsApp Twilio (registro) + Telegram.
- Cancelar (`DELETE /api/reservations/:id`) → WhatsApp Twilio (cancelación).
- Confirmar (`PATCH /api/reservations/:id` o `POST /:id/confirm`) → WhatsApp Twilio (confirmación).
