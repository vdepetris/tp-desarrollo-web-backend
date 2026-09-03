import { Router } from "express";
import * as productoController from "../controllers/producto.controller";

const router = Router();

router.get("/", productoController.getProductos);
router.get("/:id", productoController.getProductoPorId);
router.post("/", productoController.postProducto);
router.put("/:id", productoController.putProducto);
router.delete("/:id", productoController.deleteProducto);

export default router;