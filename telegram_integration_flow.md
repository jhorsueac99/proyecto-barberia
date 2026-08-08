# Flujo de Integración con Telegram

Este flujo describe cómo los clientes se vinculan con el bot de Telegram para recibir notificaciones y gestionar sus citas.

---

## 1. Cliente completa el formulario web
- El formulario pide solo el **username de Telegram** (opcional, formato `@usuario`).
- Un enlace permite abrir el bot: **Abrir Bot de Telegram** → `https://t.me/Charapita_bot`.
- La reserva se guarda con el campo `telegram_username`.

---

## 2. Cliente inicia el bot en Telegram
- El cliente presiona **Start** en el bot.
- El bot captura automáticamente el `telegramId` numérico (`msg.from.id`) de quien escribe.
- Si el cliente tiene username, el bot lo asocia a sus reservas: se guarda `telegram_id` y `chat_id` en cada reserva cuyo `telegram_username` coincida.
- Si el cliente no tiene username, el ID numérico se conserva internamente para notificaciones, sin vínculo por nombre.

---

## 3. Confirmación y notificaciones
- El admin confirma o cancela la cita.
- El cliente recibe notificaciones automáticas en Telegram cuando su cuenta está vinculada:
  - Confirmación ✅
  - Cancelación ❌
  - Recordatorio ⏰

---

## 4. Cancelación del cliente
- El cliente puede cancelar desde el bot con `/cancel` (se busca por su `chat_id`).
- El sistema libera la hora automáticamente.

---

## 5. Panel de administración
- En la columna "Acciones", el admin ve el botón **💬 Telegram** si el cliente registró un `telegram_username`.
- Enlace: `https://t.me/<username>` (sin el `@`).

---

## Notas
- El sistema ya no exige un ID de Telegram para reservar; el ID numérico se llena automáticamente cuando el cliente interactúa con el bot.
- Elimina la necesidad de correos electrónicos.
- Centraliza las notificaciones en un solo canal confiable.
