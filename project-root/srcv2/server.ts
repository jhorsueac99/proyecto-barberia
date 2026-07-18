import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, "../public")));

// Ruta raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} - server.ts:16`);
});

app.get("/", (req, res) => {
  res.send("API Proyecto Barbería funcionando 🚀");
});
