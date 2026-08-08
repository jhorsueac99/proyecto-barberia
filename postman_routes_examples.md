# Ejemplos de requests en Postman

Base URL local: http://localhost:3000  
Base URL Render: https://proyecto-barberia.onrender.com  

---

## Health check
GET /api/ping

---

## Login administrador
POST /api/admin/login
Body (JSON):
{
  "username": "admin",
  "password": "admin123"
}

---

## Crear reserva
POST /api/reservations
Body (JSON):
{
  "serviceId": "corte_clasico",
  "customerName": "Alexander",
  "phone": "932868639",
  "startIso": "2026-08-07T15:00:00-05:00",
  "email": "alexander@example.com"
}

---

## Listar reservas (requiere admin)
GET /api/reservations
Headers:
x-admin-pin: TU_PIN_ADMIN

---

## Cancelar reserva (requiere admin)
DELETE /api/reservations/:id
Headers:
x-admin-pin: TU_PIN_ADMIN

---

## Confirmar reserva (requiere admin)
PATCH /api/reservations/:id
Headers:
x-admin-pin: TU_PIN_ADMIN

o alternativa:
POST /api/reservations/:id/confirm
Headers:
x-admin-pin: TU_PIN_ADMIN

---

## Cancelar con token (cliente)
POST /api/cancel/:token
