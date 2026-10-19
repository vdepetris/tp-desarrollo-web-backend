import "dotenv/config";
import cors from "cors";
import express from "express";
import session from "express-session";
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


app.use(errorHandler); // ← siempre al final

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
