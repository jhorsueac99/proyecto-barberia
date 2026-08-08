# 📌 Sistema de Reservas Barbería

Aplicación web para agendar citas en una barbería de forma rápida y sencilla.  
Incluye gestión de reservas, panel de administración y notificaciones por WhatsApp y Telegram.

---

## 🚀 Características
- Formulario de reservas con validación.
- El formulario ahora muestra íconos de validación junto a cada campo (nombre, teléfono y Telegram).
- ✅ o 💈 aparece si el dato es correcto.
- ❌ aparece si el dato es inválido.
- Selección de servicios con nombre, precio y descripción.
- Tabla de reservas con estado y acciones, incluida la columna "Teléfono" del cliente.
- Autenticación de administrador.
- Exportación de reservas en formato CSV.
- Diseño moderno, responsive y con logo + fondo personalizados.

---

## 🛠️ Tecnologías utilizadas
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Base de datos:** JSON local
- **Testing:** Jest + ts-jest
- **Despliegue:** Render
- **Control de versiones:** GitHub

---

## 📂 Instalación local
1. Clona el repositorio:
   ```bash
   git clone https://github.com/jhorsueac99/proyecto-barberia.git
   cd proyecto-barberia
   ```
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Compila el proyecto:
   ```bash
   npm run build
   ```
4. Inicia el servidor:
   ```bash
   node dist/server.js
   ```
5. Abre en tu navegador:
   ```
   http://localhost:3000
   ```

---

## 🔑 Variables de entorno
Este proyecto requiere un archivo `.env` con las siguientes variables:
```
MAILGUN_USER=postmaster@TU_DOMINIO.mailgun.org
MAILGUN_API_KEY=tu_api_key_generada_en_mailgun
TELEGRAM_BOT_USERNAME=@Charapita_bot
TELEGRAM_BOT_TOKEN=xxxxxxxxxxxxxxxxxxxx
WHATSAPP_TOKEN=tu_token_de_acceso_de_meta
WHATSAPP_PHONE_ID=tu_phone_number_id_de_whatsapp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+51999999999
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxx
ENABLE_TWILIO=true
TWILIO_SID_A=ACxxxxxxxxxxxxxxxx
TWILIO_TOKEN_A=xxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM_A=whatsapp:+51NUMERO_A
TWILIO_SID_B=ACxxxxxxxxxxxxxxxx
TWILIO_TOKEN_B=xxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM_B=whatsapp:+51NUMERO_B
TWILIO_SID_C=ACxxxxxxxxxxxxxxxx
TWILIO_TOKEN_C=xxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM_C=whatsapp:+51NUMERO_C
```
**⚠️ Importante:** El archivo `.env` está en `.gitignore` y no debe subirse a GitHub por seguridad.

## 📱 Notificaciones por WhatsApp (Twilio)
> **Twilio está activo solo en entorno de pruebas.** En producción se recomienda usar Telegram como canal principal.

El sistema envía mensajes de WhatsApp al cliente en tres casos:
- **Registro de nueva reserva** → confirmación de registro exitoso.
- **Cancelación de reserva** → aviso de cancelación (por administrador o por enlace del cliente).
- **Confirmación de reserva** → aviso de confirmación con fecha y hora.

### Plantillas de WhatsApp
El sistema usa plantillas aprobadas de WhatsApp Business:
- `reservation_created` → aviso de reserva registrada.
- `reservation_cancelled` → aviso de cancelación.
- `reservation_confirmed` → aviso de confirmación.

**⚠️ En producción, Twilio requiere que estas plantillas estén aprobadas por WhatsApp Business** antes de poder enviar mensajes. Con las plantillas aprobadas y un número verificado, los clientes reciben los mensajes desde el número oficial de la barbería, sin necesidad de usar el sandbox.

### Configuración
Los mensajes se envían usando la API de WhatsApp de Twilio. **Los envíos de Twilio solo ocurren cuando `ENABLE_TWILIO=true`** (por defecto el sistema no envía por Twilio). Para activarlos, configura en el entorno:
- `ENABLE_TWILIO=true` (obligatorio para habilitar los envíos; en producción déjalo sin definir o en `false`).
- `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` (obligatorios).
- `TWILIO_WHATSAPP_FROM` (opcional, número verificado, ej. `whatsapp:+51999999999`). Si no se define, se usa el sandbox `+14155238886`.
- `TWILIO_MESSAGING_SERVICE_SID` (opcional, para usar un Messaging Service en producción).

Si no están configurados o `ENABLE_TWILIO` no es `true`, el sistema omite el envío sin errores.

### Multi-barbería
El sistema soporta múltiples barberías. Cada reserva guarda un campo `barberiaId` (`barberiaA`, `barberiaB` o `barberiaC`), y al crear, cancelar o confirmar se envía el WhatsApp desde la barbería correspondiente.

- **Números propios por barbería:** cada barbería puede tener su propio número oficial de WhatsApp Business en Twilio. Configura por cada una:
  - `TWILIO_SID_A`, `TWILIO_TOKEN_A`, `TWILIO_WHATSAPP_FROM_A` → barbería A
  - `TWILIO_SID_B`, `TWILIO_TOKEN_B`, `TWILIO_WHATSAPP_FROM_B` → barbería B
  - `TWILIO_SID_C`, `TWILIO_TOKEN_C`, `TWILIO_WHATSAPP_FROM_C` → barbería C
  - Si una barbería no define SID/token propios, se usan los generales (`TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`).
- **Número compartido:** alternativamente, se puede usar un solo número oficial para todas las barberías, diferenciando el nombre en el mensaje según la reserva.

La selección del número se realiza en `src/config/twilioConfig.ts`. Si el `barberiaId` no existe en la configuración, se usa `barberiaA` por defecto.

---

## 📞 Teléfono como dato principal
- **El sistema ya no solicita ni almacena el correo electrónico.** El teléfono es el único medio de contacto y es obligatorio.
- El formulario pide un teléfono de al menos 9 dígitos. El backend lo valida y, si no es válido, responde: `El teléfono debe ser numérico y tener al menos 9 dígitos.`
- El teléfono aparece en la columna **"Teléfono"** del panel de administración, junto al nombre del cliente.
- **El panel admin ahora incluye un botón de contacto por WhatsApp** en la columna "Acciones" de la tabla de reservas.
- **El administrador puede abrir directamente el chat con el cliente usando el número registrado** (`https://wa.me/<teléfono>`, se abre en una pestaña nueva).
- **Si el cliente no registra un número válido (menos de 9 dígitos), el botón no aparece** y se muestra el mensaje "Teléfono no disponible".
- Cuando se registra una nueva cita, el bot de Telegram notifica al administrador incluyendo el teléfono del cliente en el mensaje.
- El administrador puede contactar al cliente directamente por WhatsApp usando ese número.

---

## 🔒 Privacidad y roles
- **Los clientes solo pueden ver sus propias reservas.** Al consultar `GET /api/reservations`, si se autentica con su username de Telegram (header `x-telegram-username`) o su ID numérico (header `x-telegram-id`), el backend filtra las reservas de ese cliente y omite datos sensibles (teléfono, Telegram ID, chat interno).
- **Los administradores tienen acceso a todos los datos, incluyendo teléfonos y botones de contacto.** Al autenticarse con el PIN de administrador (`x-admin-pin`), se devuelven todas las reservas con la columna "Teléfono" y las acciones de contacto.
- **Esto protege la privacidad de los clientes:** la columna Teléfono y los botones "WhatsApp"/"Llamar" solo se muestran en modo administrador.
- **La vista admin ahora incluye botones de contacto directo: WhatsApp, llamada y Telegram** (con íconos 📱, 📞 y 💬) en la columna "Acciones".
- **Los clientes no ven estos botones en su vista.**

---

## 📅 Regla de disponibilidad
**Solo se permite una cita por hora porque hay un solo barbero disponible.** No importa si el servicio es distinto: la hora queda bloqueada para todos los clientes hasta que se cancele o se confirme.

- Al intentar crear una cita en una hora ya ocupada (estado `pending` o `confirmed`), el sistema responde con el error: `Ya existe una cita en esta hora. Por favor elige otra franja.`
- El cliente puede cancelar su cita en cualquier momento (desde el panel o el enlace de cancelación).
- El admin puede confirmar o cancelar citas. Al confirmar, no se permite confirmar otra cita en la misma hora.
- Al cancelar una cita, la hora queda libre para que otro cliente pueda reservar.

---

## 📅 Inicialización del formulario
- **El formulario inicializa la fecha con el día actual.**
- **La hora sugerida es la siguiente franja disponible:** al cargar, se redondea a la siguiente hora completa dentro del horario laboral (lunes a sábado, 9:00 a.m. – 8:00 p.m.).
- **El cliente puede modificarla si lo desea.**
- Si el cliente elige una fecha/hora fuera del horario de atención, el backend la ajusta automáticamente a la siguiente franja válida y lo indica en la respuesta (campo `adjusted`).

---

## ⏰ Recordatorios automáticos
El sistema envía recordatorios de la cita por WhatsApp y Telegram:
- **Recordatorio automático 1 hora antes de la cita** cuando la cita se agenda con al menos 60 minutos de anticipación.
- Si la cita está muy próxima (menos de 60 minutos y más de 10 minutos de anticipación), el sistema ajusta el tiempo y programa el recordatorio para 30 minutos antes.
- Si la cita está a menos de 10 minutos, el sistema envía el aviso inmediato.

El mensaje del recordatorio es: `Recordatorio: Tu cita de [servicio] es a las [hora].`

---

## 🔓 Cancelación tardía (bloqueo inteligente)
- **Si un cliente cancela con menos de 1 hora de anticipación, la cita se marca como cancelación tardía pero la franja horaria se libera automáticamente para otro cliente.**
- **Esto evita que el barbero pierda tiempo y permite aprovechar mejor la agenda.**
- La cancelación normal (más de 1 hora de anticipación) también libera la franja.
- Al cancelar, el cliente recibe un aviso por WhatsApp y Telegram según el caso:
  - Cancelación tardía → "⚠️ La cita fue cancelada muy cerca de la hora programada. La franja se ha liberado para otro cliente."
  - Cancelación normal → "❌ La cita ha sido cancelada. La franja se ha liberado."
- Al crear una reserva solo se valida que no exista otra cita en la misma hora con estado `pending` o `confirmed`; las citas canceladas (incluidas las tardías) no bloquean la hora.

---

## 🤖 Bot de Telegram
El sistema incluye un bot interactivo de Telegram que responde los siguientes comandos:
- `/start` → Bienvenida
- `/myid` → Obtener ID
- `/cancel` → Cancelar cita
- `/help` → Ver ayuda

- **El sistema ahora pide solo el Telegram username en el formulario** (opcional, formato `@usuario`).
- **El Telegram ID numérico se guarda automáticamente cuando el cliente interactúa con el bot:** al recibir cualquier mensaje, el bot captura el `telegram_id` del cliente y lo asocia a las reservas que tengan su username (campo `telegram_username`). Si el cliente no tiene username, el ID numérico se conserva internamente para notificaciones.
- El comando `/cancel` cancela la cita próxima del cliente (buscada por su `chat_id`, que se llena al vincular el bot) usando el servicio de reservas y libera la franja horaria.
- El bot se inicializa automáticamente al iniciar el servidor usando `TELEGRAM_BOT_TOKEN`. Si el token no está configurado, el bot no se inicia.

## 🤖 Telegram en el formulario
- **El botón de Telegram abre siempre `https://t.me/Charapita_bot`** (enlace web, sin `tg://`, para que funcione en cualquier navegador sin la app instalada). El username se obtiene de `TELEGRAM_BOT_USERNAME` en `.env`.
- **El cliente debe escribir `/start` al abrir el bot.**
- **Si escribe otro mensaje, el bot le recordará usar `/start`.**
- **Al enviar `/start`, el sistema guarda automáticamente su `telegram_id`** y lo asocia a sus reservas por username si existe.
- El formulario incluye un campo opcional de Telegram (`@usuario`), validado con `@` y caracteres válidos.
- **El administrador puede abrir chat directo si el cliente registró su username** (`https://t.me/<username>`, sin el `@`). Aunque no haya username, el bot puede enviar notificaciones porque ya tiene el `telegram_id`.

Las variables relacionadas:
- `TELEGRAM_BOT_USERNAME=@Charapita_bot` → username del bot mostrado en el formulario.
- `TELEGRAM_BOT_TOKEN=xxxxxxxxxxxxxxxxxxxx` → token del bot.

---

## ⚠️ Citas de aviso corto (short notice)
- **Las citas reservadas con menos de 2 horas de anticipación se consideran de aviso corto.**
- **Estas citas no pueden cancelarse sin penalización.**
- **El sistema muestra automáticamente un aviso cuando la cita está dentro de las próximas 2 horas.**
- **El aviso corto y el checkbox aparecen automáticamente si la hora seleccionada está dentro de las próximas 2 horas** — incluso con la hora por defecto que inicializa el formulario, sin necesidad de que el cliente la modifique.
- **El cliente debe marcar el checkbox para poder crear la reserva.**
- **El componente `ShortNoticeWarning` muestra automáticamente un aviso cuando la cita está dentro de las próximas 2 horas.**
- **Este componente puede reutilizarse en el formulario, panel admin o cualquier vista que requiera mostrar la política.**

El componente se encuentra en `src/components/short_notice_warning.tsx` y recibe dos props:
- `hoursDifference`: horas entre la hora actual y la hora seleccionada.
- `onAccept`: callback que notifica si el cliente marcó el checkbox de aceptación.

Uso en el formulario de reserva:
```tsx
import ShortNoticeWarning from '../components/short_notice_warning';

<ShortNoticeWarning
  hoursDifference={calculatedHoursDifference}
  onAccept={(accepted) => setShortNoticeAccepted(accepted)}
/>
```

El aviso en el formulario es: "⚠️ Aviso: Las citas reservadas con menos de 2 horas de anticipación no pueden cancelarse sin penalización." y aparece un checkbox obligatorio "Acepto la política de aviso corto."
- Si el cliente no marca el checkbox, el sistema responde con el error: `Debes aceptar la política de aviso corto para continuar con la reserva.`
- Al crear la cita se guardan los flags `short_notice = true` y `short_notice_accepted`.
- Al cancelar una cita con aviso corto, el sistema la clasifica como cancelación tardía (`cancellationType = "late"`) y registra una alerta para el administrador.

---

## 🌐 Despliegue en Render
El proyecto está desplegado en Render:
👉 [https://proyecto-barberia.onrender.com](https://proyecto-barberia.onrender.com)

Cada vez que se hace `git push` a la rama `main`, Render actualiza automáticamente la aplicación.

---

## 📸 Capturas de pantalla
(Agrega imágenes en la carpeta `/assets/screenshots/` y referencia aquí con Markdown)

---

## 👨‍💻 Autor
**Alexander Jhorsue Asto Calderón**  
QA Manual en transición hacia QA Automation | Estudiante de Ingeniería de Sistemas | Desarrollador de proyectos web.

---

## 📜 Licencia
Este proyecto está bajo la licencia MIT. Puedes usarlo, modificarlo y distribuirlo libremente.
