# Ejemplos de requests en Postman (Multi-Barbería)

Base URL local: http://localhost:3000  
Base URL Render: https://proyecto-barberia.onrender.com  

---

## Crear reserva en Barbería A
POST /api/reservations
Body (JSON):
{
  "barberiaId": "barberiaA",
  "serviceId": "corte_clasico",
  "customerName": "Alexander",
  "phone": "932868639",
  "startIso": "2026-08-10T15:00:00-05:00",
  "email": "alexander@example.com"
}

---

## Crear reserva en Barbería B
POST /api/reservations
Body (JSON):
{
  "barberiaId": "barberiaB",
  "serviceId": "corte_clasico_degrade",
  "customerName": "Carlos",
  "phone": "987654321",
  "startIso": "2026-08-10T16:00:00-05:00",
  "email": "carlos@example.com"
}

---

## Crear reserva en Barbería C
POST /api/reservations
Body (JSON):
{
  "barberiaId": "barberiaC",
  "serviceId": "vip_degradado_cejas_exfoliante",
  "customerName": "Luis",
  "phone": "912345678",
  "startIso": "2026-08-10T17:00:00-05:00",
  "email": "luis@example.com"
}

---

## Cancelar reserva (ejemplo Barbería A)
DELETE /api/reservations/2
Headers:
x-admin-pin: TU_PIN_ADMIN

---

## Confirmar reserva (ejemplo Barbería B)
PATCH /api/reservations/3
Headers:
x-admin-pin: TU_PIN_ADMIN

---

## Notas
- El campo "barberiaId" determina qué número de Twilio se usa para enviar el WhatsApp.
- Cada barbería puede tener su propio número oficial de WhatsApp Business.
- Si se usa un solo número compartido, el campo barberiaId sigue siendo útil para personalizar el texto del mensaje.
