# Acciones de Contacto con Clientes

Este documento describe las formas de contacto disponibles para el administrador al gestionar reservas en la barbería.

---

## 1. WhatsApp
- Botón en el panel admin: "Contactar por WhatsApp".
- Enlace dinámico: `https://wa.me/<phoneNumber>`.
- Permite abrir directamente el chat con el cliente.
- Recomendado para confirmaciones rápidas y coordinación de detalles.

---

## 2. Telegram
- El cliente registra su username de Telegram (`@usuario`) en el formulario.
- El admin puede abrir el chat directo con el cliente usando ese username: `https://t.me/<username>`.
- El Telegram ID numérico se guarda automáticamente cuando el cliente interactúa con el bot.
- Útil para notificaciones automáticas de confirmación, recordatorios y cancelaciones.

---

## 3. Llamada directa
- El número de teléfono del cliente aparece en la tabla de reservas.
- El admin puede usarlo para llamadas inmediatas en casos urgentes.
- Recomendado para clientes que no usan WhatsApp o Telegram.

---

## 4. Notificaciones del sistema
- El bot envía al admin un resumen de cada nueva cita con:
  - Nombre del cliente
  - Servicio
  - Fecha y hora
  - Teléfono
  - Telegram ID
- Esto asegura que el admin tenga toda la información en un solo lugar.

---

## Nota
- El correo electrónico ha sido eliminado del sistema por no ser usado.
- El teléfono y el Telegram ID son ahora los principales medios de contacto.
- El admin debe priorizar WhatsApp y Telegram para eficiencia, y llamadas directas solo en casos necesarios.
