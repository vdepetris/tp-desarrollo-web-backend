import "dotenv/config";
import cors from "cors";
import express from "express";
import categoriaRoutes from "./routes/categoria.routes";
import productoRoutes from "./routes/producto.routes";
import pedidoRoutes from "./routes/pedido.routes";
import usuarioRoutes from "./routes/usuario.routes";
import marcaRoutes from "./routes/marca.routes";

import { errorHandler } from "./middlewares/errorHandler";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

app.use("/categorias", categoriaRoutes);
app.use("/productos", productoRoutes);
app.use("/pedidos", pedidoRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/marcas", marcaRoutes);


app.use(errorHandler); // ← siempre al final  

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
