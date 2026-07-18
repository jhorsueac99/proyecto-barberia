# Reserva de Barbería

Sistema simple de reservas para una barbería con backend en Express y TypeScript, persistencia en archivo JSON y frontend básico para gestionar reservas desde el navegador.

## Descripción breve

Este proyecto permite:
- ver los servicios disponibles,
- crear nuevas reservas,
- confirmar reservas,
- cancelar reservas,
- exportar las reservas a CSV,
- enviar notificaciones a Telegram al crear, confirmar o cancelar una reserva.

## Requisitos previos

- Node.js 18 o superior
- npm
- TypeScript

## Instalación local

1. Clona o descarga el proyecto.
2. Entra a la carpeta del proyecto:
   ```bash
   cd Proyecto Barberia v1
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Crea un archivo `.env` con las variables de entorno necesarias:
   ```env
   PORT=3000
   TELEGRAM_TOKEN=TU_TOKEN_DE_TELEGRAM
   TELEGRAM_CHAT_ID=TU_CHAT_ID
   ```
5. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
6. Abre la aplicación en:
   ```text
   http://localhost:3000
   ```

## Variables de entorno

El proyecto usa un archivo `.env` con estas variables:

- `PORT`: puerto donde correrá el servidor.
- `TELEGRAM_TOKEN`: token del bot de Telegram.
- `TELEGRAM_CHAT_ID`: identificador del chat donde se enviarán las notificaciones.

Ejemplo:
```env
PORT=3000
TELEGRAM_TOKEN=123456:ABCDEF
TELEGRAM_CHAT_ID=987654321
```

## Endpoints disponibles

### Servicios
- `GET /api/services` → devuelve la lista de servicios disponibles.

### Reservas
- `GET /api/reservations` → devuelve todas las reservas.
- `POST /api/reservations` → crea una nueva reserva.
- `PATCH /api/reservations/:id` → confirma una reserva.
- `DELETE /api/reservations/:id` → cancela una reserva.
- `GET /api/reservations/export` → descarga un archivo CSV con las reservas.

## Funcionalidades del frontend

La interfaz permite:
- crear reservas con nombre, teléfono, servicio y fecha,
- confirmar reservas desde la tabla,
- cancelar reservas con confirmación previa,
- descargar las reservas en formato CSV.

## Integración con Telegram

Cuando se crea, confirma o cancela una reserva, el sistema envía un mensaje al chat configurado en `TELEGRAM_CHAT_ID` usando el bot definido por `TELEGRAM_TOKEN`.

### Ejemplo de notificación recibida

```text
Nueva reserva
ID: 3
Cliente: Ana
Servicio: Corte clásico
Inicio: 2026-07-19T13:00:00
```

## Tecnologías usadas

- Express.js para la API REST
- TypeScript para tipado y desarrollo más seguro
- LowDB para persistencia en archivo JSON
- dotenv para manejar variables de entorno
- Axios para la integración con Telegram

## Scripts disponibles

- `npm run dev` → inicia el servidor en modo desarrollo.
- `npm run build` → compila TypeScript a JavaScript.
- `npm start` → inicia la versión compilada.

## Despliegue en Render

### 1. Subir el proyecto a GitHub

1. Crea un repositorio en GitHub.
2. Desde la carpeta del proyecto, inicializa Git si todavía no lo tienes:
   ```bash
   git init
   ```
3. Añade todos los archivos:
   ```bash
   git add .
   ```
4. Haz el primer commit:
   ```bash
   git commit -m "Primer despliegue"
   ```
5. Conecta tu repositorio remoto:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   ```
6. Sube los cambios:
   ```bash
   git push -u origin main
   ```

> Si tu rama se llama `master`, cambia `main` por `master`.

### 2. Crear un servicio Web en Render

1. Entra a https://render.com.
2. Inicia sesión con tu cuenta de GitHub.
3. Ve a "New" y selecciona "Web Service".
4. Conecta el repositorio que acabas de subir.
5. Render detectará automáticamente el proyecto Node.js.

### 3. Configurar los comandos de build y start

En la configuración del servicio, usa:
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

### 4. Añadir variables de entorno

En la sección de Environment Variables de Render agrega:
- `PORT=10000` (Render lo asigna automáticamente, pero puedes dejarlo configurado)
- `TELEGRAM_TOKEN=tu_token_real`
- `TELEGRAM_CHAT_ID=tu_chat_id_real`

### 5. Entender el puerto en Render

Render asigna el puerto automáticamente a través de la variable `PORT`.
Tu servidor ya está preparado para usarla en [src/server.ts](src/server.ts) con:
```ts
const PORT = Number(process.env.PORT) || 3000;
```

Eso significa que en local el puerto será `3000`, mientras que en Render se usará el puerto que Render proporcione.

### 6. Verificar el despliegue

1. Haz clic en "Deploy" o "Create Web Service".
2. Espera a que Render termine el build.
3. Abre la URL pública que Render te proporcione.
4. Prueba estas rutas:
   - `https://TU_URL/render` → página principal
   - `https://TU_URL/api/ping` → debe responder con `{ ok: true, message: 'pong' }`
   - `https://TU_URL/api/services` → debe devolver los servicios

### 7. Solución de errores comunes

- Puerto ocupado:
  - en local, asegúrate de que no haya otra app corriendo en el puerto 3000.
  - en Render, no necesitas fijar el puerto manualmente; usa `process.env.PORT`.

- Variables de entorno mal configuradas:
  - revisa que `TELEGRAM_TOKEN` y `TELEGRAM_CHAT_ID` estén bien escritos en Render.
  - si Telegram no envía mensajes, prueba con un mensaje de prueba desde el terminal.

- Error al compilar:
  - revisa los logs de Render en la pestaña "Logs".
  - confirma que `npm install` y `npm run build` se ejecutan correctamente.

- Error 500 o app no responde:
  - revisa los logs del servicio.
  - verifica que `npm start` está arrancando el proyecto correctamente.

## Ejemplo de uso

### Crear una reserva
1. Abre la aplicación en `http://localhost:3000`.
2. Completa el formulario con nombre, teléfono, servicio y fecha futura.
3. Haz clic en “Crear reserva”.

### Confirmar o cancelar
1. En la tabla de reservas, usa los botones “Confirmar” o “Cancelar”.
2. Para cancelar, se pedirá confirmación antes de proceder.

### Exportar a CSV
1. Haz clic en el botón “Descargar CSV”.
2. Se descargará un archivo `reservations.csv` con las reservas actuales.

### Capturas de pantalla del frontend

#### Formulario de creación de reserva
![Formulario de reserva](https://via.placeholder.com/800x400?text=Formulario+de+Reserva)

#### Tabla de reservas creadas y confirmadas
![Tabla de reservas](https://via.placeholder.com/800x400?text=Reservas+creadas+y+confirmadas)

#### Exportación CSV
![Exportación CSV](https://via.placeholder.com/800x400?text=Exportar+CSV)

## Próximos pasos

Ideas de mejoras futuras:
- integrar una base de datos real como MongoDB o PostgreSQL,
- agregar autenticación de usuarios y roles,
- mejorar el diseño visual con CSS moderno y componentes reutilizables,
- añadir calendario y disponibilidad por día,
- implementar pagos y recordatorios automáticos.

## Notas

- La persistencia actual se guarda en un archivo JSON dentro del proyecto.
- Para producción, puedes reemplazar la persistencia local por una base de datos como MongoDB o PostgreSQL.
