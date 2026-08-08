# Plantillas de WhatsApp para Barbería

Estas plantillas deben ser registradas y aprobadas en Twilio/Meta antes de usarse en producción.

---

## reservation_created
Texto:
Hola {{1}}, tu reserva para {{2}} el día {{3}} ha sido REGISTRADA exitosamente.  
¡Gracias por elegir nuestra barbería!

Variables:
- {{1}} → Nombre del cliente
- {{2}} → Nombre del servicio
- {{3}} → Fecha y hora (ISO)

---

## reservation_confirmed
Texto:
Hola {{1}}, tu reserva para {{2}} el día {{3}} ha sido CONFIRMADA.  
¡Te esperamos en la barbería!

Variables:
- {{1}} → Nombre del cliente
- {{2}} → Nombre del servicio
- {{3}} → Fecha y hora (ISO)

---

## reservation_cancelled
Texto:
Hola {{1}}, tu reserva para {{2}} el día {{3}} ha sido CANCELADA.  
Si deseas reprogramar, contáctanos.

Variables:
- {{1}} → Nombre del cliente
- {{2}} → Nombre del servicio
- {{3}} → Fecha y hora (ISO)

---

## Notas
- Estas plantillas deben ser enviadas a aprobación en el panel de Twilio → WhatsApp Templates.
- Una vez aprobadas, se podrán usar en producción con sendWhatsAppTemplate(templateName, reserva).
- Los placeholders {{1}}, {{2}}, {{3}} se reemplazan dinámicamente desde el backend.
