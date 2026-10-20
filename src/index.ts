import "dotenv/config";
import cors from "cors";
import express from "express";
import session from "express-session";
import nodemailer from "nodemailer";
import categoriaRoutes from "./routes/categoria.routes";
import productoRoutes from "./routes/producto.routes";
import pedidoRoutes from "./routes/pedido.routes";
import usuarioRoutes from "./routes/usuario.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173", credentials: true }));

const secret = process.env.SESSION_SECRET;
if (!secret) throw new Error("Falta configurar SESSION_SECRET");

// Cookie HttpOnly: el navegador transporta el identificador, el usuario vive en el servidor.
// El almacén en memoria es para desarrollo; producción requiere uno persistente.
app.use(session({
  secret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

app.use("/categorias", categoriaRoutes);
app.use("/productos", productoRoutes);
app.use("/pedidos", pedidoRoutes);
app.use("/usuarios", usuarioRoutes);

// Credenciales y direcciones de correo se configuran solo en el .env del backend.
const correo = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_PORT === "465",
  requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
});

const intentosContacto = new Map<string, { cantidad: number; vence: number }>();
const asuntosContacto: Record<string, string> = {
  productos: "Productos", pedidos: "Pedidos",
  consulta: "Consulta general", otro: "Otro",
};

app.post("/api/contacto", async (req, res) => {
  const ahora = Date.now();
  for (const [ip, intento] of intentosContacto) {
    if (intento.vence <= ahora) intentosContacto.delete(ip);
  }
  const ip = req.ip ?? "desconocida";
  const intento = intentosContacto.get(ip) ?? { cantidad: 0, vence: ahora + 600000 };
  if (intento.cantidad >= 5 || (!intentosContacto.has(ip) && intentosContacto.size >= 10000)) {
    res.setHeader("Retry-After", "600");
    res.status(429).json({ mensaje: "Demasiados intentos. Probá nuevamente en 10 minutos." });
    return;
  }
  intento.cantidad += 1;
  intentosContacto.set(ip, intento);

  const entrada = req.body;
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
    res.status(400).json({ mensaje: "Revisá los datos del formulario." });
    return;
  }
  const limites: Record<string, number> = { nombre: 100, apellido: 100, email: 254, telefono: 40, asunto: 30, mensaje: 5000 };
  const datos: Record<string, string> = {};
  for (const [campo, limite] of Object.entries(limites)) {
    const valor = entrada[campo] ?? (campo === "telefono" ? "" : undefined);
    if (typeof valor !== "string" || valor.trim().length > limite || (campo !== "telefono" && !valor.trim())) {
      res.status(400).json({ mensaje: "Completá los campos obligatorios y respetá sus límites." });
      return;
    }
    datos[campo] = valor.trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email!) || /[\r\n]/.test(datos.email!) || !Object.hasOwn(asuntosContacto, datos.asunto!)) {
    res.status(400).json({ mensaje: "Revisá el email y el asunto de la consulta." });
    return;
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.MAIL_FROM || !process.env.CONTACT_EMAIL) {
    res.status(503).json({ mensaje: "El servicio de contacto todavía no está disponible." });
    return;
  }
  try {
    const resultado = await correo.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.CONTACT_EMAIL,
      replyTo: datos.email,
      subject: `Consulta: ${asuntosContacto[datos.asunto!]}`,
      text: [
        `Nombre: ${datos.nombre} ${datos.apellido}`,
        `Email: ${datos.email}`,
        `Teléfono: ${datos.telefono || "No indicado"}`,
        "", datos.mensaje,
      ].join("\r\n"),
    });
    if (!resultado.accepted.length) throw new Error("Correo no aceptado");
    res.json({ mensaje: "Tu consulta fue enviada." });
  } catch {
    console.error("No se pudo enviar el correo de contacto.");
    res.status(502).json({ mensaje: "No pudimos enviar tu consulta. Intentá nuevamente más tarde." });
  }
});

app.use(errorHandler); // ← siempre al final

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
