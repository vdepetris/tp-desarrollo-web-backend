import { Router } from "express";
import * as productoController from "../controllers/producto.controller";

import { requiereSesion, requiereAdmin } from "../middlewares/auth";

const router = Router();

router.get("/", productoController.getProductos);
router.get("/:id", productoController.getProductoPorId);
router.post("/", requiereAdmin, productoController.postProducto);
router.put("/:id", requiereAdmin, productoController.putProducto);
router.delete("/:id", requiereAdmin, productoController.deleteProducto);

export default router;