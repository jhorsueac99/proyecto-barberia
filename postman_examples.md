# Ejemplos de requests en Postman

## 1. Crear reserva
POST http://localhost:3000/reservations
Body (JSON):
{
  "nombre": "Alexander",
  "phone": "+51932868639",
  "servicio": "Corte clásico",
  "fecha": "2026-08-07T15:00:00"
}

## 2. Cancelar reserva
POST http://localhost:3000/reservations/cancel
Body (JSON):
{
  "nombre": "Alexander",
  "phone": "+51932868639",
  "servicio": "Corte clásico",
  "fecha": "2026-08-07T15:00:00"
}

## 3. Confirmar reserva
POST http://localhost:3000/reservations/confirm
Body (JSON):
{
  "nombre": "Alexander",
  "phone": "+51932868639",
  "servicio": "Corte clásico",
  "fecha": "2026-08-07T15:00:00"
}

Notas:
- Ajusta la URL base si estás probando en Render (ejemplo: https://proyecto-barberia-wdrl.onrender.com/reservations).
- El campo "phone" debe estar vinculado al sandbox de Twilio (+14155238886).
- Cada request debería disparar un mensaje de WhatsApp distinto: creación, cancelación o confirmación.
