# 📌 Sistema de Reservas Barbería

Aplicación web para agendar citas en una barbería de forma rápida y sencilla.  
Incluye gestión de reservas, panel de administración y envío de correos de confirmación.

---

## 🚀 Características
- Formulario de reservas con validación.
- Selección de servicios con nombre, precio y descripción.
- Tabla de reservas con estado y acciones.
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
```
**⚠️ Importante:** El archivo `.env` está en `.gitignore` y no debe subirse a GitHub por seguridad.

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
