import express from "express";
import categoriaRoutes from "./routes/categoria.routes";
import productoRoutes from "./routes/producto.routes";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

app.use("/categorias", categoriaRoutes);

app.use("/productos", productoRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});